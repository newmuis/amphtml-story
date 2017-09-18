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
<<<<<<< HEAD
 * <amp-story related-articles="related.json">
 *   [...]
 * </amp-story>
 * </code>
 */
import {AmpStoryGridLayer} from './amp-story-grid-layer';
import {AmpStoryPage} from './amp-story-page';
import {AnalyticsTrigger} from './analytics';
import {Bookend} from './bookend';
import {CSS} from '../../../build/amp-story-0.1.css';
import {EventType} from './events';
import {KeyCodes} from '../../../src/utils/key-codes';
import {NavigationState} from './navigation-state';
import {SystemLayer} from './system-layer';
import {Layout} from '../../../src/layout';
import {VariableService} from './variable-service';
import {assertHttpsUrl} from '../../../src/url';
import {buildFromJson} from './related-articles';
import {closest} from '../../../src/dom';
import {dev, user} from '../../../src/log';
import {
  exitFullScreen,
  isFullScreenSupported,
  requestFullScreen,
} from './fullscreen';
import {once} from '../../../src/utils/function';
import {
  toggleExperiment,
} from '../../../src/experiments';
import {registerServiceBuilder} from '../../../src/service';
import {urlReplacementsForDoc} from '../../../src/services';
import {xhrFor} from '../../../src/services';
import {isFiniteNumber} from '../../../src/types';
import {AudioManager} from './audio';


/** @private @const {number} */
const NEXT_SCREEN_AREA_RATIO = 0.75;

/** @private @const {string} */
const ACTIVE_PAGE_ATTRIBUTE_NAME = 'active';

/** @private @const {string} */
const RELATED_ARTICLES_ATTRIBUTE_NAME = 'related-articles';

const TIME_REGEX = {
  MILLISECONDS: /^(\d+)ms$/,
  SECONDS: /^(\d+)s$/,
};

/** @private @const {number} */
const FULLSCREEN_THRESHOLD = 1024;


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

    /** @private {!NavigationState} */
    this.navigationState_ = new NavigationState();

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

    /** @const @private {!VariableService} */
    this.variableService_ = new VariableService();

    /** @const @private {!AudioManager} */
    this.audioManager_ = new AudioManager();

    /**
     * @private @const {
     *   !function():!Promise<?Array<!./related-articles.RelatedArticleSet>
     * }
     */
    this.loadRelatedArticles_ = once(() => this.loadRelatedArticlesImpl_());

    /** @private {?Element} */
    this.activePage_ = null;
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

    Array.prototype.forEach.call(this.getPages(), page => {
      this.setAsOwner(page);
    });

    this.activePage_ = user().assertElement(
        this.element.querySelector('amp-story-page'),
        'Story must have at least one page.');
    this.activePage_.setAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME, '');

    this.navigationState_.installConsumer(new AnalyticsTrigger(this.element));
    this.navigationState_.installConsumer(this.variableService_);

<<<<<<< HEAD
    this.navigationState_.updateActivePage(0, this.activePage_.id);

    registerServiceBuilder(this.win, 'story-variable',
        () => this.variableService_);
=======
    firstPage.setAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME, '');
    this.scheduleResume(firstPage);

    // Mark all videos as autoplay
    const videos = this.element.querySelectorAll('amp-video');
    for (const video of videos) {
      video.setAttribute('autoplay', '');
    }
>>>>>>> 16f77f01... Autoplay all videos in a story.
  }


  /** @override */
  layoutCallback() {
    this.scheduleLayout(this.activePage_);
    this.maybeScheduleAutoAdvance_();
    this.preloadNext_();
    return Promise.resolve();
  }


  /** @override */
  viewportCallback(inViewport) {
    this.updateInViewport(this.activePage_, inViewport);
  }


  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }


  /** @override */
  prerenderAllowed() {
    return true;
  }


  /**
   * Gets the ID of the next page in the story (after the current page).
   * @param {boolean=} opt_isAutomaticAdvance Whether this navigation was caused
   *     by an automatic advancement after a timeout.
   * @param {!Element} activePage The element representing the page that the
   *     user is currently on.
   * @return {?string} Returns the ID of the next page in the story, or null if
   *     the document order should be followed.
   * @private
   */
  getNextPageId_(activePage, opt_isAutomaticAdvance) {
    if (opt_isAutomaticAdvance && activePage.hasAttribute('auto-advance-to')) {
      return activePage.getAttribute('auto-advance-to');
    }

    return activePage.getAttribute('advance-to');
  }


  /**
   * Gets the next page that the user should be advanced to, upon navigation.
   * @param {boolean=} opt_isAutomaticAdvance Whether this navigation was caused
   *     by an automatic advancement after a timeout.
   * @return {?Element} The element representing the page that the user should
   *     be advanced to.
   * @private
   */
  getNextPage_(opt_isAutomaticAdvance) {
    const activePage = this.activePage_;
    const nextPageId = this.getNextPageId_(activePage, opt_isAutomaticAdvance);

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
   * @param {boolean=} opt_isAutomaticAdvance Whether this navigation was caused
   *     by an automatic advancement after a timeout.
   * @private
   */
  next_(opt_isAutomaticAdvance) {
    const activePage = this.activePage_;
    const nextPage = this.getNextPage_(opt_isAutomaticAdvance);
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

    const activePage = this.activePage_;
    const pageIndex = this.getPageIndex(page);

    if (this.shouldEnterFullScreenOnSwitch_()) {
      this.enterFullScreen_();
    }

    // first page is not counted as part of the progress
    // TODO(alanorozco): decouple this using NavigationState
    this.systemLayer_.updateProgressBar(pageIndex, this.getPageCount() - 1);

    // TODO(alanorozco): check if autoplay
    this.navigationState_.updateActivePage(pageIndex, page.id);

    this.audioManager_.stop(activePage);
    this.audioManager_.play(page);

    return this.mutateElement(() => {
      page.setAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME, '');
      activePage.removeAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME);
      this.activePage_ = page;
    }, page).then(() => {
      this.schedulePause(activePage);
      this.updateInViewport(activePage, false);
      this.scheduleResume(page);
      this.updateInViewport(page, true);
    }).then(() => this.maybeScheduleAutoAdvance_());
  }


  /**
   * If the auto-advance-delay property is set, a timer is set for that
   * duration, after which next_() will be invoked.
   * @private
   */
  maybeScheduleAutoAdvance_() {
    const activePage = this.activePage_;
    const autoAdvanceDelay = activePage.getAttribute('auto-advance-delay');

    if (!autoAdvanceDelay) {
      return;
    }

    let delayMs;
    if (TIME_REGEX.MILLISECONDS.test(autoAdvanceDelay)) {
      delayMs = Number(TIME_REGEX.MILLISECONDS.exec(autoAdvanceDelay)[1]);
    } else if (TIME_REGEX.SECONDS.test(autoAdvanceDelay)) {
      delayMs = Number(TIME_REGEX.SECONDS.exec(autoAdvanceDelay)[1]) * 1000;
    }

    user().assert(isFiniteNumber(delayMs) && delayMs > 0,
        `Invalid automatic advance delay '${autoAdvanceDelay}' ` +
        `for page '${activePage.id}'.`);

    this.win.setTimeout(
        () => this.next_(true /* opt_isAutomaticAdvance */), delayMs);
  }


  /**
   * @return {boolean}
   * @private
   */
  shouldEnterFullScreenOnSwitch_() {
    const {width, height} = this.getViewport().getSize();

    const inFullScreenThreshold =
        width <= FULLSCREEN_THRESHOLD && height <= FULLSCREEN_THRESHOLD;

    return inFullScreenThreshold && isFullScreenSupported(this.element)
        && this.isAutoFullScreenEnabled_;
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
    const nextScreenAreaMin = this.element.offsetLeft +
        ((1 - NEXT_SCREEN_AREA_RATIO) * this.element.offsetWidth);
    const nextScreenAreaMax = this.element.offsetLeft +
        this.element.offsetWidth;

    if (event.pageX >= nextScreenAreaMin && event.pageX < nextScreenAreaMax) {
      this.next_();
    } else if (event.pageX >= this.element.offsetLeft &&
        event.pageX < nextScreenAreaMin) {
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
      this.scheduleLayout(next);
    }
  }


  /** @private */
  buildBookend_() {
    if (this.bookend_.isBuilt()) {
      return;
    }

    this.element.appendChild(this.bookend_.build());

    this.loadRelatedArticles_().then(articleSets => {
      if (articleSets === null) {
        return;
      }
      this.bookend_.setRelatedArticles(dev().assert(articleSets));
    });
  }


  /**
   * @return {!Promise<?Array<!./related-articles.RelatedArticleSet>>}
   * @private
   */
  loadRelatedArticlesImpl_() {
    const rawUrl = this.getRelatedArticlesUrlOptional_();

    if (rawUrl === null) {
      return Promise.resolve(null);
    }

    return urlReplacementsForDoc(this.getAmpDoc())
        .expandAsync(user().assertString(rawUrl))
        .then(url => xhrFor(this.win).fetchJson(url))
        .then(response => {
          user().assert(response.ok, 'Invalid HTTP response');
          return response.json();
        })
        .then(buildFromJson);
  }


  /**
   * @return {?string}
   * @private
   */
  getRelatedArticlesUrlOptional_() {
    if (!this.element.hasAttribute(RELATED_ARTICLES_ATTRIBUTE_NAME)) {
      return null;
    }
    return this.element.getAttribute(RELATED_ARTICLES_ATTRIBUTE_NAME);
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
=======
 * <amp-story
 *   layout="fill"
 *   logo="my-logo.png">
 * </amp-story>
 * </code>
 */

import {CSS} from '../../../build/amp-story-0.1.css';
import {Layout} from '../../../src/layout';

export class AmpStory extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.FILL;
>>>>>>> 95dcfda4... Add a base amp-story extension.
  }
}

AMP.registerElement('amp-story', AmpStory, CSS);
