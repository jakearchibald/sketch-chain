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

import CompleteDrawing from 'shared/components/complete-drawing';
import { Game, TurnType } from 'shared/types';

interface Props {
  game: Game;
}

const CompleteGame: FunctionalComponent<Props> = ({ game }) => (
  <div>
    <div>
      {game.threads!.map((thread) => {
        const firstTurn = thread.turns!.find(
          (turn) => turn.type === TurnType.Describe,
        );

        return (
          <div class="content-box">
            {firstTurn && <h2 class="content-box-title">{firstTurn.data}</h2>}
            {thread.turns!.map((turn, i) => {
              const player = game.players![
                (thread.turnOffset + i) % game.players!.length
              ];

              if (turn.type === TurnType.Skip) {
                return (
                  <div class={`content-padding ${i === 0 ? '' : 'content-hr'}`}>
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
                        <p>{player.name} skipped their turn.</p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (turn === firstTurn) {
                return (
                  <div class={`content-padding ${i === 0 ? '' : 'content-hr'}`}>
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
                );
              }

              if (turn.type === TurnType.Draw) {
                return (
                  <div>
                    <div
                      class={`content-padding ${i === 0 ? '' : 'content-hr'}`}
                    >
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
                      const turnData = JSON.parse(turn.data!);
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
                );
              }

              // Else describe:
              return (
                <div class={`content-padding ${i === 0 ? '' : 'content-hr'}`}>
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
                        {player.name} thought that was "{turn.data}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  </div>
);

export default CompleteGame;
