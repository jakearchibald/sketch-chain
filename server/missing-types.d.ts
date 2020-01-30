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
/// <reference path="../missing-types.d.ts" />

declare module 'client-bundle:*' {
  const value: string;
  export default value;
  export const imports: string[];
}

declare module 'css:*' {
  const value: string;
  export default value;
  export const inline: string;
}

declare module 'friendly-words' {
  export const objects: string[];
  export const predicates: string[];
  export const teams: string[];
  export const collections: string[];
}

// Types for our session
declare namespace Express {
  interface Session extends SessionData {
    user?: UserSession;
    allowGetCreateGame?: boolean;
  }
}

interface UserSession {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  id: string;
}
