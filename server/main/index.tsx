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
import { Router, Request, Response } from 'express';
import { h } from 'preact';
import WebSocket from 'ws';
import expressAsyncHandler from 'express-async-handler';

import { renderPage } from 'server/render';
import { pingClients, requireSameOrigin } from 'server/utils';
import HomePage from 'server/components/pages/home';
import { createGame, getUsersGames } from 'server/data';
import { getLoginRedirectURL } from 'server/auth';

export const router: Router = Router({
  strict: true,
});

router.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user;
    const games = user ? await getUsersGames(user) : undefined;
    res.status(200).send(renderPage(<HomePage user={user} games={games} />));
  }),
);

async function createGameRoute(req: Request, res: Response): Promise<void> {
  const user = req.session!.user;
  if (!user) {
    req.session!.allowGetCreateGame = true;
    res.redirect(301, getLoginRedirectURL('/create-game'));
    return;
  }
  const gameId = await createGame(user);
  res.redirect(303, `/game/${gameId}/`);
}

// GET requests to create games are only allowed if we've just sent the user
// through the login flow. See createGameRoute.
router.get(
  '/create-game',
  expressAsyncHandler((req, res) => {
    if (!req.session!.allowGetCreateGame) {
      res.status(403).send('Must use POST request to create game');
      return;
    }
    req.session!.allowGetCreateGame = false;
    createGameRoute(req, res);
  }),
);

router.post(
  '/create-game',
  requireSameOrigin(),
  expressAsyncHandler(createGameRoute),
);

const wss = new WebSocket.Server({ noServer: true });
pingClients(wss);

/*wss.on('connection', ws => {
  ws.on('message', data => {
  });
});

export function upgrade(req: Request, socket: Socket, head: Buffer) {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
}
*/
