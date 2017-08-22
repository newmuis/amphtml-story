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
import {AnalyticsTrigger} from './analytics';
import {Bookend} from './bookend';
import {CSS} from '../../../build/amp-story-0.1.css';
import {EventType} from './events';
import {KeyCodes} from '../../../src/utils/key-codes';
import {NavigationState} from './navigation-state';
import {SystemLayer} from './system-layer';
import {Layout} from '../../../src/layout';
import {VariableService} from './variable-service';
import {Services} from '../../../src/services';
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
import {isFiniteNumber} from '../../../src/types';
import {AudioManager, upgradeBackgroundAudio} from './audio';
import {setStyles} from '../../../src/style';


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
    this.audioManager_ = new AudioManager(this.win, this.element);

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

    this.element.addEventListener(EventType.MUTE, () => {
      this.mute_();
    });

    this.element.addEventListener(EventType.UNMUTE, () => {
      this.unmute_();
    });

    this.element.addEventListener('play', e => {
      this.audioManager_.play(e.target);
    }, true);

    this.element.addEventListener('pause', e => {
      this.audioManager_.stop(e.target);
    }, true);

    this.win.document.addEventListener('keydown', e => {
      this.onKeyDown_(e);
    }, true);

    this.navigationState_.installConsumer(new AnalyticsTrigger(this.element));
    this.navigationState_.installConsumer(this.variableService_);

    upgradeBackgroundAudio(this.element);

    registerServiceBuilder(this.win, 'story-variable',
        () => this.variableService_);
  }


  /** @override */
  layoutCallback() {
    const firstPage = user().assertElement(
        this.element.querySelector('amp-story-page'),
        'Story must have at least one page.');

    return this.switchTo_(firstPage)
        .then(() => this.preloadPagesByDistance_())
        .then(() => {
          Array.prototype.forEach.call(this.getPages(), page => {
            this.schedulePause(page);
          });
          this.scheduleResume(this.activePage_);
        });
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
   * @param {!Element} page The element representing the page whose next page
   *     should be retrieved.
   * @param {boolean=} opt_isAutomaticAdvance Whether this navigation was caused
   *     by an automatic advancement after a timeout.
   * @return {?string} Returns the ID of the next page in the story, or null if
   *     the document order should be followed.
   * @private
   */
  getNextPageId_(page, opt_isAutomaticAdvance) {
    if (opt_isAutomaticAdvance && page.hasAttribute('auto-advance-to')) {
      return page.getAttribute('auto-advance-to');
    }

    return page.getAttribute('advance-to');
  }


  /**
   * Gets the page before the specified page.
   * @param {!Element} page The element representing the page whose previous
   *     page should be retrieved.
   * @return {?Element} The element representing the page preceding the
   *     specified page.
   */
  getPreviousPage_(page) {
    if (page === this.activePage_) {
      return this.pageHistoryStack_[this.pageHistoryStack_.length - 1];
    }

    const index = this.pageHistoryStack_.lastIndexOf(page);
    if (index <= 0) {
      return page.previousElementSibling;
    }

    return this.pageHistoryStack_[index - 1];
  }


  /**
   * Gets the next page that the user should be advanced to, upon navigation.
   * @param {!Element} page The element representing the page whose next page
   *     should be retrieved.
   * @param {boolean=} opt_isAutomaticAdvance Whether this navigation was caused
   *     by an automatic advancement after a timeout.
   * @return {?Element} The element representing the page following the
   *     specified page.
   * @private
   */
  getNextPage_(page, opt_isAutomaticAdvance) {
    const nextPageId = this.getNextPageId_(page, opt_isAutomaticAdvance);

    if (nextPageId) {
      return this.getPageById_(nextPageId);
    }

    if (page.nextElementSibling === this.systemLayer_.getRoot() ||
        this.isBookend_(page.nextElementSibling)) {
      return null;
    }

    return page.nextElementSibling;
  }


  /**
   * Returns all of the pages that are one hop from the specified page.
   * @param {!Element} page The page whose next pages should be retrieved.
   * @return {!Array<string>}
   * @private
   */
  getAdjacentPageIds_(page) {
    const adjacentPageIds = [];

    const autoAdvanceNext =
        this.getNextPage_(page, true /* opt_isAutomaticAdvance */);
    const manualAdvanceNext =
        this.getNextPage_(page, false /* opt_isAutomaticAdvance */);
    const previous = this.getPreviousPage_(page);

    if (autoAdvanceNext) {
      adjacentPageIds.push(autoAdvanceNext.id);
    }

    if (manualAdvanceNext && manualAdvanceNext != autoAdvanceNext) {
      adjacentPageIds.push(manualAdvanceNext.id);
    }

    if (previous) {
      adjacentPageIds.push(previous.id);
    }

    return adjacentPageIds;
  }


  /**
   * Advance to the next screen in the story, if there is one.
   * @param {boolean=} opt_isAutomaticAdvance Whether this navigation was caused
   *     by an automatic advancement after a timeout.
   * @private
   */
  next_(opt_isAutomaticAdvance) {
    const activePage = dev().assert(this.activePage_,
        'No active page set when navigating to next page.');
    const nextPage = this.getNextPage_(activePage, opt_isAutomaticAdvance);
    if (!nextPage) {
      this.showBookend_();
      return;
    }

    if (nextPage === this.bookend_) {
      this.showBookend_();
      return;
    }

    this.switchTo_(dev().assertElement(nextPage))
        .then(() => this.pageHistoryStack_.push(activePage))
        .then(() => this.preloadPagesByDistance_());
  }


  /**
   * Go back to the previous screen in the story, if there is one.
   * @private
   */
  previous_() {
    const activePage = dev().assert(this.activePage_,
        'No active page set when navigating to previous page.');
    const previousPage = this.getPreviousPage_(activePage);
    if (!previousPage) {
      return;
    }

    const index = this.pageHistoryStack_.lastIndexOf(previousPage);
    this.pageHistoryStack_.splice(index, 1);
    this.switchTo_(dev().assertElement(previousPage))
        .then(() => this.preloadPagesByDistance_());
  }


  /**
   * Switches to a particular page.
   * @param {!Element} targetPage
   * @return {!Promise}
   */
  // TODO: Update history state
  switchTo_(targetPage) {
    if (this.isBookendActive_) {
      // Disallow switching pages while the bookend is active.
      return;
    }

    const pageIndex = this.getPageIndex(targetPage);

    if (this.shouldEnterFullScreenOnSwitch_()) {
      this.enterFullScreen_();
    }

    // first page is not counted as part of the progress
    // TODO(alanorozco): decouple this using NavigationState
    this.systemLayer_.updateProgressBar(pageIndex, this.getPageCount() - 1);

    // TODO(alanorozco): check if autoplay
    this.navigationState_.updateActivePage(pageIndex, targetPage.id);

    const oldPage = this.activePage_;

    return this.mutateElement(() => {
      targetPage.setAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME, '');
      if (oldPage) {
        oldPage.removeAttribute(ACTIVE_PAGE_ATTRIBUTE_NAME);
      }
      this.activePage_ = targetPage;
      this.triggerActiveEventForPage_();
    }, targetPage).then(() => {
      if (oldPage) {
        this.schedulePause(oldPage);
      }
      this.scheduleResume(targetPage);
    }).then(() => this.maybeScheduleAutoAdvance_());
  }


  /** @private */
  triggerActiveEventForPage_() {
    // TODO(alanorozco): pass event priority once STAMP repo is merged with
    // upstream.
    Services.actionServiceForDoc(this.element)
        .trigger(this.activePage_, 'active', /* event */ null);
  }


  /**
   * If the auto-advance-after property is set, a timer is set for that
   * duration, after which next_() will be invoked.
   * @private
   */
  maybeScheduleAutoAdvance_() {
    const activePage = dev().assert(this.activePage_,
        'No active page set when scheduling auto-advance.');
    const autoAdvanceAfter = activePage.getAttribute('auto-advance-after');

    if (!autoAdvanceAfter) {
      return;
    }

    let delayMs;
    if (TIME_REGEX.MILLISECONDS.test(autoAdvanceAfter)) {
      delayMs = Number(TIME_REGEX.MILLISECONDS.exec(autoAdvanceAfter)[1]);
    } else if (TIME_REGEX.SECONDS.test(autoAdvanceAfter)) {
      delayMs = Number(TIME_REGEX.SECONDS.exec(autoAdvanceAfter)[1]) * 1000;
    }

    user().assert(isFiniteNumber(delayMs) && delayMs > 0,
        `Invalid automatic advance delay '${autoAdvanceAfter}' ` +
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

    this.vsync_.mutate(() => {
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

    this.vsync_.mutate(() => {
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
   * @return {!Array<!Array<string>>} A 2D array representing lists of pages by
   *     distance.  The outer array index represents the distance from the
   *     active page; the inner array is a list of page IDs at the specified
   *     distance.
   */
  getPagesByDistance_() {
    const distanceMap = this.getPageDistanceMapHelper_(
        /* distance */ 0, /* map */ {}, this.activePage_.id);

    // Transpose the map into a 2D array.
    const pagesByDistance = [];
    Object.keys(distanceMap).forEach(pageId => {
      const distance = distanceMap[pageId];
      if (!pagesByDistance[distance]) {
        pagesByDistance[distance] = [];
      }
      pagesByDistance[distance].push(pageId);
    });

    return pagesByDistance;
  }

  /**
   * Creates a map of a page and all of the pages reachable from that page, by
   * distance.
   *
   * @param {number} distance The distance that the page with the specified
   *     pageId is from the active page.
   * @param {!Object<string, number>} map A mapping from pageId to its distance
   *     from the active page.
   * @param {string} pageId The page to be added to the map.
   * @return {!Object<string, number>} A mapping from page ID to the priority of
   *     that page.
   */
  getPageDistanceMapHelper_(priority, map, pageId) {
    if (map[pageId] !== undefined && map[pageId] <= priority) {
      return map;
    }

    map[pageId] = priority;
    const page = this.getPageById_(pageId);
    this.getAdjacentPageIds_(page).forEach(adjacentPageId => {
      if (map[adjacentPageId] !== undefined
          && map[adjacentPageId] <= priority) {
        return;
      }

      map = this.getPageDistanceMapHelper_(priority + 1, map, adjacentPageId);
    });

    return map;
  }


  /** @private */
  preloadPagesByDistance_() {
    const pagesByDistance = this.getPagesByDistance_();

    this.mutateElement(() => {
      pagesByDistance.forEach((pageIds, distance) => {
        pageIds.forEach(pageId => {
          const page = this.getPageById_(pageId);
          setStyles(page, {
            transform: `translateY(${100 * distance}%)`,
          });
        });
      });

      const next = this.getNextPage_(this.activePage_);
      if (!next) {
        this.buildBookend_();
      }
    });
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

    return Services.urlReplacementsForDoc(this.getAmpDoc())
        .expandAsync(user().assertString(rawUrl))
        .then(url => Services.xhrFor(this.win).fetchJson(url))
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
   * @param {string} id The ID of the page to be retrieved.
   * @return {!Element} Retrieves the page with the specified ID.
   */
  getPageById_(id) {
    return user().assert(
        this.element.querySelector(`amp-story-page#${id}`),
        `Story refers to page "${id}", but no such page exists.`);
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

  /**
   * Mutes the audio for the story.
   * @private
   */
  mute_() {
    this.audioManager_.muteAll();
    this.element.classList.remove('unmuted');
  }

  /**
   * Unmutes the audio for the story.
   * @private
   */
  unmute_() {
    this.audioManager_.unmuteAll();
    this.element.classList.add('unmuted');
  }
}

AMP.registerElement('amp-story', AmpStory, CSS);
