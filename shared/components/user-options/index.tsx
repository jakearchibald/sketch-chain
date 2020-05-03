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
import { h, Component, Fragment } from 'preact';
import placeholderAvatar from 'asset-url:shared/assets/avatar.svg';

interface Props {
  userDetails: { name: string; picture?: string };
  hideAvatar: boolean;
}

interface State {
  hideAvatar: boolean;
  playerName: string;
}

export const preferredNameKey = 'preferredName';
export const hideAvatarKey = 'hideAvatar';

export default class UserOptions extends Component<Props, State> {
  state: State = {
    hideAvatar: this.props.hideAvatar,
    playerName: this.props.userDetails ? this.props.userDetails.name : '',
  };

  private _onHideAvatarChange = () => {
    this.setState((state) => ({
      hideAvatar: !state.hideAvatar,
    }));
  };

  private _onNameInput = (event: Event) => {
    this.setState({
      playerName: (event.target as HTMLInputElement).value,
    });
  };

  render({ userDetails }: Props, { hideAvatar, playerName }: State) {
    return (
      <Fragment>
        <p>Choose your name:</p>
        <div class="user-appearance">
          {userDetails.picture && !hideAvatar ? (
            <img
              width="40"
              height="40"
              alt=""
              src={`${userDetails.picture}=s${40}-c`}
              srcset={`${userDetails.picture}=s${80}-c 2x`}
              class="avatar"
            />
          ) : (
            <img
              width="40"
              height="40"
              alt=""
              src={placeholderAvatar}
              class="avatar"
            />
          )}
          <input
            type="text"
            class="large-text-input"
            value={playerName}
            onInput={this._onNameInput}
            name="player-name"
            required
          />
        </div>
        {userDetails.picture && (
          <p>
            <label>
              <input
                type="checkbox"
                checked={hideAvatar}
                name="hide-avatar"
                value="1"
                onInput={this._onHideAvatarChange}
              />{' '}
              Hide avatar
            </label>
          </p>
        )}
      </Fragment>
    );
  }
}
