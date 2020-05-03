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

import { Game, Player, Thread, Turn, UserPrefs } from 'shared/types';
import ChangeParticipation from '../change-participation';
import PlayerTurn from './player-turn';
import NotificationToggle from '../notification-toggle';
import { getIsEnabled as getNotificationEnabled } from 'shared/utils/notificaiton-state';
import PlayerList from 'shared/components/player-list';

interface Props {
  userPlayer?: Player;
  game: Game;
  inPlayThread: Thread | null;
  lastTurnInThread: Turn | null;
  userPrefs?: UserPrefs;
}

interface State {}

export default class ActiveGame extends Component<Props, State> {
  private _activeNotificaiton?: Notification;

  private _handleNotifications(previousProps?: Props) {
    if (!this.props.inPlayThread) {
      this._activeNotificaiton?.close();
      return;
    }
    if (document.hasFocus() || !getNotificationEnabled()) return;
    if (previousProps && previousProps.inPlayThread) return;

    const notification = new Notification('Sketch Chain', {
      body: `It's your turn in game ${this.props.game.id}`,
      tag: this.props.game.id,
    });

    this._activeNotificaiton = notification;

    this._activeNotificaiton.addEventListener('click', () => {
      window.focus();
      notification.close();
    });
  }

  componentDidMount() {
    this._handleNotifications();
  }

  componentWillUnmount() {
    this._activeNotificaiton?.close();
  }

  componentDidUpdate(previousProps: Props) {
    this._handleNotifications(previousProps);
    // If we're displaying a new round, reset the scroll position
    if (
      this.props.lastTurnInThread?.id !== previousProps.lastTurnInThread?.id
    ) {
      window.scrollTo(0, 0);
    }
  }

  render({
    userPlayer,
    game,
    inPlayThread,
    lastTurnInThread,
    userPrefs,
  }: Props) {
    return (
      <div>
        {inPlayThread ? (
          <PlayerTurn
            // Make sure the component changes for the new turn
            key={lastTurnInThread ? lastTurnInThread.id : inPlayThread.id}
            players={game.players!}
            thread={inPlayThread}
            previousTurn={lastTurnInThread}
          />
        ) : (
          [
            <div class="content-box content-sized">
              <h2 class="content-box-title">Waiting</h2>
              <div class="content-padding">
                <p>Waiting on others to take their turn…</p>
              </div>
            </div>,
            <div class="hero-button-container">
              <NotificationToggle />
            </div>,
          ]
        )}
        <PlayerList userPlayer={userPlayer} game={game} />
        <div class="hero-button-container">
          <ChangeParticipation
            userPlayer={userPlayer}
            game={game}
            userPrefs={userPrefs}
            warnOnLeave
          />
          <NotificationToggle />
        </div>
      </div>
    );
  }
}
