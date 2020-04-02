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
export class SimpleChange<ValueType> {
  private _value: ValueType;
  private _listeners = new Set<(newValue: ValueType) => void>();

  constructor(startValue: ValueType) {
    this._value = startValue;
  }

  get value() {
    return this._value;
  }

  change(newValue: ValueType) {
    if (this._value === newValue) return;
    this._value = newValue;

    // Copy the listeners, as we don't want to include listeners added during change dispatch.
    for (const listener of [...this._listeners]) {
      // If the listener has been removed during dispatch, skip.
      if (this._listeners.has(listener)) listener(newValue);
    }
  }

  listen(listener: (newValue: ValueType) => void) {
    this._listeners.add(listener);
  }

  unlisten(listener: (newValue: ValueType) => void) {
    this._listeners.delete(listener);
  }
}
