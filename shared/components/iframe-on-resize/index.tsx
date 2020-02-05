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

interface Props {
  onResize: (width: number, height: number) => void;
}

interface State {}

export default class IframeOnResize extends Component<Props, State> {
  private _onResize = () => {
    const iframe = this.base as HTMLIFrameElement;
    const { width, height } = iframe.getBoundingClientRect();
    this.props.onResize(width, height);
  };

  componentDidMount() {
    const iframe = this.base as HTMLIFrameElement;
    iframe.contentWindow!.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    const iframe = this.base as HTMLIFrameElement;
    iframe.contentWindow!.removeEventListener('resize', this._onResize);
  }

  render() {
    return <iframe class="resize-iframe" />;
  }
}
