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
import { Buffer } from 'buffer';

import { Game, GamePlayer } from 'server/data/models';
import { createProbablyUniqueName } from 'server/utils';
import { GameState, GameClientState, Player } from 'shared/types';
import { minPlayers, maxDescriptionLength, maxImgSize } from 'shared/config';
import { randomInt } from '../utils';

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

async function handleTurnChange(game: Game, newTurn: number): Promise<void> {
  if (!game.gamePlayers) throw TypeError('Missing game.gamePlayers');
  // TODO: this is where notifications will go eventually

  if (newTurn >= game.gamePlayers.length) {
    await game.update({
      state: GameState.Complete,
    });
    return;
  }

  if (game.turn === newTurn) return;
  await game.update({ turn: newTurn });
}

export async function leaveGame(game: Game, userId: string): Promise<void> {
  if (!game.gamePlayers) throw TypeError('Missing game.gamePlayers');

  const playerIndex = game.gamePlayers.findIndex(
    player => player.userId === userId,
  );
  if (playerIndex === -1) return;
  const player = game.gamePlayers[playerIndex];

  if (player.isAdmin) throw Error('Admin cannot leave a game');

  if (game.state === GameState.Complete) {
    throw Error('Cannot leave a completed game');
  }

  if (game.state === GameState.Playing) {
    if (game.turn > player.order!) {
      throw Error('Player cannot be removed if already played');
    }
    // Remove player, reorder other players
    await Promise.all([
      // If the current player is changing, handle notifications.
      // Also, if this is the last player, the game ends.
      player.order === game.turn
        ? handleTurnChange(game, game.turn)
        : undefined,
      // Reorder the remaining players
      setOrderOnPlayers(game.gamePlayers.slice(playerIndex + 1), {
        startAt: player.order!,
      }),
      player.destroy(),
    ]);
    gameChanged(game.id);
    return;
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

interface SetOrderOnPlayersOptions {
  startAt?: number;
}

function setOrderOnPlayers(
  players: GamePlayer[],
  { startAt = 0 }: SetOrderOnPlayersOptions = {},
): Promise<void> {
  return Promise.all(
    players.map((player, i) => player.update({ order: i + startAt })),
  ).then(() => undefined);
}

export async function startGame(game: Game): Promise<void> {
  if (game.state !== GameState.Open) throw Error('Game already started');
  if (!game.gamePlayers) throw TypeError('Missing game.gamePlayers');
  if (game.gamePlayers.length < minPlayers) throw Error('Not enough players');

  const playersToRandomise = [...game.gamePlayers];
  const randomPlayers: GamePlayer[] = [];

  // Pick players in random order
  while (playersToRandomise.length !== 0) {
    const pickedPlayer = playersToRandomise.splice(
      randomInt(playersToRandomise.length),
      1,
    )[0];
    randomPlayers.push(pickedPlayer);
  }

  await Promise.all<unknown>([
    game.update({
      state: GameState.Playing,
    }),
    setOrderOnPlayers(randomPlayers),
  ]);

  gameChanged(game.id);
}

function sanitizeDrawingData(json: string): string {
  let imageData;
  try {
    imageData = JSON.parse(json);
  } catch (err) {
    throw Error('Invalid JSON');
  }

  const dpr = Number(imageData.dpr);
  const width = Math.round(Number(imageData.width));
  const height = Math.round(Number(imageData.height));
  const data = String(imageData.data);

  if (dpr <= 0 || dpr > 8) throw Error('Invalid DPR');

  if (width <= 0 || width > maxImgSize || height <= 0 || height > maxImgSize) {
    throw Error('Invalid image size');
  }

  try {
    Buffer.from(data, 'base64');
  } catch (err) {
    console.error(err);
    throw Error('Invalid path data');
  }

  return JSON.stringify({
    data,
    width,
    height,
    dpr,
  });
}

export async function playTurn(
  game: Game,
  player: GamePlayer,
  turnData: string,
): Promise<void> {
  const trimmedTurnData = turnData.trim();

  if (!game.gamePlayers) throw TypeError('Missing game.gamePlayers');
  if (game.gamePlayers[player.order!].userId !== player.userId) {
    throw Error(`You're not a player in this game`);
  }
  if (game.turn !== player.order || game.state !== GameState.Playing) {
    throw Error(`It isn't your turn`);
  }
  const isDrawing = !!(player.order % 2);

  let sanitizedTurnData: string;

  if (isDrawing) {
    sanitizedTurnData = sanitizeDrawingData(trimmedTurnData);
  } else {
    // Is description
    if (trimmedTurnData.length > maxDescriptionLength) {
      throw Error('Description too long');
    }
    sanitizedTurnData = trimmedTurnData;
  }

  await player.update({ turnData: trimmedTurnData });
  await handleTurnChange(game, game.turn + 1);
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
