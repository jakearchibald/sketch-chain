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

interface Props {
  user?: UserSession;
}

const LoginState: FunctionalComponent<Props> = ({ user }) => {
  if (user)
    return (
      <div>
        <p>Logged in as {user.name}.</p>
        <form action="/auth/logout" method="POST">
          <button>Log out</button>
        </form>
      </div>
    );
  return (
    <div>
      <p>Not logged in.</p>
      <form action="/auth/login" method="POST">
        <button>Log in</button>
      </form>
    </div>
  );
};

export default LoginState;
