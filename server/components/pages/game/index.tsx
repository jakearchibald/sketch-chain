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
import { h, FunctionalComponent } from 'preact';

import LoginState from 'server/components/login-state';
import { Game, GamePlayer } from 'server/data/models';
import IncompleteGame from 'shared/components/incomplete-game';
import bundleURL, { imports } from 'client-bundle:client/active-game';
import { GameState } from 'shared/types';
import { gameToClientState } from 'server/data';

interface Props {
  user?: UserSession;
  game: Game;
  players: GamePlayer[];
}

const GamePage: FunctionalComponent<Props> = ({ user, game, players }) => (
  <html>
    <head>
      <title>Game</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      {/* TODO: favicon */}
      {game.state !== GameState.Complete && [
        <script type="module" src={bundleURL} />,
        ...imports.map(i => (
          <link rel="preload" as="script" href={i} crossOrigin="" />
        )),
      ]}
    </head>
    <body>
      <h1>Hello!</h1>
      <LoginState user={user} />
      <div class="game">
        {game.state == GameState.Complete ? (
          'TODO: game complete'
        ) : (
          <IncompleteGame
            userId={user && user.id}
            {...gameToClientState(game)}
          />
        )}
      </div>
    </body>
  </html>
);

export default GamePage;
