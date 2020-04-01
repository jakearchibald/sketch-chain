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

import { Player, Turn, Thread } from 'shared/types';
import isServer from 'consts:isServer';
import { bufferToBase64 } from 'shared/utils/base64';
import { penUp, maxDrawingVal } from 'shared/config';
import IframeOnResize from 'shared/components/iframe-on-resize';
import {
  resetCanvas,
  drawPoint,
  drawPathData,
  clearCanvas,
} from 'shared/utils/drawing-canvas';
import Modal from 'shared/components/modal';

/**
 * Returns new width and height.
 */
function cropDrawingData(
  width: number,
  height: number,
  drawingData: Uint16Array,
) {
  const padding = 20;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  // Get maxes and mins
  for (let i = 0; i < drawingData.length; i++) {
    const x = drawingData[i];
    if (x > maxDrawingVal) continue;
    i++;
    const y = drawingData[i];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  // Crop with padding
  const minXSize = Math.max(0, (minX / maxDrawingVal) * width - padding);
  const minYSize = Math.max(0, (minY / maxDrawingVal) * height - padding);
  const maxXSize = Math.min(width, (maxX / maxDrawingVal) * width + padding);
  const maxYSize = Math.min(height, (maxY / maxDrawingVal) * height + padding);
  const croppedWidth = maxXSize - minXSize;
  const croppedHeight = maxYSize - minYSize;
  const minXVal = (minXSize / width) * maxDrawingVal;
  const minYVal = (minYSize / height) * maxDrawingVal;
  const xDiff = width / croppedWidth;
  const yDiff = height / croppedHeight;

  // Apply the crop
  for (let i = 0; i < drawingData.length; i++) {
    const x = drawingData[i];
    if (x > maxDrawingVal) continue;
    drawingData[i] = Math.round((x - minXVal) * xDiff);
    i++;
    const y = drawingData[i];
    drawingData[i] = Math.round((y - minYVal) * yDiff);
  }

  return { width: croppedWidth, height: croppedHeight };
}

const mqList =
  typeof window !== 'undefined'
    ? window.matchMedia('(min-width: 500px)')
    : undefined;

const preventDefault = (e: Event) => e.preventDefault();

interface Props {
  previousPlayer: Player;
  submitting: boolean;
  previousTurn: Turn;
  thread: Thread;
  onSubmit: (turnData: URLSearchParams) => void;
}

interface State {
  drawingBegun: boolean;
  desktopMode: boolean;
  fallbackFullscreen: boolean;
  confirmClear: boolean;
  confirmSend: boolean;
}

export default class DrawingRound extends Component<Props, State> {
  state: State = {
    drawingBegun: false,
    fallbackFullscreen: false,
    desktopMode: !!mqList && mqList.matches,
    confirmClear: false,
    confirmSend: false,
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
  };

  private _iframeWindowResize = () => {
    if (this.state.drawingBegun) return;
    this._resetCanvas();
  };

  private _onClearClick = () => {
    this.setState({ confirmClear: true });
  };

  private _clearCanvas = () => {
    this._resetCanvas();
    this.setState({ drawingBegun: false });
    this._clearModals();
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
    this.setState({ confirmSend: true });
  };

  private _send = () => {
    this._clearModals();
    const { width, height } = this._canvas!.getBoundingClientRect();
    const dataArray = new Uint16Array(this._drawingData!);
    // This mutates dataArray:
    const { width: finalWidth, height: finalHeight } = cropDrawingData(
      width,
      height,
      dataArray,
    );
    const uint8 = new Uint8Array(dataArray.buffer);
    const data = bufferToBase64(uint8.buffer);
    const turn = JSON.stringify({
      width: finalWidth,
      height: finalHeight,
      data,
    });
    const formData = new URLSearchParams({
      turn,
      thread: this.props.thread.id.toString(),
    });
    this.props.onSubmit(formData);
  };

  private _onMqChange = () => {
    this.setState({ desktopMode: mqList!.matches });
  };

  private _beginArtingClick = () => {
    const el = this._drawingContainer.current as HTMLDivElement;
    // The easy way:
    if ('requestFullscreen' in el) {
      el.requestFullscreen();
      return;
    }
    // The iOS Safari way
    this._startFallbackFullscreen();
  };

  private _fallbackFullscreenUpdateSize = () => {
    this._drawingContainer.current.style.height =
      document.documentElement.clientHeight + 'px';
  };

  private _startFallbackFullscreen() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    window.addEventListener('resize', this._fallbackFullscreenUpdateSize);
    this._fallbackFullscreenUpdateSize();
    this.setState({ fallbackFullscreen: true });
  }

  private _stopFallbackFullscreen() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    window.removeEventListener('resize', this._fallbackFullscreenUpdateSize);
    this.setState({ fallbackFullscreen: false });
  }

  componentDidMount() {
    mqList!.addListener(this._onMqChange);

    const canvas = this._canvas;

    if (!canvas) {
      this._context = undefined;
      return;
    }

    const activePointers = new Map<number, { x: number; y: number }[]>();

    this._pointerTracker = new PointerTracker(canvas, {
      rawUpdates: true,
      start: (pointer, event) => {
        event.preventDefault();
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
      move: (_, changedPointers, event) => {
        event.preventDefault();
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
      end: (pointer) => {
        const { width, height } = canvas.getBoundingClientRect();
        const linePoints = simplify(activePointers.get(pointer.id)!, 0.8);
        activePointers.delete(pointer.id);
        this._drawingData!.push(
          penUp,
          ...linePoints.flatMap(({ x, y }) => [
            Math.round(Math.min(1, Math.max(0, x / width)) * maxDrawingVal),
            Math.round(Math.min(1, Math.max(0, y / height)) * maxDrawingVal),
          ]),
        );
      },
    });

    this._context = canvas.getContext('2d', { desynchronized: true })!;
    this._resetCanvas();
  }

  componentWillUnmount() {
    mqList!.removeListener(this._onMqChange);
    this._pointerTracker!.stop();

    if (this.state.fallbackFullscreen) this._stopFallbackFullscreen();
  }

  private _clearModals = () => {
    this.setState({
      confirmClear: false,
      confirmSend: false,
    });
  };

  render(
    { previousPlayer, submitting, previousTurn }: Props,
    {
      drawingBegun,
      desktopMode,
      fallbackFullscreen,
      confirmClear,
      confirmSend,
    }: State,
  ) {
    return (
      <div>
        <div class="content-box content-sized">
          <h2 class="content-box-title">Draw it!</h2>
          <div class="content-padding">
            <p>
              {previousPlayer.name} wants you to draw "{previousTurn.data!}".
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
            <div class="thing-to-draw">"{previousTurn.data!}"</div>
            <div class="canvas-container">
              <IframeOnResize onResize={this._iframeWindowResize} />
              <canvas
                class="drawing-canvas"
                ref={this._canvasMount}
                onContextMenu={preventDefault}
              />
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
          {confirmClear && (
            <Modal
              title="Clear canvas?"
              content={<p>This cannot be undone.</p>}
              buttons={[
                <button class="button" onClick={this._clearModals}>
                  Back
                </button>,
                <button class="button button-bad" onClick={this._clearCanvas}>
                  Clear
                </button>,
              ]}
            />
          )}
          {confirmSend && (
            <Modal
              title="Are you sure?"
              content={<p>Do you want to send this to the next player?</p>}
              buttons={[
                <button class="button" onClick={this._clearModals}>
                  No
                </button>,
                <button class="button button-bad" onClick={this._send}>
                  Yes
                </button>,
              ]}
            />
          )}
        </div>
      </div>
    );
  }
}
