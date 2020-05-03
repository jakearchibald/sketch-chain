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

import { UserPrefs } from 'shared/types';

const preferredNameKey = 'preferredName';
const hideAvatarKey = 'hideAvatar';

export function setUserPrefs(name: string, hideAvatar: boolean) {
  localStorage.setItem(preferredNameKey, name);
  localStorage.setItem(hideAvatarKey, hideAvatar ? '1' : '');
}

export function getUserPrefs(): UserPrefs | undefined {
  const loginInfo = document.querySelector('.login-info') as HTMLElement | null;
  return loginInfo
    ? {
        name: localStorage.getItem(preferredNameKey) || loginInfo.textContent!,
        picture: loginInfo.dataset.userAvatar,
        hideAvatar: !!localStorage.getItem(hideAvatarKey),
      }
    : undefined;
}
