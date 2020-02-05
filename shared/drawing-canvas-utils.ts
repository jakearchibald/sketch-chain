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
import { lineWidth, penUp } from './config';

export function resetCanvas(ctx: CanvasRenderingContext2D) {
  const canvas = ctx.canvas;
  const canvasBounds = canvas.getBoundingClientRect();
  canvas.width = Math.round(canvasBounds.width * devicePixelRatio);
  canvas.height = Math.round(canvasBounds.height * devicePixelRatio);
  ctx.lineWidth = lineWidth * devicePixelRatio;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = ctx.strokeStyle = '#000';
  clearCanvas(ctx);
}

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  const canvas = ctx.canvas;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
  ctx.fill();
}

export function drawPathData(
  width: number,
  height: number,
  data: number[] | Int16Array,
  ctx: CanvasRenderingContext2D,
) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  let newPath = true;

  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    if (x === penUp) {
      ctx.stroke();
      newPath = true;
      continue;
    }

    i++;

    const y = data[i];

    if (newPath) {
      newPath = false;
      drawPoint(ctx!, (x / width) * canvasWidth, (y / height) * canvasHeight);
      ctx.beginPath();
    }
    ctx.lineTo((x / width) * canvasWidth, (y / height) * canvasHeight);
  }

  ctx.stroke();
}
