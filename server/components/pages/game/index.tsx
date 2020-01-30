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
import { Game } from 'server/data/models';

interface Props {
  user?: UserSession;
  game: Game;
}

const GamePage: FunctionalComponent<Props> = ({ user, game }) => {
  return (
    <html>
      <head>
        <title>Game</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* TODO: favicon */}
      </head>
      <body>
        <h1>Hello!</h1>
        <LoginState user={user} />
        <form method="POST" action="/create-game">
          <button>Create game</button>
        </form>
      </body>
    </html>
  );
};

export default GamePage;
