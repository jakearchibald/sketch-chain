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

import {
  getIsEnabled,
  listen,
  unlisten,
  setEnabled,
} from 'shared/utils/notificaiton-state';
import onSvg from 'asset-url:./on.svg';
import offSvg from 'asset-url:./off.svg';
import isServer from 'consts:isServer';

interface Props {}

interface State {
  enabled: boolean;
}

export default class NotificationToggle extends Component<Props, State> {
  state: State = {
    enabled: getIsEnabled(),
  };

  private _onEnabledChange = (enabled: boolean) => {
    this.setState({ enabled });
  };

  private _onClick = async () => {
    if (this.state.enabled) {
      setEnabled(false);
      return;
    }

    // We may need to ask for permission
    const answer = await Notification.requestPermission();
    if (answer !== 'granted') return;
    setEnabled(true);
  };

  componentDidMount() {
    listen(this._onEnabledChange);
  }

  componentWillUnmount() {
    unlisten(this._onEnabledChange);
  }

  render(_: Props, { enabled }: State) {
    return (
      <button
        style={{ visibility: isServer ? 'hidden' : '' }}
        class={`button hero-button button-with-icon ${
          enabled ? 'button-bad' : ''
        }`}
        onClick={this._onClick}
      >
        <div class="icon-text">
          <img class="icon" src={enabled ? offSvg : onSvg} />
          {enabled ? 'Disable' : 'Enable'} notifications
        </div>
      </button>
    );
  }
}
