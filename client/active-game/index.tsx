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
import { h, hydrate } from 'preact';

import WS from 'client/ws';
import IncompleteGame from 'shared/components/incomplete-game';
import { GameClientState } from 'shared/types';

const gameEl = document.querySelector('.game')!;
const loginInfo = document.querySelector('.login-info');
const userId = loginInfo
  ? (loginInfo as HTMLElement).dataset.userId!
  : undefined;

new WS('ws', message => {
  const data = JSON.parse(message);
  if (data.cancelled) {
    // TODO: maybe do something more informative?
    location.href = '/';
    return;
  }

  hydrate(
    <IncompleteGame userId={userId} {...(data as GameClientState)} />,
    gameEl,
  );
});
