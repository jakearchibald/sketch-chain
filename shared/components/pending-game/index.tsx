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
import { Game, Player } from 'shared/types';
import { minPlayers } from 'shared/config';

interface Props {
  userId?: string;
  userIsAdmin: boolean;
  game: Game;
  players: Player[];
}

interface State {
  joining: boolean;
  leaving: boolean;
  starting: boolean;
}

export default class PendingGame extends Component<Props, State> {
  state: State = {
    joining: false,
    leaving: false,
    starting: false,
  };

  private _onJoinSubmit = async (event: Event) => {
    // If there's no user, let it navigate through the login process
    if (!this.props.userId) return;
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
    this.setState({ leaving: true });
    const response = await fetch('leave?json=1', { method: 'POST' });
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
    }
    this.setState({ leaving: false });
  };

  private _onStartSubmit = async (event: Event) => {
    event.preventDefault();
    this.setState({ starting: true });
    const response = await fetch('start?json=1', { method: 'POST' });
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
    }
    this.setState({ starting: false });
  };

  render(
    { players, userId, game, userIsAdmin }: Props,
    { joining, leaving, starting }: State,
  ) {
    const userIsInGame = !!(
      userId && players.some(player => player.userId === userId)
    );

    return (
      <div>
        <h2>Waiting for players</h2>
        <p>Share this page with others and get them to join.</p>
        <p>
          You need {minPlayers} players to start a game, but the more the
          merrier!
        </p>
        <h2>Players</h2>
        <ul>
          {players.map(player => (
            <li key={player.userId}>
              {player.name} {player.isAdmin && '(admin)'}
            </li>
          ))}
        </ul>
        {!userIsInGame ? (
          <form
            action="join"
            method="POST"
            onSubmit={this._onJoinSubmit}
            disabled={joining}
          >
            <button>Join</button>
          </form>
        ) : userIsAdmin ? (
          <form action="cancel" method="POST">
            <button>Cancel game</button>
          </form>
        ) : (
          <form
            action="leave"
            method="POST"
            onSubmit={this._onLeaveSubmit}
            disabled={leaving}
          >
            <button>Leave</button>
          </form>
        )}
        {userIsAdmin && players.length >= minPlayers && (
          <form
            action="start"
            method="POST"
            onSubmit={this._onStartSubmit}
            disabled={starting}
          >
            <button>Start</button>
          </form>
        )}
      </div>
    );
  }
}
