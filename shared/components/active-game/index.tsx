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

interface Props {
  userId?: string;
  userIsAdmin: boolean;
  game: Game;
  players: Player[];
}

interface State {
  removing: boolean;
}

export default class ActiveGame extends Component<Props, State> {
  state: State = {
    removing: false,
  };

  private _onRemoveSubmit = async (event: Event) => {
    event.preventDefault();
    this.setState({ removing: true });
    const form = event.target as HTMLFormElement;
    const formDataEntries = [...new FormData(form)] as Array<[string, string]>;
    const body = new URLSearchParams(formDataEntries);
    const response = await fetch('leave?json=1', { method: 'POST', body });
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
    }
    this.setState({ removing: false });
  };

  render({ players, userId, game, userIsAdmin }: Props, { removing }: State) {
    return (
      <div>
        <h2>Waiting on players</h2>
        <ol>
          {players.map(player => (
            <li key={player.userId}>
              {player.order === game.turn && '➡️'} {player.name}
              {userIsAdmin && !player.isAdmin && player.order! >= game.turn && (
                <form
                  action="leave"
                  method="POST"
                  onSubmit={this._onRemoveSubmit}
                  disabled={removing}
                >
                  <input type="hidden" name="player" value={player.userId} />
                  <button>Remove</button>
                </form>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }
}
