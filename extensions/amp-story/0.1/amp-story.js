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
import {Bookend} from './bookend';
import {CSS} from '../../../build/amp-story-0.1.css';
import {EventType} from './events';
import {KeyCodes} from '../../../src/utils/key-codes';
import {SystemLayer} from './system-layer';
import {Layout} from '../../../src/layout';
import {closest} from '../../../src/dom';
import {dev, user} from '../../../src/log';
import {
  exitFullScreen,
  isFullScreenSupported,
  requestFullScreen,
} from './fullscreen';


/** @private @const {number} */
const NEXT_SCREEN_AREA_RATIO = 0.75;

/** @private @const {string} */
const ACTIVE_PAGE_ATTRIBUTE_NAME = 'active';


/**
 * @param {!Element} el
 * @return {boolean}
 */
function hasTapAction(el) {
  // There are better ways to determine this, but they're all bound to action
  // service race conditions. This is good enough for our use case.
  return el.hasAttribute('on') &&
      el.getAttribute('on').match(/(^|;)\s*tap\s*:/);
}


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

    /** @private {!Bookend} */
    this.bookend_ = new Bookend(this.win);

    /** @private {!SystemLayer} */
    this.systemLayer_ = new SystemLayer(this.win);

    /** @private {boolean} */
    this.isBookendActive_ = false;

    /** @private {!Array<!Element>} */
    this.pageHistoryStack_ = [];
  }

  /** @override */
  buildCallback() {
    this.element.appendChild(this.systemLayer_.build());

    this.element.addEventListener('click',
        this.maybePerformSystemNavigation_.bind(this), true);

    this.element.addEventListener(EventType.EXIT_FULLSCREEN, () => {
      this.exitFullScreen_(/* opt_explicitUserAction */ true);
    });

    this.element.addEventListener(EventType.CLOSE_BOOKEND, () => {
      this.hideBookend_();
    });

    this.win.document.addEventListener('keydown', e => {
      this.onKeyDown_(e);
    }, true);

    const firstPage = user().assertElement(
        this.element.querySelector('amp-story-page'),
        'Story must have at least one page.');

    firstPage.setAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME, '');
    this.scheduleResume(firstPage);

    // Mark all videos as autoplay
    const videos = this.element.querySelectorAll('amp-video');
    for (const video of videos) {
      video.setAttribute('autoplay', '');
    }
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
   * Gets the next page that the user should be advanced to, upon navigation.
   * @return {?Element} The element representing the page that the user should
   *     be advanced to.
   * @private
   */
  getNextPage_() {
    const activePage = this.getActivePage_();
    const nextPageId = activePage.getAttribute('advance-to');

    if (nextPageId) {
      return user().assert(
          this.element.querySelector(`amp-story-page#${nextPageId}`),
          `Page "${activePage.id}" refers to page "${nextPageId}", but ` +
          'no such page exists.');
    }

    if (activePage.nextElementSibling === this.systemLayer_.getRoot() ||
        this.isBookend_(activePage.nextElementSibling)) {
      return null;
    }

    return activePage.nextElementSibling;
  }


  /**
   * Advance to the next screen in the story, if there is one.
   * @private
   */
  next_() {
    const activePage = this.getActivePage_();
    const nextPage = this.getNextPage_();
    if (!nextPage) {
      this.showBookend_();
      return;
    }

    this.switchTo_(dev().assertElement(nextPage))
        .then(() => this.pageHistoryStack_.push(activePage))
        .then(() => this.preloadNext_());
  }


  /**
   * Go back to the previous screen in the story, if there is one.
   * @private
   */
  previous_() {
    const previousPage = this.pageHistoryStack_.pop();
    if (!previousPage) {
      return;
    }

    this.switchTo_(dev().assertElement(previousPage));
  }


  /**
   * Switches to a particular page.
   * @param {!Element} page
   * @return {!Promise}
   */
  // TODO: Update history state
  switchTo_(page) {
    if (this.isBookendActive_) {
      // Disallow switching pages while the bookend is active.
      return;
    }

    const activePage = this.getActivePage_();

    if (isFullScreenSupported(this.element) && this.isAutoFullScreenEnabled_) {
      this.enterFullScreen_();
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
   * Shows the bookend overlay.
   * @private
   */
  showBookend_() {
    if (this.isBookendActive_) {
      return;
    }

    dev().assert(this.bookend_.isBuilt());

    this.exitFullScreen_();
    this.systemLayer_.toggleCloseBookendButton(true);
    this.isBookendActive_ = true;

    this.getVsync().mutate(() => {
      this.element.classList.add('i-amp-story-bookend-active');
      this.bookend_.getRoot()./*OK*/scrollTop = 0;
    });
  }


  /**
   * Hides the bookend overlay.
   * @private
   */
  hideBookend_() {
    this.systemLayer_.toggleCloseBookendButton(false);
    this.isBookendActive_ = false;

    this.getVsync().mutate(() => {
      this.element.classList.remove('i-amp-story-bookend-active');
    });
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
    const next = this.getNextPage_();
    if (!next) {
      this.buildBookend_();
    } else {
      this.schedulePreload(next);
    }
  }


  /** @private */
  buildBookend_() {
    if (this.bookend_.isBuilt()) {
      return;
    }
    this.element.appendChild(this.bookend_.build());
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
      return el === this.systemLayer_.getRoot() ||
          this.isBookend_(el) ||
          hasTapAction(el);
    }, /* opt_stopAt */ this.element);
  }


  /**
   * @param {!Element} el
   * @return {boolean}
   */
  isBookend_(el) {
    return this.bookend_.isBuilt() && el === this.bookend_.getRoot();
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
