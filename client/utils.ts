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
interface AnimateOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  fill?: 'backwards' | 'none';
}

interface AnimateKeyframe {
  [prop: string]: string;
}

interface AnimateKeyframes {
  [pos: string]: AnimateKeyframe;
}

export function animate(
  el: HTMLElement,
  keyframes: AnimateKeyframes | AnimateKeyframe[],
  {
    duration = 1000,
    delay = 0,
    easing = 'linear',
    fill = 'none',
  }: AnimateOptions = {},
): Promise<void> {
  const animName =
    'a' + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  let computedKeyframes: AnimateKeyframes;

  if (!Array.isArray(keyframes)) {
    computedKeyframes = keyframes;
  } else {
    computedKeyframes = Object.fromEntries(
      keyframes.map((keyframe, i) => [
        (i / keyframes.length) * 100 + '%',
        keyframe,
      ]),
    );
  }

  const style = document.createElement('style');
  style.textContent =
    `@keyframes ${animName} {` +
    Object.entries(computedKeyframes)
      .map(
        ([pos, keyframe]) =>
          pos +
          '{' +
          Object.entries(keyframe)
            .map(([prop, val]) => `${prop}: ${val};`)
            .join('') +
          '}',
      )
      .join('') +
    '}';

  document.head.append(style);
  el.style.animation = `${duration}ms ${easing} ${delay}ms ${fill} ${animName}`;

  return new Promise(resolve => {
    function completeListener(event: AnimationEvent) {
      if (event.target !== el) return;
      resolve();
      el.removeEventListener('animationend', completeListener);
      el.removeEventListener('animationcancel', completeListener);
      style.remove();
    }
    el.addEventListener('animationend', completeListener);
    el.addEventListener('animationcancel', completeListener);
  });
}
