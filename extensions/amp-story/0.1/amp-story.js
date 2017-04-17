/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

/**
 * @fileoverview Embeds a story
 *
 * Example:
 * <code>
 * <amp-story
 *   layout="fill"
 *   logo="my-logo.png">
 * </amp-story>
 * </code>
 */

import {AmpStoryBackgroundLayer} from './amp-story-background-layer';
import {AmpStoryBookend} from './amp-story-bookend';
import {AmpStoryCover} from './amp-story-cover';
import {AmpStoryForegroundLayer} from './amp-story-foreground-layer';
import {AmpStoryPage} from './amp-story-page';
import {CSS} from '../../../build/amp-story-0.1.css';
import {Layout} from '../../../src/layout';
import {extensionsFor} from '../../../src/services';

export class AmpStory extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {!Element} */
    this.carousel_ = this.win.document.createElement('amp-carousel');
    this.carousel_.setAttribute('type', 'slides');
    this.carousel_.setAttribute('layout', 'fill');
  }

  /** @override */
  buildCallback() {
    extensionsFor(this.win).loadExtension('amp-carousel');
    this.getRealChildren().forEach((child) => {
      this.carousel_.appendChild(child);
    });
    this.element.appendChild(this.carousel_);
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.FILL;
  }
}

AMP.registerElement('amp-story', AmpStory, CSS);
