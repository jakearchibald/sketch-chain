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
import CompleteDrawing from 'shared/components/complete-drawing';

interface Props {
  game: Game;
  players: GamePlayer[];
}

const CompleteGame: FunctionalComponent<Props> = ({ game, players }) => (
  <div>
    <div>
      <div class="content-box">
        {players.map((player, i) =>
          i === 0 ? (
            <div>
              <h2 class="content-box-title">{player.turnData}</h2>
              <div class="content-padding">
                <div class="avatar-description">
                  {player.avatar && (
                    <img
                      width="40"
                      height="40"
                      alt=""
                      src={`${player.avatar}=s${40}-c`}
                      srcset={`${player.avatar}=s${80}-c 2x`}
                    />
                  )}
                  <div class="avatar-description-description">
                    <p>{player.name} picked the topic.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : i % 2 ? (
            <div>
              <div class="content-padding content-hr">
                <div class="avatar-description">
                  {player.avatar && (
                    <img
                      width="40"
                      height="40"
                      alt=""
                      src={`${player.avatar}=s${40}-c`}
                      srcset={`${player.avatar}=s${80}-c 2x`}
                    />
                  )}
                  <div class="avatar-description-description">
                    <p>{player.name} tried to draw that:</p>
                  </div>
                </div>
              </div>
              {(() => {
                const turnData = JSON.parse(player.turnData!);
                return (
                  <div
                    class="final-drawing-canvas-container"
                    data-path={turnData.data}
                  >
                    <CompleteDrawing
                      width={turnData.width}
                      height={turnData.height}
                      pathBase64={turnData.data}
                    />
                  </div>
                );
              })()}
            </div>
          ) : (
            <div>
              <div class="content-padding content-hr">
                <div class="avatar-description">
                  {player.avatar && (
                    <img
                      width="40"
                      height="40"
                      alt=""
                      src={`${player.avatar}=s${40}-c`}
                      srcset={`${player.avatar}=s${80}-c 2x`}
                    />
                  )}
                  <div class="avatar-description-description">
                    <p>
                      {player.name} thought that was "{player.turnData}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  </div>
);

export default CompleteGame;
