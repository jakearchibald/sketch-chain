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
import { Game as GameType, GameState, Thread, Turn } from 'shared/types';
import PendingGame from './pending-game';
import ActiveGame from './active-game';

interface Props {
  userId?: string;
  game: GameType;
  inPlayThread: Thread | null;
  lastTurnInThread: Turn | null;
}

const IncompleteGame: FunctionalComponent<Props> = ({
  userId,
  game,
  inPlayThread,
  lastTurnInThread,
}) => {
  const userPlayer = userId
    ? game.players!.find(
        (player) => player.userId === userId && !player.leftGame,
      )
    : undefined;

  return (
    <div>
      {game.state === GameState.Open ? (
        <PendingGame userPlayer={userPlayer} game={game} />
      ) : (
        <ActiveGame
          userPlayer={userPlayer}
          game={game}
          inPlayThread={inPlayThread}
          lastTurnInThread={lastTurnInThread}
        />
      )}
    </div>
  );
};

export default IncompleteGame;
