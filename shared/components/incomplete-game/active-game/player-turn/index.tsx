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
import { Player, Thread, Turn, TurnType } from 'shared/types';
import FirstRound from './first-round';
import DrawingRound from './drawing-round';
import DescribeRound from './describe-round';
import { createPortal } from 'preact/compat';
import Modal, { modalContainer } from 'shared/components/modal';

interface Props {
  players: Player[];
  thread: Thread;
  previousTurn: Turn | null;
}

interface State {
  submitting: boolean;
  error?: { title: string; text: string };
}

export default class PlayerTurn extends Component<Props, State> {
  state: State = {
    submitting: false,
  };

  private _onTurnSubmit = async (turnData: URLSearchParams) => {
    this.setState({ submitting: true });

    try {
      const response = await fetch('play?json=1', {
        method: 'POST',
        body: turnData,
      });
      const data = await response.json();
      if (data.error) {
        this.setState({
          error: {
            title: 'Error',
            text: data.error,
          },
        });
      }
    } catch (err) {
      this.setState({
        error: {
          title: 'Connection error',
          text: `Couldn't connect to the server. Please try again.`,
        },
      });
    } finally {
      this.setState({ submitting: false });
    }
  };

  private _clearError = () => {
    this.setState({
      error: undefined,
    });
  };

  render(
    { players, previousTurn, thread }: Props,
    { submitting, error }: State,
  ) {
    const previousPlayer: Player | undefined = previousTurn
      ? players.find((player) => player.id === previousTurn.playerId)
      : undefined;

    // The players in order for this particular thread.
    const threadPlayers = [
      ...players.slice(thread.turnOffset),
      ...players.slice(0, thread.turnOffset),
    ];

    const nextPlayer = threadPlayers
      .slice(thread.turn + 1)
      .find((player) => !player.leftGame);

    return (
      <div>
        {!previousTurn ? (
          <FirstRound
            thread={thread}
            onSubmit={this._onTurnSubmit}
            nextPlayer={nextPlayer}
            submitting={submitting}
          />
        ) : previousTurn.type === TurnType.Describe ? (
          <DrawingRound
            thread={thread}
            previousTurn={previousTurn!}
            onSubmit={this._onTurnSubmit}
            previousPlayer={previousPlayer!}
            submitting={submitting}
          />
        ) : (
          <DescribeRound
            thread={thread}
            onSubmit={this._onTurnSubmit}
            previousTurn={previousTurn!}
            previousPlayer={previousPlayer!}
            submitting={submitting}
          />
        )}
        {error &&
          createPortal(
            <Modal
              title={error.title}
              content={<p>{error.text}</p>}
              buttons={[
                <button class="button" onClick={this._clearError}>
                  Ok
                </button>,
              ]}
            />,
            modalContainer!,
          )}
      </div>
    );
  }
}
