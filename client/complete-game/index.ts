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
import { base64ToBuffer } from 'shared/base64';
import { resetCanvas, drawPathData } from 'shared/drawing-canvas-utils';

const canvases = document.querySelectorAll(
  '.final-drawing-canvas',
) as NodeListOf<HTMLCanvasElement>;

for (const canvas of canvases) {
  const { width, height } = canvas;
  const originalLineWidth = Number(canvas.dataset.lineWidth);
  const pathBase64 = canvas.dataset.path!;
  const points = new Int16Array(base64ToBuffer(pathBase64));
  const ctx = canvas.getContext('2d', { alpha: false })!;
  resetCanvas(ctx);
  ctx.lineWidth = originalLineWidth * (canvas.width / width);
  drawPathData(width, height, points, ctx);
}
