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

import { Game, Player, Thread, Turn } from 'server/data/models';
import {
  createProbablyUniqueName,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from 'server/utils';
import {
  GameState,
  Player as SharedPlayer,
  Game as SharedGame,
  Thread as SharedThread,
  Turn as SharedTurn,
  TurnType,
  GamePageData,
  ActiveTurnData,
} from 'shared/types';
import { minPlayers, maxDescriptionLength, maxImgSize } from 'shared/config';
import { randomInt } from '../utils';
import { Op } from 'sequelize';
import { maxOpenGamesPerUser } from 'server/config';

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

/**
 * @param user Current user.
 * @returns ID of the new game.
 */
export async function createGame(
  user: UserSession,
  playerName: string,
  hideAvatar: boolean,
): Promise<string> {
  const openGames = await countUncompleteGamesOwnedByUser(user.id);

  if (openGames > maxOpenGamesPerUser) {
    throw new ForbiddenError(
      `Too many open games. Please finish some of your other games, or cancel them.`,
    );
  }

  const sanitisedPlayerName = playerName.trim().slice(0, 35);

  if (!sanitisedPlayerName) {
    throw new BadRequestError('Player name cannot be empty');
  }

  while (true) {
    const id = createProbablyUniqueName();

    // Try again if there's already a game with this ID (highly unlikely)
    if (await Game.count({ where: { id } })) continue;

    const game = await Game.create({ id });

    await game.createPlayer({
      userId: user.id,
      name: sanitisedPlayerName,
      avatar: hideAvatar ? undefined : user.picture,
      isAdmin: true,
    });

    return game.id;
  }
}

function getDBGame(id: string) {
  return Game.findByPk(id, {
    include: [Player, Thread],
    order: [
      [Player, 'order'],
      [Thread, 'turnOffset'],
    ],
  });
}

async function getLastPlayedTurnForThread(thread: SharedThread) {
  if (thread.turn === 0) return null;

  return Turn.findOne({
    where: {
      type: { [Op.not]: TurnType.Skip },
      threadId: thread.id,
    },
    order: [['createdAt', 'DESC']],
  });
}

function countUncompleteGamesOwnedByUser(userId: string): Promise<number> {
  return Player.count({
    where: { userId, isAdmin: true },
    include: [
      { model: Game, where: { state: { [Op.ne]: GameState.Complete } } },
    ],
  });
}

export async function getUsersGames(userId: string): Promise<SharedGame[]> {
  const gamePlayers = await Player.findAll({
    where: { userId },
    include: [Game],
    order: [[Game, 'createdAt', 'DESC']],
  });

  return gamePlayers.map((gamePlayer) => gameToSharedGame(gamePlayer.game!));
}

export async function getGamePageData(
  gameId: string,
  userId?: string,
): Promise<GamePageData | null> {
  const gameDB = await getDBGame(gameId);
  if (!gameDB) return null;
  const game = gameToSharedGame(gameDB);
  const toReturn: GamePageData = {
    game,
    // It's important that these are explicitly set to null, for setState()
    ...emptyActiveTurnData,
  };

  if (game.state === GameState.Complete) {
    // If game is complete, add in turn data.
    const turnsDB = await Turn.findAll({
      where: {
        threadId: { [Op.in]: game.threads!.map((thread) => thread.id) },
      },
      order: [
        ['threadId', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
    const turnObjsByThreadId = new Map<number, SharedTurn[]>();

    // Organise into threads
    for (const turnDB of turnsDB) {
      if (!turnObjsByThreadId.has(turnDB.threadId)) {
        turnObjsByThreadId.set(turnDB.threadId, []);
      }
      const turns = turnObjsByThreadId.get(turnDB.threadId)!;
      turns.push(turnToSharedTurn(turnDB));
    }

    // Add into the object
    for (const thread of game.threads!) {
      thread.turns = turnObjsByThreadId.get(thread.id)!;
    }
  }

  if (userId) {
    Object.assign(toReturn, await getActiveTurnDataForPlayer(game, userId));
  }

  return toReturn;
}

const emptyActiveTurnData: ActiveTurnData = {
  inPlayThread: null,
  lastTurnInThread: null,
};

export async function getActiveTurnDataForPlayer(
  game: SharedGame,
  userId: string,
): Promise<ActiveTurnData> {
  if (game.state !== GameState.Playing) return emptyActiveTurnData;

  const player =
    userId && game.players!.find((player) => player.userId === userId);

  if (!player) return emptyActiveTurnData;

  const activeThread = game
    .threads!.filter(pendingThreadsFilter(player))
    .sort((a, b) => Number(a.turnUpdatedAt) - Number(b.turnUpdatedAt))[0];

  if (!activeThread) return emptyActiveTurnData;

  return {
    inPlayThread: activeThread,
    lastTurnInThread: await getLastPlayedTurnForThread(activeThread),
  };
}

export async function joinGame(id: string, user: UserSession): Promise<void> {
  const game = await getDBGame(id);
  if (!game) throw new NotFoundError('Cannot find game');
  if (game.state !== GameState.Open) {
    throw new ForbiddenError('Game not open to players');
  }
  // Quick exit if player already exists
  if (game.players!.some((player) => player.userId === user.id)) return;

  await game.createPlayer({
    userId: user.id,
    name: user.name,
    avatar: user.picture,
    isAdmin: false,
  });

  gameChanged(game.id);
}

async function handleTurnChanges(game: Game): Promise<void> {
  if (game.threads!.every((thread) => thread.complete)) {
    await game.update({
      state: GameState.Complete,
    });
  }
}

interface CreateTurnData {
  type: TurnType;
  data?: string;
}

async function createTurn(
  thread: Thread,
  players: Player[],
  turnData: CreateTurnData,
): Promise<void> {
  const player = players[(thread.turn + thread.turnOffset) % players.length];
  const updatedThreadPromise =
    thread.turn + 1 === players.length
      ? thread.update({
          complete: true,
        })
      : thread.update({
          turn: thread.turn + 1,
          turnUpdatedAt: new Date(),
        });

  await Promise.all([
    thread.createTurn({ ...turnData, playerId: player.id }),
    updatedThreadPromise,
  ]);

  const updatedThread = await updatedThreadPromise;
  if (updatedThread.complete) return;

  const nextPlayer =
    players[(updatedThread.turn + updatedThread.turnOffset) % players.length];

  if (nextPlayer.leftGame) {
    createTurn(updatedThread, players, { type: TurnType.Skip });
  }
}

/**
 * Create a filter that applies to an array of thread.
 *
 * @param player
 * @returns The threads that are waiting on player
 */
const pendingThreadsFilter = (player: SharedPlayer) => (
  thread: SharedThread,
  _: number,
  threads: SharedThread[],
) =>
  !thread.complete &&
  (thread.turn + thread.turnOffset) % threads.length === player.order;

/**
 *
 * @param gameId
 * @param userId
 * @param currentUserId The ID of the user requesting the removal
 */
export async function leaveGame(
  gameId: string,
  userId: string,
  currentUserId: string,
): Promise<void> {
  const game = await getDBGame(gameId);
  if (!game) throw new NotFoundError('Cannot find game');

  const player = game.players!.find((player) => player.userId === userId);
  if (!player) return;

  if (player.isAdmin) {
    throw new ForbiddenError('Admin cannot leave a game');
  }

  if (game.state === GameState.Complete) {
    throw new ForbiddenError('Cannot leave a completed game');
  }

  if (userId !== currentUserId) {
    const currentPlayer = game.players!.find(
      (player) => player.userId === currentUserId,
    );
    if (!currentPlayer || !currentPlayer.isAdmin) {
      throw new ForbiddenError(
        'Only the admin can remove others from the game',
      );
    }
  }

  if (game.state === GameState.Open) {
    await player.destroy();
    gameChanged(game.id);
  } else {
    const pendingThreads = game.threads!.filter(pendingThreadsFilter(player));

    await Promise.all<unknown>([
      player.update({
        leftGame: true,
      }),
      // Create skip turns for any waiting threads
      ...pendingThreads.map((thread) =>
        createTurn(thread, game.players!, {
          type: TurnType.Skip,
        }),
      ),
    ]);

    await handleTurnChanges(game);
  }

  gameChanged(game.id);
}

export async function cancelGame(
  gameId: string,
  currentUserId: string,
): Promise<void> {
  const game = await getDBGame(gameId);
  if (!game) throw new NotFoundError('Cannot find game');
  if (game.state === GameState.Complete) {
    throw new ForbiddenError('Game already complete');
  }

  const player = game.players!.find(
    (player) => player.userId === currentUserId,
  );

  if (!player || !player.isAdmin) {
    throw new ForbiddenError('Only admins can cancel a game');
  }
  await game.destroy();
  gameChanged(game.id);
}

export async function startGame(
  gameId: string,
  currentUserId: string,
): Promise<void> {
  const game = await getDBGame(gameId);
  if (!game) throw new NotFoundError('Cannot find game');
  if (game.state !== GameState.Open) {
    throw new ForbiddenError('Game already started');
  }
  if (game.players!.length < minPlayers) {
    throw new ForbiddenError('Not enough players');
  }

  const player = game.players!.find(
    (player) => player.userId === currentUserId,
  );

  if (!player || !player.isAdmin) {
    throw new ForbiddenError('Only admins can cancel a game');
  }

  const playersToRandomise = [...game.players!];
  const randomPlayers: Player[] = [];

  // Pick players in random order
  while (playersToRandomise.length !== 0) {
    const pickedPlayer = playersToRandomise.splice(
      randomInt(playersToRandomise.length),
      1,
    )[0];
    randomPlayers.push(pickedPlayer);
  }

  await Promise.all([
    game.update({
      state: GameState.Playing,
    }),
    // Set order on players
    randomPlayers.map((player, i) => player.update({ order: i })),
    // Create game threads, one per player
    randomPlayers.map((_, i) => game.createThread({ turnOffset: i })),
  ]);

  gameChanged(game.id);
}

function sanitizeDrawingData(json: string): string {
  let imageData;
  try {
    imageData = JSON.parse(json);
  } catch (err) {
    throw new BadRequestError('Invalid JSON');
  }

  const width = Math.round(Number(imageData.width));
  const height = Math.round(Number(imageData.height));
  const data = String(imageData.data);

  if (width <= 0 || width > maxImgSize || height <= 0 || height > maxImgSize) {
    throw new ForbiddenError('Invalid image size');
  }

  try {
    Buffer.from(data, 'base64');
  } catch (err) {
    console.error(err);
    throw new ForbiddenError('Invalid path data');
  }

  return JSON.stringify({ data, width, height });
}

export async function playTurn(
  gameId: string,
  threadId: number,
  userId: string,
  turnData: string,
): Promise<void> {
  const game = await getDBGame(gameId);
  if (!game) throw new NotFoundError('Cannot find game');
  const player = game.players!.find((player) => player.userId === userId);
  if (!player) throw new NotFoundError('Cannot find player in this game');
  const thread = game.threads!.find((thread) => thread.id === threadId);
  if (!thread) throw new NotFoundError('Cannot find thread in game');

  const isPlayersTurn =
    !thread.complete &&
    (thread.turn + thread.turnOffset) % game.players!.length === player.order;

  if (!isPlayersTurn) throw new ForbiddenError(`It isn't this player's turn`);

  const lastPlayedTurn = await getLastPlayedTurnForThread(thread);
  const turnType =
    lastPlayedTurn?.type === TurnType.Describe
      ? TurnType.Draw
      : TurnType.Describe;

  const trimmedTurnData = turnData.trim();

  let sanitizedTurnData: string;

  if (turnType === TurnType.Draw) {
    sanitizedTurnData = sanitizeDrawingData(trimmedTurnData);
  } else {
    // Is description
    if (trimmedTurnData.length > maxDescriptionLength) {
      throw new ForbiddenError('Description too long');
    }
    sanitizedTurnData = trimmedTurnData;
  }

  await createTurn(thread, game.players!, {
    type: turnType,
    data: sanitizedTurnData,
  });

  await handleTurnChanges(game);
  gameChanged(game.id);
}

const gameToSharedGame = (game: Game): SharedGame => ({
  id: game.id,
  state: game.state,
  players: game.players?.map((player) => ({
    id: player.id,
    userId: player.userId,
    name: player.name,
    avatar: player.avatar,
    isAdmin: player.isAdmin,
    leftGame: player.leftGame,
    order: player.order,
  })),
  threads: game.threads?.map((thread) => ({
    id: thread.id,
    turn: thread.turn,
    turnOffset: thread.turnOffset,
    complete: thread.complete,
    turnUpdatedAt: thread.turnUpdatedAt,
    turns: thread.turns?.map((turn) => turnToSharedTurn(turn)),
  })),
});

const turnToSharedTurn = (turn: Turn): SharedTurn => ({
  id: turn.id,
  playerId: turn.playerId,
  type: turn.type,
  data: turn.data,
});
