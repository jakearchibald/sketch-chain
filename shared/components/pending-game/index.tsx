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

interface State {}

export default class PendingGame extends Component<Props, State> {
  state: State = {};

  render({ players, userId, game, userIsAdmin }: Props, {}: State) {
    const userIsInGame = !!(
      userId && players.some(player => player.userId === userId)
    );

    return (
      <div>
        <h2>Waiting for players</h2>
        <p>Share this page with others and get them to join.</p>
        <p>You need {minPlayers} players to start a game.</p>
        <h2>Players</h2>
        <ul>
          {players.map(player => (
            <li key={player.userId}>
              {player.name} {player.isAdmin && '(admin)'}
            </li>
          ))}
        </ul>
        {!userIsInGame ? (
          <form action={`/game/${game.id}/join`} method="POST">
            <button>Join</button>
          </form>
        ) : userIsAdmin ? (
          <form action={`/game/${game.id}/cancel`} method="POST">
            <button>Cancel game</button>
          </form>
        ) : (
          <form action={`/game/${game.id}/leave`} method="POST">
            <button>Leave</button>
          </form>
        )}
      </div>
    );
  }
}
