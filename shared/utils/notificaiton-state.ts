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
import isServer from 'consts:isServer';
import { SimpleChange } from './simple-change';

const storageKey = 'notificationsEnabled';
const getValueFromStorage = () =>
  isServer ? false : !!localStorage.getItem(storageKey);

const changer = new SimpleChange<boolean>(getValueFromStorage());

export function setEnabled(enabled: boolean) {
  localStorage.setItem(storageKey, enabled ? '1' : '');
  changer.change(enabled);
}

export const listen = changer.listen.bind(changer);
export const unlisten = changer.unlisten.bind(changer);
export const getIsEnabled = () => changer.value;

if (!isServer) {
  addEventListener('storage', (event) => {
    if (event.storageArea !== localStorage || event.key !== storageKey) return;
    changer.change(getValueFromStorage());
  });
}
