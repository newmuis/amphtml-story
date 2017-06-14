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
import {EventType} from './events';
import {KeyCodes} from '../../../src/utils/key-codes';
import {SystemLayer} from './system-layer';
import {Layout} from '../../../src/layout';
import {closest} from '../../../src/dom';
import {dev} from '../../../src/log';
import {
  exitFullScreen,
  isFullScreenSupported,
  requestFullScreen,
} from './fullscreen';


/** @private @const {number} */
const NEXT_SCREEN_AREA_RATIO = 0.75;

/** @private @const {string} */
const ACTIVE_PAGE_ATTRIBUTE_NAME = 'active';

export class AmpStory extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /**
     * Whether entering into fullscreen automatically on navigation is enabled.
     * @private {boolean}
     */
    this.isAutoFullScreenEnabled_ = true;

    /** @const @private {!../../../src/service/vsync-impl.Vsync} */
    this.vsync_ = this.getVsync();

    /** @private {?Element} */
    this.bookend_ = null;

    /** @private {!SystemLayer} */
    this.systemLayer_ = new SystemLayer(this.win);
  }

  /** @override */
  buildCallback() {
    this.bookend_ = this.win.document.createElement('section');
    this.bookend_.classList.add('i-amp-story-bookend');
    this.bookend_.textContent = 'bookend goes here';
    this.element.appendChild(this.bookend_);
    this.element.appendChild(this.systemLayer_.build());

    this.element.addEventListener('click',
        this.maybePerformSystemNavigation_.bind(this), true);

    this.element.addEventListener(EventType.EXIT_FULLSCREEN, () => {
      this.exitFullScreen_(/* opt_explicitUserAction */ true);
    });
    this.win.document.addEventListener('keydown', e => {
      this.onKeyDown_(e);
    }, true);
  }


  /** @override */
  layoutCallback() {
    this.preloadNext_();
    return Promise.resolve();
  }


  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }


  /**
   * Gets the amp-story-page that is currently being shown.
   * @return {!Element} The element representing the page currently being shown.
   * @private
   */
  getActivePage_() {
    const activePage = this.element.querySelector('amp-story-page[active]');
    return dev().assert(activePage, 'There is no active page.');
  }


  /**
   * Advance to the next screen in the story, if there is one.
   * @private
   */
  next_() {
    const activePage = this.getActivePage_();
    if (!activePage.nextElementSibling ||
        activePage.nextElementSibling == this.bookend_) {
      return;
    }

    this.switchTo_(dev().assertElement(activePage.nextElementSibling))
        .then(() => this.preloadNext_());
  }


  /**
   * Go back to the previous screen in the story, if there is one.
   * @private
   */
  previous_() {
    const activePage = this.getActivePage_();
    if (!activePage.previousElementSibling) {
      return;
    }

    this.switchTo_(dev().assertElement(activePage.previousElementSibling));
  }


  /**
   * Switches to a particular page.
   * @param {!Element} page
   * @return {!Promise}
   */
  // TODO: Update history state
  switchTo_(page) {
    const activePage = this.getActivePage_();

    if (isFullScreenSupported(this.element)) {
      if (page === this.bookend_) {
        this.exitFullScreen_();
      } else if (this.isAutoFullScreenEnabled_) {
        this.enterFullScreen_();
      }
    }

    // first page is not counted as part of the progress
    this.systemLayer_.updateProgressBar(
        this.getPageIndex(page), this.getPageCount() - 1);

    return this.mutateElement(() => {
      page.setAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME, '');
      activePage.removeAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME);
    }, page).then(() => {
      this.schedulePause(activePage);
      this.scheduleResume(page);
    });
  }


  /**
   * Handles all key presses within the story.
   * @param {!Event} e The keydown event.
   * @private
   */
  onKeyDown_(e) {
    switch(e.keyCode) {
      // TODO(newmuis): This will need to be flipped for RTL.
      case KeyCodes.LEFT_ARROW:
        this.previous_();
        break;
      case KeyCodes.RIGHT_ARROW:
        this.next_();
        break;
    }
  }


  /**
   * @param {boolean} isEnabled
   */
  setAutoFullScreen(isEnabled) {
    this.isAutoFullScreenEnabled_ = isEnabled;
  }


  /** @private */
  enterFullScreen_() {
    this.systemLayer_.setInFullScreen(true);
    requestFullScreen(this.element);
  }


  /**
   * @param {boolean} opt_explicitUserAction
   * @private
   */
  exitFullScreen_(opt_explicitUserAction) {
    if (opt_explicitUserAction) {
      this.setAutoFullScreen(false);
    }

    this.systemLayer_.setInFullScreen(false);
    exitFullScreen(this.element);
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
        (1 - NEXT_SCREEN_AREA_RATIO) * this.getViewport().getWidth();

    if (event.pageX >= nextScreenAreaThreshold) {
      this.next_();
    } else {
      this.previous_();
    }

    event.stopPropagation();
  }

  /**
   * @private
   */
  preloadNext_() {
    const next = this.getActivePage_().nextElementSibling;
    if (!next) {
      return;
    }
    this.schedulePreload(next);
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
    return !closest(e.target, el => {
      // TODO(newmuis): Check to see if currentElement listens for `tap` event.
      return el === this.systemLayer_.getRoot() || el === this.bookend_;
    }, /* opt_stopAt */ this.element);
  }


  /**
   * @return {!NodeList}
   */
  getPages() {
    return this.element.querySelectorAll('amp-story-page');
  }


  /**
   * @return {number}
   */
  getPageCount() {
    return this.getPages().length;
  }

  /**
   * @param {!Element} page
   * @return {number} The index of the page.
   */
  getPageIndex(page) {
    return Array.prototype.indexOf.call(this.getPages(), page);
  }
}

AMP.registerElement('amp-story', AmpStory, CSS);
