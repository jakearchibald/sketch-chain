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
import { Game, Player, GameState } from 'shared/types';

interface Props {
  game: Game;
  userPlayer?: Player;
  warnOnLeave?: boolean;
}

interface State {
  joining: boolean;
  leaving: boolean;
}

export default class ChangeParticipation extends Component<Props, State> {
  state: State = {
    joining: false,
    leaving: false,
  };

  private _onJoinSubmit = async (event: Event) => {
    // If there's no user, let them navigate through the login process
    if (!this.props.userPlayer) return;
    event.preventDefault();
    this.setState({ joining: true });
    const response = await fetch('join?json=1', { method: 'POST' });
    const data = await response.json();

    if (data.redirectTo) {
      location.href = data.redirectTo;
      return;
    }

    if (data.error) {
      console.error(data.error);
    }

    this.setState({ joining: false });
  };

  private _onLeaveSubmit = async (event: Event) => {
    event.preventDefault();

    if (this.props.warnOnLeave && !confirm('Leave game?')) {
      return;
    }

    this.setState({ leaving: true });
    const response = await fetch('leave?json=1', { method: 'POST' });
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
    }
    this.setState({ leaving: false });
  };

  private _onCancelSubmit = (event: Event) => {
    if (!confirm('Cancel game?')) {
      event.preventDefault();
      return;
    }
  };

  render({ game, userPlayer }: Props, { joining, leaving }: State) {
    return [
      !userPlayer ? (
        game.state === GameState.Open && (
          <form
            action="join"
            method="POST"
            onSubmit={this._onJoinSubmit}
            disabled={joining}
          >
            <button class="button hero-button">Join</button>
          </form>
        )
      ) : userPlayer.isAdmin ? (
        <form action="cancel" method="POST" onSubmit={this._onCancelSubmit}>
          <button class="button hero-button button-bad">Cancel game</button>
        </form>
      ) : game.state === GameState.Open || game.turn <= userPlayer.order! ? (
        <form
          action="leave"
          method="POST"
          onSubmit={this._onLeaveSubmit}
          disabled={leaving}
        >
          <button class="button hero-button button-bad">Leave</button>
        </form>
      ) : (
        false
      ),
    ];
  }
}
