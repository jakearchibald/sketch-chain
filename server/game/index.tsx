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

import { renderPage } from 'server/render';
import expressAsyncHandler from 'express-async-handler';
import { getGame, joinGame, leaveGame, cancelGame } from 'server/data';
import GamePage from 'server/components/pages/game';
import { getLoginRedirectURL } from 'server/auth';
import { requireSameOrigin } from 'server/utils';
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
