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
/**
 *
 */
export const enum GameState {
  Open,
  Playing,
  Complete,
}

export const enum TurnType {
  Draw,
  Describe,
  Skip,
}

export interface Game {
  id: string;
  state: GameState;
  players?: Player[];
  threads?: Thread[];
}

export interface Player {
  id: number;
  userId: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
  leftGame: boolean;
  order: number | null;
}

export interface Thread {
  id: number;
  turn: number;
  turnOffset: number;
  complete: boolean;
  turnUpdatedAt: Date | null;
  turns?: Turn[];
}

export interface Turn {
  id: number;
  playerId: number;
  type: TurnType;
  data: string | null;
}

export interface GamePageData extends ActiveTurnData {
  game: Game;
}

export interface ActiveTurnData {
  inPlayThread?: Thread;
  lastTurnInThread?: Turn;
}
