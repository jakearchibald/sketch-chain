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
import { h, Component, JSX } from 'preact';

interface Props {
  buttons: JSX.Element[];
  title: string;
  content: JSX.Element;
}

interface State {}

export default class Modal extends Component<Props, State> {
  render({ buttons, content, title }: Props) {
    return (
      <div class="modal">
        <div class="content-box content-sized">
          <h2 class="content-box-title">{title}</h2>
          <div class="content-padding">{content}</div>
          <div class="content-controls">{buttons}</div>
        </div>
      </div>
    );
  }
}
