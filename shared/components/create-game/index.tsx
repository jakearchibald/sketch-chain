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
import Modal, { modalContainer } from 'shared/components/modal';
import UserOptions from 'shared/components/user-options';
import { UserPrefs } from 'shared/types';
import { setUserPrefs } from 'shared/utils/user-prefs';

const showCreateModalSessionKey = 'show-create';

interface Props {
  userPrefs?: UserPrefs;
}

interface State {
  showCreateDialog: boolean;
}

export default class CreateGame extends Component<Props, State> {
  state: State = {
    showCreateDialog: false,
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

  private _onCreateFormSubmit = (event: Event) => {
    const data = new FormData(event.target as HTMLFormElement);
    setUserPrefs(data.get('player-name') as string, !!data.get('hide-avatar'));
  };

  componentDidMount() {
    const showCreateDialog = !!sessionStorage.getItem(
      showCreateModalSessionKey,
    );
    if (!showCreateDialog) return;
    sessionStorage.removeItem(showCreateModalSessionKey);
    this.setState({ showCreateDialog: true });
  }

  render({ userPrefs }: Props, { showCreateDialog }: State) {
    if (!userPrefs) {
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
            <form
              method="POST"
              action="/create-game"
              onSubmit={this._onCreateFormSubmit}
            >
              <Modal
                title="Options"
                content={<UserOptions userPrefs={userPrefs} />}
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
