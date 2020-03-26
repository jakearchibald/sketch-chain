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

import { Player, Thread } from 'shared/types';
import { maxDescriptionLength } from 'shared/config';

interface Props {
  // It's rare for nextPlayer to be undefined.
  // It would only be if the game started
  // and everyone else left during the first turn.
  nextPlayer?: Player;
  thread: Thread;
  submitting: boolean;
  onSubmit: (turnData: URLSearchParams) => void;
}

export default class FirstRound extends Component<Props> {
  private _onSubmit = (event: Event) => {
    const form = event.target as HTMLFormElement;
    const data = new URLSearchParams(
      (new FormData(form) as unknown) as string[][],
    );
    this.props.onSubmit(data);
    event.preventDefault();
  };

  render({ nextPlayer, submitting, thread }: Props) {
    return (
      <div>
        <div class="content-box">
          <h2 class="content-box-title">Pick a topic</h2>
          <form
            action="play"
            disabled={submitting}
            onSubmit={this._onSubmit}
            class="content-padding"
          >
            <p>
              Describe something for{' '}
              {nextPlayer ? nextPlayer.name : 'the next player'} to draw:
            </p>
            <input type="hidden" name="thread" value={thread.id} />
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
        <div class="content-box">
          <h2 class="content-box-title">How to pick a topic</h2>
          <div class="content-padding">
            <p>
              Avoid things that are too easy to draw. For instance, "cat" and
              "house" are too easy, but "horse" is much harder.
            </p>
            <p>
              Avoid things that are too vague. "Star wars" has too many
              representations, meaning the next player will draw something
              specific, and that specific thing will be described. "Darth vader"
              would be a better choice.
            </p>
            <p>
              Avoid things that other players might not know. Sure, pick
              "Benjamin Disraeli" if everyone in the group is a political
              historian, but otherwise… maybe not.
            </p>
            <p>
              If you want it mix it up a bit, go for an unusual compound topic,
              like "A dog playing a harp".
            </p>
          </div>
        </div>
      </div>
    );
  }
}
