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
import ChangeParticipation from '../change-participation';
import WhatIsThis from 'shared/components/what-is-this';

interface Props {
  userPlayer?: Player;
  game: Game;
  players: Player[];
}

interface State {
  starting: boolean;
}

export default class PendingGame extends Component<Props, State> {
  state: State = {
    starting: false,
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

  render({ players, game, userPlayer }: Props, { starting }: State) {
    return (
      <div>
        <ChangeParticipation game={game} userPlayer={userPlayer} />
        {userPlayer?.isAdmin ? (
          <div class="content-box">
            <h2 class="content-box-title">Waiting for players</h2>
            <div class="content-padding">
              <p>Share this page with others and get them to join.</p>
              <p>
                You need {minPlayers} players to start a game, but the more the
                merrier!
              </p>
            </div>
          </div>
        ) : (
          <WhatIsThis />
        )}
        <div class="content-box">
          <h2 class="content-box-title">Players</h2>
          <div class="content-padding">
            <ul class="player-list">
              {players.map(player => (
                <li key={player.userId}>
                  {player.avatar && (
                    <img
                      width="40"
                      height="40"
                      alt=""
                      src={`${player.avatar}=s${40}-c`}
                      srcset={`${player.avatar}=s${80}-c 2x`}
                    />
                  )}
                  <div>
                    {player.name} {player.isAdmin && '(admin)'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {userPlayer?.isAdmin && players.length >= minPlayers && (
          <form
            action="start"
            method="POST"
            onSubmit={this._onStartSubmit}
            disabled={starting}
            class="hero-button-container"
          >
            <button class="button hero-button">Start</button>
          </form>
        )}
      </div>
    );
  }
}
