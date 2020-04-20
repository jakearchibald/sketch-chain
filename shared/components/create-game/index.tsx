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
import { createPortal } from 'preact/compat';

import isServer from 'consts:isServer';
import placeholderAvatar from 'asset-url:shared/assets/avatar.svg';
import Modal, { modalContainer } from 'shared/components/modal';

const showCreateModalSessionKey = 'show-create';

interface Props {
  userDetails?: { name: string; picture?: string };
  hideAvatar: boolean;
}

interface State {
  showCreateDialog: boolean;
  hideAvatar: boolean;
}

export const preferredNameKey = 'preferredName';
export const hideAvatarKey = 'hideAvatar';

export default class CreateGame extends Component<Props, State> {
  state: State = {
    showCreateDialog: false,
    hideAvatar: this.props.hideAvatar,
  };

  private _onLoginSubmit = () => {
    sessionStorage.setItem(showCreateModalSessionKey, '1');
  };

  private _onCreateGameClick = () => {
    this.setState({ showCreateDialog: true });
  };

  private _onCancelClick = () => {
    this.setState({ showCreateDialog: false });
  };

  private _hideAvatarChange = () => {
    this.setState((state) => ({
      hideAvatar: !state.hideAvatar,
    }));
  };

  componentDidMount() {
    const showCreateDialog = !!sessionStorage.getItem(
      showCreateModalSessionKey,
    );
    if (!showCreateDialog) return;
    sessionStorage.removeItem(showCreateModalSessionKey);
    this.setState({ showCreateDialog: true });
  }

  render({ userDetails }: Props, { showCreateDialog, hideAvatar }: State) {
    if (!userDetails) {
      return (
        <form
          method="POST"
          action="/auth/login"
          class="hero-button-container"
          onSubmit={this._onLoginSubmit}
          style={{ visibility: isServer ? 'hidden' : '' }}
        >
          <button class="button hero-button">Create game</button>
        </form>
      );
    }
    return (
      <Fragment>
        <button
          class="button hero-button"
          style={{ visibility: isServer ? 'hidden' : '' }}
          onClick={this._onCreateGameClick}
        >
          Create game
        </button>
        {showCreateDialog &&
          createPortal(
            <form method="POST" action="/create-game">
              <Modal
                title="Options"
                content={
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
                        value={userDetails.name}
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
                            onInput={this._hideAvatarChange}
                          />{' '}
                          Hide avatar
                        </label>
                      </p>
                    )}
                  </Fragment>
                }
                buttons={[
                  <button
                    type="button"
                    class="button"
                    onClick={this._onCancelClick}
                  >
                    Cancel
                  </button>,
                  <button type="submit" class="button button-good">
                    Create game
                  </button>,
                ]}
              />
            </form>,
            modalContainer!,
          )}
      </Fragment>
    );
  }
}
