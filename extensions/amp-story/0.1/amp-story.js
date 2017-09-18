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
 * <amp-story related-articles="related.json">
 *   [...]
 * </amp-story>
 * </code>
 */
import {AmpStoryGridLayer} from './amp-story-grid-layer';
import {AmpStoryPage} from './amp-story-page';
import {CSS} from '../../../build/amp-story-0.1.css';
import {Layout} from '../../../src/layout';

/** @private @const {number} */
const NEXT_SCREEN_AREA_RATIO = 0.75;

export class AmpStory extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);
  }

  /** @override */
  buildCallback() {
    this.systemLayer_ = this.win.document.createElement('aside');
    this.systemLayer_.classList.add('i-amp-story-system-layer');
    this.element.appendChild(this.systemLayer_);

    this.bookend_ = this.win.document.createElement('section');
    this.bookend_.classList.add('i-amp-story-bookend');
    this.bookend_.textContent = 'bookend goes here';
    this.element.appendChild(this.bookend_);

    this.element.addEventListener('click',
        this.maybePerformSystemNavigation_.bind(this), true);
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }


  /**
   * Advance to the next screen in the story, if there is one.
   * @private
   */
  next_() {
    // TODO(newmuis): Navigate to the next page.
    console.log('next page');
  }


  /**
   * Go back to the previous screen in the story, if there is one.
   * @private
   */
  previous_() {
    // TODO(newmuis): Navigate to the previous page.
    console.log('previous page');
  }


  /**
   * Performs a system navigation if it is determined that the specified event
   * was a click intended for navigation.
   * @param {!Event} event 'click' event
   * @private
   */
  maybePerformSystemNavigation_(event) {
    if (!this.isNavigationalClick_(event)) {
      // If the system doesn't need to handle this click, then we can simply
      // return and let the event propagate as it would have otherwise.
      return;
    }

    // TODO(newmuis): This will need to be flipped for RTL.
    const nextScreenAreaThreshold =
        (1 - NEXT_SCREEN_AREA_RATIO) * window.screen.width;

    if (event.pageX >= nextScreenAreaThreshold) {
      this.next_();
    } else {
      this.previous_();
    }

    event.stopPropagation();
  }


  /**
   * Determines whether a click should be used for navigation.  Navigate should
   * occur unless the click is on the system layer, or on an element that
   * defines on="tap:..."
   * @param {!Event} e 'click' event.
   * @return {boolean} true, if the click should be used for navigation.
   * @private
   */
  isNavigationalClick_(e) {
    let currentElement = e.target || e.srcElement;

    while (currentElement) {
      if (currentElement === this.systemLayer_) {
        return false;
      } else if (currentElement === this.bookend_) {
        return false;
      }

      // TODO(newmuis): Check to see if currentElement listens for `tap` event.

      currentElement = currentElement.parentElement;
    }

    return true;
  }
}

AMP.registerElement('amp-story', AmpStory, CSS);
