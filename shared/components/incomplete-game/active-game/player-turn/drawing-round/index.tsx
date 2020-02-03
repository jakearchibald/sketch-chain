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
import { h, Component } from 'preact';
import PointerTracker from 'pointer-tracker';
import simplify from 'simplify-js';

import { Player } from 'shared/types';
import isServer from 'consts:isServer';

interface Props {
  nextPlayer?: Player;
  previousPlayer: Player;
  submitting: boolean;
  onSubmit: (turnData: string) => void;
}

interface State {
  drawingBegun: boolean;
}

function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
  ctx.fill();
}

function drawPathData(
  data: number[],
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
) {
  let newPath = true;

  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    if (x === -1) {
      ctx.stroke();
      newPath = true;
      continue;
    }

    i++;

    const y = data[i];

    if (newPath) {
      newPath = false;
      drawPoint(ctx!, x * canvasWidth, y * canvasHeight);
      ctx.beginPath();
    }
    ctx.lineTo(x * canvasWidth, y * canvasHeight);
  }

  ctx.stroke();
}

export default class DrawingRound extends Component<Props, State> {
  state: State = {
    drawingBegun: false,
  };

  private _canvas: HTMLCanvasElement | null = null;
  private _context?: CanvasRenderingContext2D;
  /** Width before applying dpr */
  private _canvasWidth: number = 0;
  /** Height before applying dpr */
  private _canvasHeight: number = 0;

  private _iframe: HTMLIFrameElement | null = null;
  private _pointerTracker?: PointerTracker;

  /**
   * This is in the format [x, y, x, y, -1, x, y, x, y, x, y]
   * Where -1 means pen up.
   * x & y are 0-1 floats.
   */
  private _drawingData?: number[];

  private _resetCanvas() {
    const canvas = this._canvas!;
    const canvasBounds = canvas.getBoundingClientRect();
    this._canvasWidth = Math.round(canvasBounds.width);
    this._canvasHeight = Math.round(canvasBounds.height);
    canvas.width = Math.round(canvasBounds.width * devicePixelRatio);
    canvas.height = Math.round(canvasBounds.height * devicePixelRatio);
    this._clearCanvas();
    this._drawingData = [];
  }

  private _clearCanvas() {
    const canvas = this._canvas!;
    this._context = canvas.getContext('2d', { alpha: false })!;
    this._context.fillStyle = '#fff';
    this._context.fillRect(0, 0, canvas.width, canvas.height);
    this._context.resetTransform();
    this._context.scale(devicePixelRatio, devicePixelRatio);
    this._context.lineWidth = 3;
    this._context.lineJoin = 'round';
    this._context.lineCap = 'round';
    this._context.fillStyle = this._context.strokeStyle = '#000';
  }

  private _canvasMount = (canvas: HTMLCanvasElement | null) => {
    console.log('Canvas mount');
    this._canvas = canvas;

    // TODO: should remove pointer tracker listeners if it exists

    if (!canvas) {
      this._context = undefined;
      console.log(
        `I'm not entirely sure when this happens yet. Is it when the canvas is removed?`,
      );
      return;
    }

    const activePointers = new Map<number, { x: number; y: number }[]>();

    this._pointerTracker = new PointerTracker(canvas, {
      start: pointer => {
        if (!this.state.drawingBegun) {
          this.setState({ drawingBegun: true });
        }
        const canvasBounds = canvas.getBoundingClientRect();
        const x = (pointer.clientX - canvasBounds.left) / canvasBounds.width;
        const y = (pointer.clientY - canvasBounds.top) / canvasBounds.height;
        drawPoint(
          this._context!,
          x * this._canvasWidth,
          y * this._canvasHeight,
        );
        activePointers.set(pointer.id, [{ x, y }]);
        return true;
      },
      move: (_, changedPointers) => {
        const canvasBounds = canvas.getBoundingClientRect();

        for (const pointer of changedPointers) {
          const linePoints = activePointers.get(pointer.id)!;
          const { x: prevX, y: prevY } = linePoints.slice(-1)[0];

          this._context!.beginPath();
          this._context!.lineTo(
            prevX * this._canvasWidth,
            prevY * this._canvasHeight,
          );

          for (const finePointer of pointer.getCoalesced()) {
            const x =
              (finePointer.clientX - canvasBounds.left) / canvasBounds.width;
            const y =
              (finePointer.clientY - canvasBounds.top) / canvasBounds.height;
            linePoints.push({ x, y });
            this._context!.lineTo(
              x * this._canvasWidth,
              y * this._canvasHeight,
            );
          }

          this._context!.stroke();
        }
      },
      end: pointer => {
        const linePoints = simplify(activePointers.get(pointer.id)!, 0.0015);
        activePointers.delete(pointer.id);
        this._drawingData!.push(
          -1,
          ...linePoints.flatMap(({ x, y }) => [x, y]),
        );
      },
    });

    this._resetCanvas();
  };

  private _iframeWindowResize = () => {
    if (this.state.drawingBegun) return;
    this._resetCanvas();
  };

  private _iframeMount = (iframe: HTMLIFrameElement | null) => {
    if (this._iframe && this._iframe.contentWindow) {
      this._iframe.contentWindow.removeEventListener(
        'resize',
        this._iframeWindowResize,
      );
    }

    this._iframe = iframe;
    if (!iframe) return;
    iframe.contentWindow!.addEventListener('resize', this._iframeWindowResize);
  };

  private _onClearClick = () => {
    this._resetCanvas();
    this.setState({ drawingBegun: false });
  };

  private _onUndoClick = () => {
    const lastLineEndIndex = this._drawingData!.lastIndexOf(-1);
    if (lastLineEndIndex <= 0) {
      this._resetCanvas();
      this.setState({ drawingBegun: false });
      return;
    } else {
      this._drawingData!.splice(lastLineEndIndex);
    }
    this._clearCanvas();
    drawPathData(
      this._drawingData!,
      this._context!,
      this._canvasWidth,
      this._canvasHeight,
    );
  };

  render(
    { nextPlayer, previousPlayer, submitting }: Props,
    { drawingBegun }: State,
  ) {
    return (
      <div>
        <p>
          {previousPlayer.name} wants you to draw "{previousPlayer.turnData!}"
        </p>
        <div
          class={`canvas-container ${
            drawingBegun ? '' : 'allow-canvas-resize'
          }`}
        >
          <iframe class="canvas-iframe" ref={this._iframeMount} />
          <canvas class="drawing-canvas" ref={this._canvasMount} />
          {!isServer && (
            <div class="drawing-controls">
              <button onClick={this._onClearClick}>Clear</button>
              <button onClick={this._onUndoClick}>Undo</button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
