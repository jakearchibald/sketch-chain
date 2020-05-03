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

import { Router, Request, Response, urlencoded } from 'express';
import { h } from 'preact';
import WebSocket from 'ws';
import { pathToRegexp } from 'path-to-regexp';

import { renderPage } from 'server/render';
import expressAsyncHandler from 'express-async-handler';
import {
  joinGame,
  leaveGame,
  cancelGame,
  emitter as dataEmitter,
  startGame,
  playTurn,
  getGamePageData,
  getActiveTurnDataForPlayer,
} from 'server/data';
import GamePage from 'server/components/pages/game';
import {
  requireSameOrigin,
  pingClients,
  sendErrorResponse,
} from 'server/utils';
import { requireLogin } from 'server/auth';

export const router: Router = Router({
  strict: true,
});

router.get(
  '/:gameId/',
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user;
    const gameData = await getGamePageData(req.params.gameId, user?.id);

    if (!gameData) {
      res.status(404).send('Game not found');
      return;
    }

    res.send(renderPage(<GamePage {...gameData} user={req.session!.user} />));
  }),
);

router.get('/:gameId', (req, res) =>
  res.redirect(301, `${req.baseUrl}/${req.params.gameId}/`),
);

router.post(
  '/:gameId/join',
  requireSameOrigin(),
  requireLogin(),
  urlencoded({ extended: false }),
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user!;
    const json = !!req.query.json;
    try {
      await joinGame(
        req.params.gameId,
        user,
        req.body['player-name'],
        !!req.body['hide-avatar'],
      );
    } catch (err) {
      sendErrorResponse(res, err, json);
      return;
    }

    if (json) {
      res.status(200).json({ ok: true });
      return;
    }
    res.redirect(303, `/game/${req.params.gameId}/`);
  }),
);

router.post(
  '/:gameId/leave',
  requireSameOrigin(),
  requireLogin(),
  urlencoded({ extended: false }),
  expressAsyncHandler(async (req, res) => {
    const json = !!req.query.json;
    const user = req.session!.user!;
    const toRemove = 'player' in req.body ? String(req.body.player) : user.id;

    try {
      await leaveGame(req.params.gameId, toRemove, user.id);
    } catch (err) {
      sendErrorResponse(res, err, json);
      return;
    }

    if (json) {
      res.status(200).json({ ok: true });
      return;
    }
    res.redirect(303, `/game/${req.params.gameId}/`);
  }),
);

router.post(
  '/:gameId/cancel',
  requireSameOrigin(),
  requireLogin(),
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user!;

    try {
      await cancelGame(req.params.gameId, user.id);
    } catch (err) {
      sendErrorResponse(res, err, false);
      return;
    }
    res.redirect(303, `/`);
  }),
);

router.post(
  '/:gameId/start',
  requireSameOrigin(),
  requireLogin(),
  expressAsyncHandler(async (req, res) => {
    const json = !!req.query.json;
    const user = req.session!.user!;
    //req.params.gameId

    try {
      await startGame(req.params.gameId, user.id);
    } catch (err) {
      sendErrorResponse(res, err, json);
      return;
    }

    if (json) {
      res.status(200).json({ ok: true });
      return;
    }

    res.redirect(303, `/game/${req.params.gameId}/`);
  }),
);

router.post(
  '/:gameId/play',
  requireSameOrigin(),
  requireLogin(),
  urlencoded({ extended: false, limit: '500kb' }),
  expressAsyncHandler(async (req, res) => {
    const json = !!req.query.json;
    const user = req.session!.user!;
    const gameId = req.params.gameId;
    const turnData = String(req.body.turn);
    const threadId = Number(req.body.thread);

    try {
      await playTurn(gameId, threadId, user.id, turnData);
    } catch (err) {
      sendErrorResponse(res, err, json);
      return;
    }

    if (json) {
      res.status(200).json({ ok: true });
      return;
    }

    res.redirect(303, `/game/${gameId}/`);
  }),
);

export const socketPath = pathToRegexp('/game/:gameId/ws');

const gameToSockets = new Map<string, WebSocket[]>();
const socketToUser = new WeakMap<WebSocket, UserSession | undefined>();
const socketToGameId = new WeakMap<WebSocket, string>();
const wss = new WebSocket.Server({ noServer: true });
pingClients(wss);

dataEmitter.on('gamechange', async (gameId) => {
  const sockets = gameToSockets.get(gameId);
  if (!sockets || sockets.length === 0) return;
  const gameData = await getGamePageData(gameId);

  // Has the game been cancelled?
  if (!gameData) {
    const message = JSON.stringify({ cancelled: true });

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }

    return;
  }

  const plainStateMessage = JSON.stringify(gameData);

  await Promise.all(
    sockets.map(async (socket) => {
      if (socket.readyState !== WebSocket.OPEN) return;

      let message = plainStateMessage;
      const user = socketToUser.get(socket);

      if (user) {
        const activeTurnData = await getActiveTurnDataForPlayer(
          gameData.game,
          user.id,
        );

        if (activeTurnData.inPlayThread) {
          message = JSON.stringify({ ...gameData, ...activeTurnData });
        }
      }

      socket.send(message);
    }),
  );
});

wss.on('connection', async (socket) => {
  const user = socketToUser.get(socket);
  const gameData = await getGamePageData(socketToGameId.get(socket)!, user?.id);
  socket.send(JSON.stringify(gameData || { cancelled: true }));
});

export function upgrade(req: Request, socket: Socket, head: Buffer) {
  const parsedURL = parseURL(req.url);
  const path = parsedURL.path!;

  wss.handleUpgrade(req, socket, head, (ws) => {
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
