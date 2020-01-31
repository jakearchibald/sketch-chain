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
import { Game as GameType, Player, GameState } from 'shared/types';
import PendingGame from '../pending-game';

interface Props {
  userId?: string;
  game: GameType;
  players: Player[];
}

const IncompleteGame: FunctionalComponent<Props> = ({
  userId,
  game,
  players,
}) => {
  const userIsAdmin = !!(
    userId && players.find(player => player.isAdmin)!.userId === userId
  );

  return (
    <div>
      {game.state === GameState.Open ? (
        <PendingGame
          userIsAdmin={userIsAdmin}
          userId={userId}
          game={game}
          players={players}
        />
      ) : (
        'TODO show progress of game, or allow player to play'
      )}
    </div>
  );
};

export default IncompleteGame;
