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
import { h, FunctionalComponent } from 'preact';
import { GameState, Game } from 'shared/types';

interface Props {
  userGames: Game[];
}

const GameList: FunctionalComponent<Props> = ({ userGames }) => {
  return (
    <ul class="game-list">
      {userGames.map(userGame => (
        <li>
          <a href={`/game/${userGame.id}/`}>
            <span class="game-name">{userGame.id}</span>
            <span class="game-state">
              {userGame.state === GameState.Open
                ? 'Waiting for players'
                : userGame.state === GameState.Complete
                ? 'Complete'
                : 'Playing'}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default GameList;
