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
import ChangeParticipation from '../change-participation';
import PlayerTurn from './player-turn';

interface Props {
  userPlayer?: Player;
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

  render({ players, userPlayer, game }: Props, { removing }: State) {
    return (
      <div>
        {userPlayer?.order! === game.turn ? (
          <PlayerTurn game={game} userPlayer={userPlayer!} players={players} />
        ) : (
          <div class="content-box">
            <h2 class="content-box-title">Taking turns</h2>
            <div class="content-padding">
              <ol class="player-list">
                {players.map(player => (
                  <li key={player.userId}>
                    {player.avatar ? (
                      <img
                        width="40"
                        height="40"
                        alt=""
                        src={`${player.avatar}=s${40}-c`}
                        srcset={`${player.avatar}=s${80}-c 2x`}
                        class="player-avatar"
                      />
                    ) : (
                      <div />
                    )}
                    <div>
                      {player.name} {player.order === game.turn && '⬅️'}
                    </div>
                    <div>
                      {userPlayer?.isAdmin &&
                        !player.isAdmin &&
                        player.order! >= game.turn && (
                          <form
                            action="leave"
                            method="POST"
                            onSubmit={this._onRemoveSubmit}
                            disabled={removing}
                          >
                            <input
                              type="hidden"
                              name="player"
                              value={player.userId}
                            />
                            <button class="button button-bad">Remove</button>
                          </form>
                        )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <ChangeParticipation userPlayer={userPlayer} game={game} />
      </div>
    );
  }
}
