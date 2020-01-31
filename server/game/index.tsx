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
import { Socket } from 'net';
import { parse as parseURL } from 'url';

import { Router, Request, Response } from 'express';
import { h } from 'preact';
import WebSocket from 'ws';
import { pathToRegexp } from 'path-to-regexp';

import { renderPage } from 'server/render';
import expressAsyncHandler from 'express-async-handler';
import {
  getGame,
  joinGame,
  leaveGame,
  cancelGame,
  getGameClientState,
  removeTurnDataFromState,
  emitter as dataEmitter,
} from 'server/data';
import GamePage from 'server/components/pages/game';
import { getLoginRedirectURL } from 'server/auth';
import { requireSameOrigin, pingClients } from 'server/utils';
import { requireLogin } from 'server/auth';

export const router: Router = Router({
  strict: true,
});

router.get(
  '/:gameId/',
  expressAsyncHandler(async (req, res) => {
    const game = await getGame(req.params.gameId);
    if (!game) {
      res.status(404).send('Game not found');
      return;
    }

    const players = game.gamePlayers!;

    res.send(
      renderPage(
        <GamePage game={game} players={players} user={req.session!.user} />,
      ),
    );
  }),
);

async function joinGameRoute(req: Request, res: Response): Promise<void> {
  const user = req.session!.user;

  if (!user) {
    req.session!.allowGetJoinGame = true;
    res.redirect(301, getLoginRedirectURL(req.originalUrl));
    return;
  }

  const game = await getGame(req.params.gameId);
  if (!game) {
    res.status(404).send('Game not found');
    return;
  }

  try {
    await joinGame(game, user);
  } catch (err) {
    res.status(500).send(err.message);
    return;
  }
  res.redirect(303, `/game/${game.id}/`);
}

// GET requests to join games are only allowed if we've just sent the user
// through the login flow. See joinGameRoute.
router.get(
  '/:gameId/join',
  expressAsyncHandler((req, res) => {
    if (!req.session!.allowGetJoinGame) {
      res.status(403).send('Must use POST request to create game');
      return;
    }
    req.session!.allowGetJoinGame = false;
    joinGameRoute(req, res);
  }),
);

router.post(
  '/:gameId/join',
  requireSameOrigin(),
  expressAsyncHandler(joinGameRoute),
);

router.post(
  '/:gameId/leave',
  requireSameOrigin(),
  requireLogin(),
  expressAsyncHandler(async (req, res) => {
    const game = await getGame(req.params.gameId);
    if (!game) {
      res.status(404).send('Game not found');
      return;
    }

    try {
      await leaveGame(game, req.session!.user!);
    } catch (err) {
      res.status(500).send(err.message);
      return;
    }
    res.redirect(303, `/game/${game.id}/`);
  }),
);

router.post(
  '/:gameId/cancel',
  requireSameOrigin(),
  requireLogin(),
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user!;
    const game = await getGame(req.params.gameId);
    if (!game) {
      res.status(404).send('Game not found');
      return;
    }

    if (game.gamePlayers!.find(player => player.isAdmin)!.userId !== user.id) {
      res.status(500).send('Only the admin can cancel a game');
      return;
    }

    try {
      await cancelGame(game);
    } catch (err) {
      res.status(500).send(err.message);
      return;
    }
    res.redirect(303, `/`);
  }),
);

export const socketPath = pathToRegexp('/game/:gameId/ws');

const gameToSockets = new Map<string, WebSocket[]>();
const socketToUser = new WeakMap<WebSocket, UserSession | undefined>();
const socketToGameId = new WeakMap<WebSocket, string>();
const wss = new WebSocket.Server({ noServer: true });
pingClients(wss);

dataEmitter.on('gamechange', async gameId => {
  const sockets = gameToSockets.get(gameId);
  if (!sockets || sockets.length === 0) return;
  const clientState = await getGameClientState(gameId);

  // Has the game been cancelled?
  if (!clientState) {
    const message = JSON.stringify({ cancelled: true });

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }

    return;
  }

  const stateMessage = JSON.stringify(clientState);
  const stateNoTurnDataMessage = JSON.stringify(
    removeTurnDataFromState(clientState),
  );

  for (const socket of sockets) {
    if (socket.readyState !== WebSocket.OPEN) continue;

    const user = socketToUser.get(socket);
    const userPlayer =
      user && clientState.players.find(player => player.userId === user.id);

    if (userPlayer && clientState.game.turn === userPlayer.order) {
      socket.send(stateMessage);
      return;
    }

    socket.send(stateNoTurnDataMessage);
  }
});

wss.on('connection', async ws => {
  let clientState = await getGameClientState(socketToGameId.get(ws)!);
  if (!clientState) return;

  const user = socketToUser.get(ws);
  const userPlayer =
    user && clientState.players.find(player => player.userId === user.id);

  // We only send the turn data if it's that user's turn
  if (!userPlayer || clientState.game.turn !== userPlayer.order) {
    clientState = removeTurnDataFromState(clientState);
  }

  ws.send(JSON.stringify(clientState));
});

export function upgrade(req: Request, socket: Socket, head: Buffer) {
  const parsedURL = parseURL(req.url);
  const path = parsedURL.path!;

  wss.handleUpgrade(req, socket, head, ws => {
    const gameId = socketPath.exec(path)![1];

    if (!gameToSockets.has(gameId)) gameToSockets.set(gameId, []);
    const sockets = gameToSockets.get(gameId)!;
    sockets.push(ws);
    socketToUser.set(ws, req.session!.user);
    socketToGameId.set(ws, gameId);

    ws.once('close', () => {
      sockets.splice(sockets.indexOf(ws), 1);
    });
    wss.emit('connection', ws, req);
  });
}
