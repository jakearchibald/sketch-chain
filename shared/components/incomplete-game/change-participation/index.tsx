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
import { h, Component, createRef, Fragment } from 'preact';
import { createPortal } from 'preact/compat';

import { Game, Player, GameState, UserPrefs } from 'shared/types';
import Modal, { modalContainer } from 'shared/components/modal';
import isServer from 'consts:isServer';
import UserOptions from 'shared/components/user-options';
import { setUserPrefs } from 'shared/utils/user-prefs';

const showJoinModalSessionKey = 'show-join';

interface Props {
  game: Game;
  userPrefs?: UserPrefs;
  userPlayer?: Player;
  warnOnLeave?: boolean;
}

interface State {
  joining: boolean;
  leaving: boolean;
  confirmCancel: boolean;
  confirmLeave: boolean;
  showJoinDialog: boolean;
  error?: { title: string; text: string };
}

export default class ChangeParticipation extends Component<Props, State> {
  state: State = {
    joining: false,
    leaving: false,
    confirmCancel: false,
    confirmLeave: false,
    showJoinDialog: false,
  };

  private _cancelForm = createRef<HTMLFormElement>();

  private _onLoginSubmit = () => {
    sessionStorage.setItem(showJoinModalSessionKey, '1');
  };

  private _onJoinSubmit = async (event: Event) => {
    event.preventDefault();
    this._clearModals();
    this.setState({ joining: true });
    const formData = new URLSearchParams([
      ...new FormData(event.target as HTMLFormElement),
    ] as [string, string][]);

    setUserPrefs(
      formData.get('player-name') as string,
      !!formData.get('hide-avatar'),
    );

    try {
      const response = await fetch('join?json=1', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        this.setState({
          error: {
            title: 'Error',
            text: data.error,
          },
        });
      }
    } catch (err) {
      this.setState({
        error: {
          title: 'Connection error',
          text: `Couldn't connect to the server. Please try again.`,
        },
      });
    } finally {
      this.setState({ joining: false });
    }
  };

  private _onJoinGameClick = () => {
    this.setState({ showJoinDialog: true });
  };

  private _onLeaveSubmit = async (event: Event) => {
    event.preventDefault();

    if (this.props.warnOnLeave) {
      this.setState({ confirmLeave: true });
      return;
    }

    this._leaveGame();
  };

  private _onCancelSubmit = (event: Event) => {
    event.preventDefault();
    this.setState({
      confirmCancel: true,
    });
  };

  private _clearModals = () => {
    this.setState({
      confirmCancel: false,
      confirmLeave: false,
      showJoinDialog: false,
      error: undefined,
    });
  };

  private _modalCancelGameClick = () => {
    this._clearModals();
    this._cancelForm.current!.submit();
  };

  private _leaveGame = async () => {
    this._clearModals();
    this.setState({ leaving: true });

    try {
      const response = await fetch('leave?json=1', { method: 'POST' });
      const data = await response.json();
      if (data.error) {
        this.setState({
          error: {
            title: 'Error',
            text: data.error,
          },
        });
      }
    } catch (err) {
      this.setState({
        error: {
          title: 'Connection error',
          text: `Couldn't connect to the server. Please try again.`,
        },
      });
    } finally {
      this.setState({ leaving: false });
    }
  };

  componentDidMount() {
    const showJoinDialog = !!sessionStorage.getItem(showJoinModalSessionKey);
    if (!showJoinDialog) return;
    sessionStorage.removeItem(showJoinModalSessionKey);
    this.setState({ showJoinDialog: true });
  }

  render(
    { game, userPlayer, userPrefs }: Props,
    {
      joining,
      leaving,
      confirmCancel,
      confirmLeave,
      error,
      showJoinDialog,
    }: State,
  ) {
    return [
      !userPlayer ? (
        game.state === GameState.Open &&
        (!userPrefs ? (
          <form
            method="POST"
            action="/auth/login"
            onSubmit={this._onLoginSubmit}
            style={{ visibility: isServer ? 'hidden' : '' }}
          >
            <button class="button hero-button">Join</button>
          </form>
        ) : (
          <button
            class="button hero-button"
            style={{ visibility: isServer ? 'hidden' : '' }}
            onClick={this._onJoinGameClick}
            disabled={joining}
          >
            Join
          </button>
        ))
      ) : userPlayer.isAdmin ? (
        <form
          ref={this._cancelForm}
          action="cancel"
          method="POST"
          onSubmit={this._onCancelSubmit}
        >
          <button class="button hero-button button-bad">Cancel game</button>
        </form>
      ) : (
        <form action="leave" method="POST" onSubmit={this._onLeaveSubmit}>
          <button class="button hero-button button-bad" disabled={leaving}>
            Leave
          </button>
        </form>
      ),
      showJoinDialog &&
        createPortal(
          <form action="join" method="POST" onSubmit={this._onJoinSubmit}>
            <Modal
              title="Options"
              content={<UserOptions userPrefs={userPrefs!} />}
              buttons={[
                <button
                  type="button"
                  class="button"
                  onClick={this._clearModals}
                >
                  Cancel
                </button>,
                <button type="submit" class="button button-good">
                  Join game
                </button>,
              ]}
            />
          </form>,
          modalContainer!,
        ),
      confirmCancel &&
        createPortal(
          <Modal
            title="Cancel game?"
            content={
              <p>
                All data about this game will be deleted and cannot be undone.
              </p>
            }
            buttons={[
              <button class="button" onClick={this._clearModals}>
                Back
              </button>,
              <button
                class="button button-bad"
                onClick={this._modalCancelGameClick}
              >
                Cancel game
              </button>,
            ]}
          />,
          modalContainer!,
        ),
      confirmLeave &&
        createPortal(
          <Modal
            title="Leave game?"
            content={
              <p>
                This means you will skip all your remaining turns. It cannot be
                undone.
              </p>
            }
            buttons={[
              <button class="button" onClick={this._clearModals}>
                Back
              </button>,
              <button class="button button-bad" onClick={this._leaveGame}>
                Leave game
              </button>,
            ]}
          />,
          modalContainer!,
        ),
      error &&
        createPortal(
          <Modal
            title={error.title}
            content={<p>{error.text}</p>}
            buttons={[
              <button class="button" onClick={this._clearModals}>
                Ok
              </button>,
            ]}
          />,
          modalContainer!,
        ),
    ];
  }
}
