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

interface Props {}

const WhatIsThis: FunctionalComponent<Props> = () => (
  <div class="content-box">
    <h2 class="content-box-title">What is this?</h2>
    <div class="content-padding">
      <p>
        The first player picks a topic. That topic is given to the second player
        who has to draw it. That drawing is given to the third player who has to
        figure out the topic. That guess is given to the fourth player who has
        to draw it. You get the idea.
      </p>
      <p>
        The idea to is to end up with the same topic you started with, but you
        probably won't.
      </p>
    </div>
  </div>
);

export default WhatIsThis;
