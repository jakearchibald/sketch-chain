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
import IframeOnResize from '../iframe-on-resize';
import { resetCanvas, drawPathData } from 'shared/drawing-canvas-utils';
import { base64ToBuffer } from 'shared/base64';
import isServer from 'consts:isServer';

interface Props {
  width: number;
  height: number;
  pathBase64: string;
}

interface State {}

export default class CompleteDrawing extends Component<Props, State> {
  private _canvas?: HTMLCanvasElement | null;
  private _context?: CanvasRenderingContext2D;
  private _cachedPathBase64?: string;
  private _cachedPathData?: Uint16Array;

  private _iframeWindowResize = () => {
    this._redrawCanvas();
  };

  private _canvasMount = (canvas: HTMLCanvasElement | null) => {
    this._canvas = canvas;
  };

  componentDidMount() {
    this._context = this._canvas!.getContext('2d')!;
    this._redrawCanvas();
  }

  private _redrawCanvas() {
    resetCanvas(this._context!, this.props.width, this.props.height);

    if (this.props.pathBase64 !== this._cachedPathBase64) {
      this._cachedPathData = new Uint16Array(
        base64ToBuffer(this.props.pathBase64),
      );
      this._cachedPathBase64 = this.props.pathBase64;
    }

    drawPathData(
      this.props.width,
      this.props.height,
      this._cachedPathData!,
      this._context!,
    );
  }

  render({ width, height }: Props) {
    return (
      <div class="complete-drawing">
        {isServer ? (
          <div />
        ) : (
          <IframeOnResize onResize={this._iframeWindowResize} />
        )}
        <canvas
          class="complete-canvas"
          ref={this._canvasMount}
          width={width}
          height={height}
        />
      </div>
    );
  }
}
