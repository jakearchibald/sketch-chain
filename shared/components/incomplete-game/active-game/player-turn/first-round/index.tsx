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

interface Props {
  // It's rare for nextPlayer to be undefined.
  // It would only be if the game started
  // and everyone else left during the first turn.
  nextPlayer?: Player;
  submitting: boolean;
  onSubmit: (turnData: string) => void;
}

export default class FirstRound extends Component<Props> {
  private _onSubmit = (event: Event) => {
    const form = event.target as HTMLFormElement;
    const input = form.turn as HTMLInputElement;
    this.props.onSubmit(input.value);
    event.preventDefault();
  };

  render({ nextPlayer, submitting }: Props) {
    return (
      <div>
        <form action="play" disabled={submitting} onSubmit={this._onSubmit}>
          <label>
            Describe something for{' '}
            {nextPlayer ? nextPlayer.name : 'the next plater'} to draw:{' '}
            <input
              type="text"
              name="turn"
              required
              maxLength={maxDescriptionLength}
            />
            <button>Send it on</button>
          </label>
        </form>
        <p>TODO: first round instructions</p>
      </div>
    );
  }
}
