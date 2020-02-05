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
import { bufferToBase64 } from 'shared/base64';
import { lineWidth, penUp } from 'shared/config';

interface Props {
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

function drawPathData(data: number[], ctx: CanvasRenderingContext2D) {
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
      drawPoint(ctx!, x, y);
      ctx.beginPath();
    }
    ctx.lineTo(x, y);
  }

  ctx.stroke();
}

export default class DrawingRound extends Component<Props, State> {
  state: State = {
    drawingBegun: false,
  };

  private _canvas: HTMLCanvasElement | null = null;
  private _context?: CanvasRenderingContext2D;
  private _dpr: number = 1;

  private _iframe: HTMLIFrameElement | null = null;
  private _pointerTracker?: PointerTracker;

  /**
   * This is in the format [x, y, x, y, specialVal, x, y, x, y, x, y]
   * Special vals are the lowest 10 values in int16
   * x & y in16 vals.
   */
  private _drawingData?: number[];

  private _resetCanvas() {
    const canvas = this._canvas!;
    const canvasBounds = canvas.getBoundingClientRect();
    canvas.width = Math.round(canvasBounds.width * devicePixelRatio);
    canvas.height = Math.round(canvasBounds.height * devicePixelRatio);
    this._dpr = devicePixelRatio;
    this._clearCanvas();
    this._drawingData = [];
  }

  private _clearCanvas() {
    const canvas = this._canvas!;
    this._context = canvas.getContext('2d', { alpha: false })!;
    this._context.fillStyle = '#fff';
    this._context.fillRect(0, 0, canvas.width, canvas.height);
    this._context.resetTransform();
    this._context.lineWidth = lineWidth * this._dpr;
    this._context.lineJoin = 'round';
    this._context.lineCap = 'round';
    this._context.fillStyle = this._context.strokeStyle = '#000';
  }

  private _canvasMount = (canvas: HTMLCanvasElement | null) => {
    this._canvas = canvas;

    // TODO: should remove pointer tracker listeners if it exists

    if (!canvas) {
      this._context = undefined;
      return;
    }

    const activePointers = new Map<number, { x: number; y: number }[]>();

    this._pointerTracker = new PointerTracker(canvas, {
      start: pointer => {
        if (!this.state.drawingBegun) {
          this.setState({ drawingBegun: true });
        }
        const canvasBounds = canvas.getBoundingClientRect();
        const x = Math.round((pointer.clientX - canvasBounds.left) * this._dpr);
        const y = Math.round((pointer.clientY - canvasBounds.top) * this._dpr);
        drawPoint(this._context!, x, y);
        activePointers.set(pointer.id, [{ x, y }]);
        return true;
      },
      move: (_, changedPointers) => {
        const canvasBounds = canvas.getBoundingClientRect();

        for (const pointer of changedPointers) {
          const linePoints = activePointers.get(pointer.id)!;
          const { x: prevX, y: prevY } = linePoints.slice(-1)[0];

          this._context!.beginPath();
          this._context!.lineTo(prevX, prevY);

          for (const finePointer of pointer.getCoalesced()) {
            const x = Math.round(
              (finePointer.clientX - canvasBounds.left) * this._dpr,
            );
            const y = Math.round(
              (finePointer.clientY - canvasBounds.top) * this._dpr,
            );
            linePoints.push({ x, y });
            this._context!.lineTo(x, y);
          }

          this._context!.stroke();
        }
      },
      end: pointer => {
        const linePoints = simplify(activePointers.get(pointer.id)!, 1);
        activePointers.delete(pointer.id);
        this._drawingData!.push(
          penUp,
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
    const lastLineEndIndex = this._drawingData!.lastIndexOf(penUp);
    if (lastLineEndIndex <= 0) {
      this._resetCanvas();
      this.setState({ drawingBegun: false });
      return;
    } else {
      this._drawingData!.splice(lastLineEndIndex);
    }
    this._clearCanvas();
    drawPathData(this._drawingData!, this._context!);
  };

  private _onSendClick = () => {
    const dataArray = new Int16Array(this._drawingData!);
    const uint8 = new Uint8Array(dataArray.buffer);
    const b64 = bufferToBase64(uint8.buffer);
    const data = JSON.stringify({
      width: this._canvas!.width,
      height: this._canvas!.height,
      dpr: this._dpr,
      data: b64,
    });
    this.props.onSubmit(data);
  };

  render({ previousPlayer, submitting }: Props, { drawingBegun }: State) {
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
              <button onClick={this._onClearClick} disabled={!drawingBegun}>
                Clear
              </button>
              <button onClick={this._onUndoClick} disabled={!drawingBegun}>
                Undo
              </button>
              <button
                onClick={this._onSendClick}
                disabled={!drawingBegun || submitting}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
