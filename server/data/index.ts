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
import { collections, predicates, teams, objects } from 'friendly-words';

import { Game, GamePlayer } from './models';
import { randomItem } from '../utils';

const generateGameId = (() => {
  const group = [...teams, ...collections];
  return () =>
    `${randomItem(predicates)}-${randomItem(objects)}-${randomItem(group)}`;
})();

export async function createGame(user: UserSession) {
  const game = await Game.create({ id: generateGameId() });
  await GamePlayer.create({
    gameId: game.id,
    userId: user.id,
    name: user.name,
    avatar: user.picture,
    isAdmin: true,
  });

  return game.id;
}
