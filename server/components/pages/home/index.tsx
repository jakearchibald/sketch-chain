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
import cssURL from 'css:./styles.css';
import LoginState from 'server/components/login-state';
import GameList from 'server/components/game-list';
import { UserGames } from 'server/data';

interface Props {
  user?: UserSession;
  userGames?: UserGames[];
}

const HomePage: FunctionalComponent<Props> = ({ user, userGames }) => {
  return (
    <html>
      <head>
        <title>Test</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* TODO: favicon */}
        <link rel="stylesheet" href={cssURL} />
      </head>
      <body>
        <h1>Hello!</h1>
        <LoginState user={user} />
        <form method="POST" action="/create-game">
          <button>Create game</button>
        </form>
        {user && (
          <div>
            <h1>Your games</h1>
            {userGames && userGames.length ? (
              <GameList userGames={userGames} />
            ) : (
              <p>No games yet.</p>
            )}
          </div>
        )}
      </body>
    </html>
  );
};

export default HomePage;
