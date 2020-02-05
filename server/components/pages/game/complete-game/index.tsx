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

import { Game, GamePlayer } from 'server/data/models';

interface Props {
  game: Game;
  players: GamePlayer[];
}

const CompleteGame: FunctionalComponent<Props> = ({ game, players }) => (
  <div>
    <h2>Game: {game.id}</h2>
    <div>
      {players.map((player, i) =>
        i === 0 ? (
          <div>
            The game was started by {player.name}, and they chose the topic "
            {player.turnData}".
          </div>
        ) : i % 2 ? (
          <div>
            Here's what {player.name} drew:
            {(() => {
              const turnData = JSON.parse(player.turnData!);
              return (
                <canvas
                  class="final-drawing-canvas"
                  width={turnData.width}
                  height={turnData.height}
                  data-line-width={turnData.lineWidth}
                  data-path={turnData.data}
                  style="display: block; width: 100%"
                />
              );
            })()}
          </div>
        ) : (
          <div>
            {player.name} thought that was "{player.turnData}"
          </div>
        ),
      )}
    </div>
  </div>
);

export default CompleteGame;
