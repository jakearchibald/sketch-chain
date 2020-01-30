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
import { Game, GamePlayer } from './models';
import { createProbablyUniqueName } from 'server/utils';

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
  return Game.findByPk(id, { include: [GamePlayer] });
}

export async function getUsersGames(user: UserSession) {
  const gamePlayers = await GamePlayer.findAll({
    where: { userId: user.id },
    include: [Game],
  });

  return gamePlayers.map(gamePlayer => gamePlayer.game!);
}
