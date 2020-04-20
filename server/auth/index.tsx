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
import { RequestHandler, Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import asyncHandler from 'express-async-handler';

import {
  oauthClientId,
  oauthClientSecret,
  origin,
  devMode,
  admins,
} from 'server/config';
import { requireSameOrigin, createFakeLoginName } from 'server/utils';

const createClient = () =>
  new OAuth2Client({
    clientId: oauthClientId,
    clientSecret: oauthClientSecret,
    redirectUri: origin + '/auth/oauth2callback',
  });

export function requireLogin(): RequestHandler {
  return (req, res, next) => {
    if (req.session!.user) {
      next();
      return;
    }

    const error = 'Login required';
    res.status(403).send(error);
  };
}

export function requireAdmin(): RequestHandler {
  return (req, res, next) => {
    const user = req.session!.user;

    if (user && user.emailVerified && admins.includes(user.email)) {
      next();
      return;
    }

    const error = 'Admin required';
    res.status(403).send(error);
  };
}

export function getLoginRedirectURL(redirectBackTo: string) {
  const oauth2Client = createClient();
  return oauth2Client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state: redirectBackTo,
  });
}

export const router: Router = Router({
  strict: true,
});

router.all('/test-login', (req, res) => {
  if (!devMode) {
    res.status(403).send('Only allowed during dev');
    return;
  }

  const id = req.query.id || createFakeLoginName();

  req.session!.user = {
    email: 'foo@bar.com',
    emailVerified: true,
    name: id,
    id,
  };

  res.redirect(301, req.get('Referer') || '/');
});

router.post('/login', requireSameOrigin(), (req, res) => {
  res.redirect(
    301,
    getLoginRedirectURL(req.query.state || req.get('Referer') || '/'),
  );
});

router.post('/logout', requireSameOrigin(), (req, res) => {
  req.session!.destroy(() => {
    res.clearCookie('connect.sid', { path: '/' });
    res.redirect(301, req.get('Referer') || '/');
  });
});

router.get(
  '/oauth2callback',
  asyncHandler(async (req, res) => {
    const oauth2Client = createClient();
    const result = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(result.tokens);
    const verifyResult = await oauth2Client.verifyIdToken({
      idToken: result.tokens.id_token!,
      audience: oauthClientId,
    });
    const loginData = verifyResult.getPayload();

    req.session!.user = {
      email: loginData!.email || '',
      emailVerified: Boolean(loginData!.email_verified),
      name: loginData!.name!,
      id: loginData!.sub,
      picture: (loginData!.picture || '').replace('=s96-c', ''),
    };

    res.redirect(301, req.query.state || '/');
  }),
);
