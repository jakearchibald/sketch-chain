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

import cssURL from 'css:../styles.css';
import LoginState from 'server/components/login-state';
import GameList from 'server/components/game-list';
import WhatIsThis from 'shared/components/what-is-this';
import CreateGame from 'shared/components/create-game';
import { siteTitle } from 'shared/config';
import { Game } from 'shared/types';
import bundleURL, { imports } from 'client-bundle:client/home';

interface Props {
  user?: UserSession;
  userGames?: Game[];
}

const HomePage: FunctionalComponent<Props> = ({ user, userGames }) => {
  return (
    <html>
      <head>
        <title>{siteTitle}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* TODO: favicon */}
        <link rel="stylesheet" href={cssURL} />
        <script type="module" src={bundleURL} />
        {...imports.map((i) => <link rel="modulepreload" href={i} />)}
      </head>
      <body>
        <LoginState user={user} />
        <div class="page-margin">
          <div class="content-box">
            <div class="content-padding">
              <h1 class="site-title">{siteTitle}</h1>
            </div>
          </div>
          <div class="create-game-container hero-button-container">
            <CreateGame
              userPrefs={
                user
                  ? {
                      name: user.name,
                      picture: user.picture,
                      hideAvatar: false,
                    }
                  : undefined
              }
            />
          </div>
          {user && userGames && userGames.length ? (
            <div class="content-box">
              <h2 class="content-box-title">Your games</h2>
              <div class="content-padding">
                <GameList userGames={userGames} />
              </div>
            </div>
          ) : undefined}
          <WhatIsThis />
        </div>
        <div class="modals"></div>
      </body>
    </html>
  );
};

export default HomePage;
