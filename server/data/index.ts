/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EventEmitter } from 'events';

import { Game, GamePlayer } from 'server/data/models';
import { createProbablyUniqueName } from 'server/utils';
import { GameState, GameClientState, Player } from 'shared/types';

type GameChangeCallback = (gameId: string) => void;

interface DataEmitter extends EventEmitter {
  addListener(event: 'gamechange', callback: GameChangeCallback): this;
  emit(event: 'gamechange', ...args: Parameters<GameChangeCallback>): boolean;
  on(event: 'gamechange', callback: GameChangeCallback): this;
  once(event: 'gamechange', callback: GameChangeCallback): this;
  prependListener(event: 'gamechange', callback: GameChangeCallback): this;
  prependOnceListener(event: 'gamechange', callback: GameChangeCallback): this;
  removeListener(event: 'gamechange', callback: GameChangeCallback): this;
}

export const emitter: DataEmitter = new EventEmitter();

function gameChanged(gameId: string) {
  emitter.emit('gamechange', gameId);
}

export async function createGame(user: UserSession) {
  while (true) {
    const id = createProbablyUniqueName();

    // Try again if there's already a game with this ID (highly unlikely)
    if (await Game.count({ where: { id } })) continue;

    const game = await Game.create({ id });

    game.createGamePlayer({
      userId: user.id,
      name: user.name,
      avatar: user.picture,
      isAdmin: true,
    });

    return game.id;
  }
}

export function getGame(id: string) {
  return Game.findByPk(id, {
    include: [GamePlayer],
    order: [[GamePlayer, 'order']],
  });
}

export interface UserGames {
  game: Game;
  waitingOnPlayer: boolean;
}

export async function getUsersGames(user: UserSession): Promise<UserGames[]> {
  const gamePlayers = await GamePlayer.findAll({
    where: { userId: user.id },
    include: [Game],
  });

  return gamePlayers.map(gamePlayer => ({
    game: gamePlayer.game!,
    waitingOnPlayer: gamePlayer.game!.turn === gamePlayer.order,
  }));
}

export async function joinGame(game: Game, user: UserSession): Promise<void> {
  if (game.state !== GameState.Open) throw Error('Game already started');
  if (!game.gamePlayers) throw TypeError('Missing game.gamePlayers');
  // Quick exit if player already exists
  if (game.gamePlayers.some(player => player.userId === user.id)) return;

  await game.createGamePlayer({
    userId: user.id,
    name: user.name,
    avatar: user.picture,
    isAdmin: false,
  });

  gameChanged(game.id);
}

export async function leaveGame(game: Game, user: UserSession): Promise<void> {
  if (!game.gamePlayers) throw TypeError('Missing game.gamePlayers');

  const player = game.gamePlayers.find(player => player.userId === user.id);
  if (!player) return;

  if (player.isAdmin) throw Error('Admin cannot leave a game');

  if (game.state === GameState.Complete) {
    throw Error('Cannot leave a completed game');
  }

  if (game.state === GameState.Playing) {
    if (game.turn === player.order) {
      // TODO: remove player, reorder other players, then pass things onto the next player
      throw Error('Not implemented');
    }
    if (game.turn > player.order!) throw Error('Already played');
    // TODO: remove player, reorder other players
    throw Error('Not implemented');
  }

  // Game state must be GameState.Open
  await player.destroy();
  gameChanged(game.id);
}

export async function cancelGame(game: Game): Promise<void> {
  if (game.state === GameState.Complete) throw Error('Game already complete');
  await game.destroy();
  gameChanged(game.id);
}

export async function getGameClientState(
  id: string,
): Promise<GameClientState | undefined> {
  const game = await getGame(id);
  if (!game) return;
  return gameToClientState(game);
}

export function gameToClientState(game: Game): GameClientState {
  return {
    game: {
      id: game.id,
      state: game.state,
      turn: game.turn,
    },
    players: game.gamePlayers!.map(player => {
      const playerData: Player = {
        avatar: player.avatar,
        isAdmin: player.isAdmin,
        name: player.name,
        order: player.order,
        userId: player.userId,
      };

      // The turn data for the previous player is needed.
      if (player.order === game.turn - 1) {
        playerData.turnData = player.turnData;
      }

      return playerData;
    }),
  };
}

export function removeTurnDataFromState(
  state: GameClientState,
): GameClientState {
  return {
    ...state,
    players: state.players.map(player => {
      if (!player.turnData) return player;
      const playerCopy = { ...player };
      delete playerCopy.turnData;
      return playerCopy;
    }),
  };
}
