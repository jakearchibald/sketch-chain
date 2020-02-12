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
import { h, Component, createRef } from 'preact';
import PointerTracker from 'pointer-tracker';
import simplify from 'simplify-js';

import { Player } from 'shared/types';
import isServer from 'consts:isServer';
import { bufferToBase64 } from 'shared/base64';
import { penUp, maxDrawingVal } from 'shared/config';
import IframeOnResize from 'shared/components/iframe-on-resize';
import {
  resetCanvas,
  drawPoint,
  drawPathData,
  clearCanvas,
} from 'shared/drawing-canvas-utils';

const mqList =
  typeof window !== 'undefined'
    ? window.matchMedia('(min-width: 500px)')
    : undefined;

interface Props {
  previousPlayer: Player;
  submitting: boolean;
  onSubmit: (turnData: string) => void;
}

interface State {
  drawingBegun: boolean;
  desktopMode: boolean;
  fallbackFullscreen: boolean;
}

export default class DrawingRound extends Component<Props, State> {
  state: State = {
    drawingBegun: false,
    fallbackFullscreen: false,
    desktopMode: !!mqList && mqList.matches,
  };

  private _canvas: HTMLCanvasElement | null = null;
  private _context?: CanvasRenderingContext2D;
  private _pointerTracker?: PointerTracker;

  private _drawingContainer = createRef();

  /**
   * This is in the format [x, y, x, y, specialVal, x, y, x, y, x, y]
   * Special vals are the highest 10 values in uint16.
   */
  private _drawingData?: number[];

  private _resetCanvas() {
    const { width, height } = this._canvas!.getBoundingClientRect();
    resetCanvas(this._context!, width, height);
    this._drawingData = [];
  }

  private _canvasMount = (canvas: HTMLCanvasElement | null) => {
    this._canvas = canvas;

    // TODO: should remove pointer tracker listeners if it exists

    if (!canvas) {
      this._context = undefined;
      return;
    }

    requestAnimationFrame(() => {
      const activePointers = new Map<number, { x: number; y: number }[]>();

      this._pointerTracker = new PointerTracker(canvas, {
        start: pointer => {
          if (!this.state.drawingBegun) {
            this.setState({ drawingBegun: true });
          }
          const canvasBounds = canvas.getBoundingClientRect();
          const x = Math.round(pointer.clientX - canvasBounds.left);
          const y = Math.round(pointer.clientY - canvasBounds.top);
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
              const x = Math.round(finePointer.clientX - canvasBounds.left);
              const y = Math.round(finePointer.clientY - canvasBounds.top);
              linePoints.push({ x, y });
              this._context!.lineTo(x, y);
            }

            this._context!.stroke();
          }
        },
        end: pointer => {
          const { width, height } = canvas.getBoundingClientRect();
          const linePoints = simplify(activePointers.get(pointer.id)!, 1);
          activePointers.delete(pointer.id);
          this._drawingData!.push(
            penUp,
            ...linePoints.flatMap(({ x, y }) => [
              Math.round((x / width) * maxDrawingVal),
              Math.round((y / height) * maxDrawingVal),
            ]),
          );
        },
      });

      this._context = canvas.getContext('2d', { alpha: false })!;
      //debugger;
      this._resetCanvas();
    });
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

    const { width, height } = this._canvas!.getBoundingClientRect();
    drawPathData(width, height, this._drawingData!, this._context!);
  };

  private _onSendClick = () => {
    const { width, height } = this._canvas!.getBoundingClientRect();
    const dataArray = new Uint16Array(this._drawingData!);
    const uint8 = new Uint8Array(dataArray.buffer);
    const data = bufferToBase64(uint8.buffer);
    const body = JSON.stringify({ width, height, data });
    this.props.onSubmit(body);
  };

  private _onMqChange = () => {
    this.setState({ desktopMode: mqList!.matches });
  };

  private _beginArtingClick = () => {
    const el = this._drawingContainer.current as HTMLDivElement;
    if ('requestFullscreen' in el) {
      el.requestFullscreen();
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    this.setState({ fallbackFullscreen: true });
  };

  componentDidMount() {
    mqList!.addListener(this._onMqChange);
  }

  componentWillUnmount() {
    mqList!.removeListener(this._onMqChange);
  }

  render(
    { previousPlayer, submitting }: Props,
    { drawingBegun, desktopMode, fallbackFullscreen }: State,
  ) {
    return (
      <div>
        <div class="content-box">
          <h2 class="content-box-title">Draw it!</h2>
          <div class="content-padding">
            <p>
              {previousPlayer.name} wants you to draw "
              {previousPlayer.turnData!}".
            </p>
          </div>
        </div>
        {!desktopMode && (
          <div class="hero-button-container">
            <button class="button hero-button" onClick={this._beginArtingClick}>
              Begin arting
            </button>
          </div>
        )}
        <div
          ref={this._drawingContainer}
          class={`content-box ${
            desktopMode
              ? ''
              : fallbackFullscreen
              ? 'fallback-fullscreen'
              : 'drawing-mobile'
          }`}
        >
          <div
            class={`drawing-container ${
              drawingBegun ? '' : 'allow-canvas-resize'
            }`}
          >
            <div class="thing-to-draw">"{previousPlayer.turnData!}"</div>
            <div class="canvas-container">
              <IframeOnResize onResize={this._iframeWindowResize} />
              <canvas class="drawing-canvas" ref={this._canvasMount} />
            </div>
            {!isServer && (
              <div class="drawing-controls">
                <button
                  class="button button-bad"
                  onClick={this._onClearClick}
                  disabled={!drawingBegun}
                >
                  Clear
                </button>
                <button
                  class="button"
                  onClick={this._onUndoClick}
                  disabled={!drawingBegun}
                >
                  Undo
                </button>
                <button
                  onClick={this._onSendClick}
                  disabled={!drawingBegun || submitting}
                  class="button"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
