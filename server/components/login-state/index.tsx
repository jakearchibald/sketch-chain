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
import { devMode } from 'server/config';

interface Props {
  user?: UserSession;
}

const LoginState: FunctionalComponent<Props> = ({ user }) => {
  return (
    <div class="login-details">
      {user
        ? [
            <div class="login-user">
              {user.picture && (
                <img
                  width="40"
                  height="40"
                  alt=""
                  src={`${user.picture}=s${40}-c`}
                  srcset={`${user.picture}=s${80}-c 2x`}
                  class="login-avatar"
                  data-user-id={user.id}
                />
              )}
              <div
                class="login-info"
                data-user-id={user.id}
                data-user-avatar={user.picture || ''}
              >
                {user.name}
              </div>
            </div>,
            <div class="button-row">
              <form action="/auth/logout" method="POST">
                <button class="button">Log out</button>
              </form>
            </div>,
          ]
        : [
            <div class="login-user">
              <div>Not logged in</div>
            </div>,
            <div class="button-row">
              <form action="/auth/login" method="POST">
                <button class="button">Log in</button>
              </form>
              {devMode && (
                <form action="/auth/test-login" method="POST">
                  <button class="button">Fake log in</button>
                </form>
              )}
            </div>,
          ]}
    </div>
  );
};

export default LoginState;
