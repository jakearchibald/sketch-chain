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

import { Player } from 'shared/types';
import { maxDescriptionLength } from 'shared/config';
import CompleteDrawing from 'shared/components/complete-drawing';

interface Props {
  previousPlayer: Player;
  submitting: boolean;
  onSubmit: (turnData: string) => void;
}

interface TurnData {
  width: number;
  height: number;
  lineWidth: number;
  data: string;
}

export default class DescribeRound extends Component<Props> {
  private _cachedTurnData?: string;
  private _parsedTurnData?: TurnData;

  private _onSubmit = (event: Event) => {
    const form = event.target as HTMLFormElement;
    const input = form.turn as HTMLInputElement;
    this.props.onSubmit(input.value);
    event.preventDefault();
  };

  render({ previousPlayer, submitting }: Props) {
    if (this._cachedTurnData !== previousPlayer.turnData) {
      this._parsedTurnData = JSON.parse(previousPlayer.turnData!);
      this._cachedTurnData = previousPlayer.turnData!;
    }

    return (
      <div>
        <div class="content-box">
          <CompleteDrawing
            width={this._parsedTurnData!.width}
            height={this._parsedTurnData!.height}
            lineWidth={this._parsedTurnData!.lineWidth}
            pathBase64={this._parsedTurnData!.data}
          />
        </div>
        <div class="content-box">
          <h2 class="content-box-title">What is it?</h2>
          <form
            action="play"
            disabled={submitting}
            onSubmit={this._onSubmit}
            class="content-padding"
          >
            <p>What do you think {previousPlayer.name} drew here?</p>
            <div class="input-submit">
              <input
                class="large-text-input"
                type="text"
                name="turn"
                placeholder="…"
                required
                maxLength={maxDescriptionLength}
              />
              <button class="button">Send it on</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
