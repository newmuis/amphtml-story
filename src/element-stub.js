/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BaseElement} from './base-element';
import {dev} from './log';
import {Services} from './services';

/** @type {!Array} */
export const stubbedElements = [];


export class ElementStub extends BaseElement {
  constructor(element) {
    super(element);
    // Fetch amp-ad script if it is not present.
    const name = element.tagName.toLowerCase();
    if (!loadingChecked[name]) {
      loadingChecked[name] = true;
      Services.extensionsFor(this.win).loadExtension(
          name, /* stubElement */ false);
    }
    stubbedElements.push(this);
  }

  /** @override */
  getPriority() {
    return dev().assert(0, 'Cannot get priority of stubbed element');
  }

  /** @override */
  isLayoutSupported(unusedLayout) {
    // Always returns true and will eventually call this method on the actual
    // element.
    return true;
  }

  /** @override */
  reconstructWhenReparented() {
    // No real state so no reason to reconstruct.
    return false;
  }
}
