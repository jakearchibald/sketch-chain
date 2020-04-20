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
import { h, render } from 'preact';

import CreateGame, {
  preferredNameKey,
  hideAvatarKey,
} from 'shared/components/create-game';

const loginInfo = document.querySelector('.login-info') as HTMLElement | null;
const container = document.querySelector('.create-game-container')!;

render(
  <CreateGame
    userDetails={
      loginInfo
        ? {
            name:
              localStorage.getItem(preferredNameKey) || loginInfo.textContent!,
            picture: loginInfo.dataset.userAvatar,
          }
        : undefined
    }
    hideAvatar={!!localStorage.getItem(hideAvatarKey)}
  />,
  container,
);
