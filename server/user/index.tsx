/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
import { Router } from 'express';
import { h } from 'preact';
import WebSocket from 'ws';

import { renderPage } from 'server/render';
import { pingClients } from 'server/utils';
import HomePage from 'server/components/pages/home';

export const router: Router = Router({
  strict: true,
});

router.get('/', (req, res) => {
  res.status(200).send(renderPage(<HomePage />));
});

const wss = new WebSocket.Server({ noServer: true });
pingClients(wss);

/*wss.on('connection', ws => {
  ws.on('message', data => {
  });
});

export function upgrade(req: Request, socket: Socket, head: Buffer) {
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit('connection', ws, req);
  });
}
*/
