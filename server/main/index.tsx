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
import { join as joinPath } from 'path';

import { Router, Request, Response, urlencoded } from 'express';
import { h } from 'preact';
import expressAsyncHandler from 'express-async-handler';

import { renderPage } from 'server/render';
import { requireSameOrigin, sendErrorResponse } from 'server/utils';
import HomePage from 'server/components/pages/home';
import { createGame, getUsersGames } from 'server/data';
import { getLoginRedirectURL, requireAdmin, requireLogin } from 'server/auth';

export const router: Router = Router({
  strict: true,
});

router.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user;
    const games = user ? await getUsersGames(user.id) : undefined;
    res
      .status(200)
      .send(renderPage(<HomePage user={user} userGames={games} />));
  }),
);

router.post(
  '/create-game',
  requireSameOrigin(),
  requireLogin(),
  urlencoded({ extended: false }),
  expressAsyncHandler(async (req, res) => {
    const user = req.session!.user!;

    try {
      const gameId = await createGame(
        user,
        req.body['player-name'],
        !!req.body['hide-avatar'],
      );
      res.redirect(303, `/game/${gameId}/`);
    } catch (err) {
      sendErrorResponse(res, err, false);
    }
  }),
);

router.get('/dl-db', requireAdmin(), (req, res) => {
  res
    .status(200)
    .attachment('db.db')
    .sendFile(joinPath(process.cwd(), '.data', 'storage', 'db.db'));
});
