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
export const port = Number(process.env.PORT) || 8081;

export const origin = (() => {
  if (process.env.ORIGIN) return process.env.ORIGIN;
  if (process.env.PROJECT_DOMAIN) {
    return `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
  }
  return `http://localhost:${port}`;
})();

export const devMode = origin.startsWith('http://localhost');

export const cookieDomain = process.env.COOKIE_DOMAIN || '';

export const storageRoot = process.env.STORAGE_ROOT || './.data/storage';

export const admins = ['jaffathecake@gmail.com'];

export const cookieSecret: string = process.env.COOKIE_SECRET!;
if (!cookieSecret) throw Error('No cookie secret set');

export const oauthClientId: string = process.env.OAUTH_CLIENT!;
if (!oauthClientId) throw Error('No oauth client set');

export const oauthClientSecret: string = process.env.OAUTH_SECRET!;
if (!oauthClientSecret) throw Error('No oauth secret set');
