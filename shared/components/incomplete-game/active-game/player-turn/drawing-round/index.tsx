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
import { penUp } from 'shared/config';
import IframeOnResize from 'shared/components/iframe-on-resize';
import {
  resetCanvas,
  drawPoint,
  drawPathData,
  clearCanvas,
} from 'shared/drawing-canvas-utils';

interface Props {
  previousPlayer: Player;
  submitting: boolean;
  onSubmit: (turnData: string) => void;
}

interface State {
  drawingBegun: boolean;
}

export default class DrawingRound extends Component<Props, State> {
  state: State = {
    drawingBegun: false,
  };

  private _canvas: HTMLCanvasElement | null = null;
  private _context?: CanvasRenderingContext2D;
  private _pointerTracker?: PointerTracker;

  /**
   * This is in the format [x, y, x, y, specialVal, x, y, x, y, x, y]
   * Special vals are the lowest 10 values in int16
   * x & y in16 vals.
   */
  private _drawingData?: number[];

  private _resetCanvas() {
    resetCanvas(this._context!);
    this._drawingData = [];
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
        const x = Math.round(
          ((pointer.clientX - canvasBounds.left) / canvasBounds.width) *
            this._canvas!.width,
        );
        const y = Math.round(
          ((pointer.clientY - canvasBounds.top) / canvasBounds.height) *
            this._canvas!.height,
        );
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
              ((finePointer.clientX - canvasBounds.left) / canvasBounds.width) *
                this._canvas!.width,
            );
            const y = Math.round(
              ((finePointer.clientY - canvasBounds.top) / canvasBounds.height) *
                this._canvas!.height,
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

    this._context = canvas.getContext('2d', { alpha: false })!;
    this._resetCanvas();
  };

  private _iframeWindowResize = () => {
    if (this.state.drawingBegun) return;
    this._resetCanvas();
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
      clearCanvas(this._context!);
    }

    drawPathData(
      this._canvas!.width,
      this._canvas!.height,
      this._drawingData!,
      this._context!,
    );
  };

  private _onSendClick = () => {
    const dataArray = new Int16Array(this._drawingData!);
    const uint8 = new Uint8Array(dataArray.buffer);
    const b64 = bufferToBase64(uint8.buffer);
    const data = JSON.stringify({
      width: this._canvas!.width,
      height: this._canvas!.height,
      lineWidth: this._context!.lineWidth,
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
          <IframeOnResize onResize={this._iframeWindowResize} />
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
