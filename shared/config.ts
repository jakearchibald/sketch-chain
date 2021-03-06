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
export const siteTitle = 'Sketch Chain';
/**
 * How many players must a game have before it can start.
 */
export const minPlayers = 4;
/**
 * The max length of a subject or drawing description.
 */
export const maxDescriptionLength = 100;
/**
 * Drawing line width
 */
export const lineWidth = 3;

const maxUint16Val = 0xffff;
/**
 * Drawing pen up number.
 */
export const penUp = maxUint16Val;
/**
 * Max X/Y value.
 */
export const maxDrawingVal = maxUint16Val - 10;
/**
 * Max image dimension
 */
export const maxImgSize = 3000;
