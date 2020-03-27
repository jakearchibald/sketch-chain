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
import IncompleteGame from 'shared/components/incomplete-game';
import activeBundleURL, {
  imports as activeImports,
} from 'client-bundle:client/active-game';
import completeBundleURL, {
  imports as completeImports,
} from 'client-bundle:client/complete-game';
import { GameState, Game, Thread, Turn } from 'shared/types';
import cssURL from 'css:../styles.css';
import CompleteGame from './complete-game';
import { siteTitle } from 'shared/config';

interface Props {
  user?: UserSession;
  game: Game;
  inPlayThread: Thread | null;
  lastTurnInThread: Turn | null;
}

const GamePage: FunctionalComponent<Props> = ({
  user,
  game,
  inPlayThread,
  lastTurnInThread,
}) => (
  <html>
    <head>
      <title>{siteTitle} - Game</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      {/* TODO: favicon */}
      <link rel="stylesheet" href={cssURL} />
      {game.state !== GameState.Complete
        ? [
            <script type="module" src={activeBundleURL} />,
            ...activeImports.map((i) => <link rel="modulepreload" href={i} />),
          ]
        : [
            <script type="module" src={completeBundleURL} />,
            ...completeImports.map((i) => (
              <link rel="modulepreload" href={i} />
            )),
          ]}
    </head>
    <body>
      <LoginState user={user} />
      <div class="page-margin">
        <div class="content-box">
          <div class="content-padding">
            <h1 class="site-title">
              <a href="/">{siteTitle}</a>
            </h1>
          </div>
        </div>
        <div class="game">
          {game.state == GameState.Complete ? (
            <CompleteGame game={game} />
          ) : (
            <IncompleteGame
              userId={user && user.id}
              game={game}
              inPlayThread={inPlayThread}
              lastTurnInThread={lastTurnInThread}
            />
          )}
        </div>
      </div>
    </body>
  </html>
);

export default GamePage;
