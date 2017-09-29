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
import {AmpStoryBackground} from './amp-story-background';
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
import {buildFromJson} from './related-articles';
import {
  closest,
  scopedQuerySelector,
  createElementWithAttributes,
  fullscreenEnter,
  fullscreenExit,
  isFullscreenElement,
} from '../../../src/dom';
import {debounce} from '../../../src/utils/rate-limit';
import {dev, user} from '../../../src/log';
import {once} from '../../../src/utils/function';
import {registerServiceBuilder} from '../../../src/service';
import {AudioManager, upgradeBackgroundAudio} from './audio';
import {setStyles} from '../../../src/style';
import {ProgressBar} from './progress-bar';
import {getJsonLd} from './jsonld';

/** @private @const {number} */
const NEXT_SCREEN_AREA_RATIO = 0.75;

/** @private @const {string} */
const PRE_ACTIVE_PAGE_ATTRIBUTE_NAME = 'pre-active';

/** @private @const {string} */
const RELATED_ARTICLES_ATTRIBUTE_NAME = 'related-articles';

/** @private @const {string} */
const BOOKEND_CONFIG_ATTRIBUTE_NAME = 'bookend-config-src';

/** @private @const {string} */
const AMP_STORY_STANDALONE_ATTRIBUTE = 'standalone';

/** @private @const {number} */
const FULLSCREEN_THRESHOLD = 1024;

/** @type {string} */
const TAG = 'amp-story';


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

    /** @private {!Array<string>} */
    this.pageHistoryStack_ = [];

    /** @private @const {!Array<!AmpStoryPage>} */
    this.pages_ = [];

    /** @const @private {!VariableService} */
    this.variableService_ = new VariableService();

    /** @const @private {!AudioManager} */
    this.audioManager_ = new AudioManager(this.win, this.element);

    /** @private @const {!function():!Promise<?./bookend.BookendConfig>} */
    this.loadBookendConfig_ = once(() => this.loadBookendConfigImpl_());

    /** @private {?AmpStoryPage} */
    this.activePage_ = null;

    this.background_ = new AmpStoryBackground(this.element);
    this.background_.attach();
  }

  /** @override */
  buildCallback() {
    if (this.element.hasAttribute(AMP_STORY_STANDALONE_ATTRIBUTE)) {
      this.getAmpDoc().win.document.documentElement.classList
          .add('i-amphtml-story-standalone');
    }

    this.element.appendChild(
        this.systemLayer_.build(this.getRealChildren().length));

    this.initializeListeners_();

    this.navigationState_.installConsumer(new AnalyticsTrigger(this.element));
    this.navigationState_.installConsumer(this.variableService_);

    upgradeBackgroundAudio(this.element);

    registerServiceBuilder(this.win, 'story-variable',
        () => this.variableService_);
  }


  /** @private */
  initializeListeners_() {
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

    this.element.addEventListener(EventType.AUDIO_PLAYING, () => {
      this.audioPlaying_();
    });

    this.element.addEventListener(EventType.AUDIO_STOPPED, () => {
      this.audioStopped_();
    });

    this.element.addEventListener(EventType.SWITCH_PAGE, e => {
      const targetPageId = e.detail.targetPageId;

      if (targetPageId === 'i-amphtml-story-bookend') {
        this.showBookend_();
      } else {
        this.switchTo_(targetPageId);
      }
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

    this.win.document.addEventListener('fullscreenchange',
        () => { this.onFullscreenChanged_(); });

    this.win.document.addEventListener('webkitfullscreenchange',
        () => { this.onFullscreenChanged_(); });

    this.win.document.addEventListener('mozfullscreenchange',
        () => { this.onFullscreenChanged_(); });

    this.desktopMedia_ = this.win.matchMedia('(min-width: 768px)');

    this.boundOnResize_ = debounce(this.win, () => this.onResize(), 300);
    this.getViewport().onResize(this.boundOnResize_);
    this.onResize();

    const doc = this.element.ownerDocument;
    const n = doc.createElement('button');
    n.classList.add('i-amphtml-story-button-move','i-amphtml-story-button-next');
    this.element.appendChild(n);
    const p = doc.createElement('button');
    p.classList.add('i-amphtml-story-button-move','i-amphtml-story-button-prev');
    this.element.appendChild(p);

    const jsonLd = getJsonLd(doc);
    if (jsonLd && jsonLd['@type'] === 'NewsArticle') {
      const publisherInfo = jsonLd.publisher;
      const logoInfo = publisherInfo.logo;
      const logo = createElementWithAttributes(doc, 'amp-img', {
        width: Math.floor(logoInfo.width / 2),
        height: Math.floor(logoInfo.height / 2),
        src: logoInfo.url,
        // TODO(cvializ): alt text, i18n?
      });
      logo.classList.add('i-amphtml-story-logo');
      this.element.append(logo);
    }
  }

  onResize() {
    if (this.isDesktop_()) {
      this.element.setAttribute('desktop','');
    } else {
      this.element.removeAttribute('desktop');
    }
  }

  isDesktop_() {
    return this.desktopMedia_.matches;
  }

  getBackgroundUrl_(pageElement) {
    const fillElement = scopedQuerySelector(pageElement, '[template="fill"]');
    const fillPosterElement = scopedQuerySelector(fillElement, '[poster]');
    const srcElement = scopedQuerySelector(fillElement, '[src]');

    const pagePoster = pageElement ? pageElement.getAttribute('poster') : '';
    const fillPoster = fillPosterElement ?
        fillPosterElement.getAttribute('poster') : '';
    const src = srcElement ? srcElement.getAttribute('src') : '';

    return pagePoster || fillPoster || src;
  }

  updateBackground_(pageElement) {
    this.background_.setBackground(this.getBackgroundUrl_(pageElement));
  }

  /** @override */
  layoutCallback() {
    const firstPageEl = user().assertElement(
        this.element.querySelector('amp-story-page'),
        'Story must have at least one page.');

    return this.initializePages_()
        .then(() => this.switchTo_(firstPageEl.id))
        .then(() => this.preloadPagesByDistance_())
        .then(() => {
          this.pages_.forEach(page => {
            page.setActive(false);
          });
          this.activePage_.setActive(true);
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


  /** @private */
  initializePages_() {
    const pageImplPromises = Array.prototype.map.call(
        this.element.querySelectorAll('amp-story-page'),
        (pageEl, index) => {
          return pageEl.getImpl().then(pageImpl => {
            this.pages_[index] = pageImpl;
          })
        });

    return Promise.all(pageImplPromises);
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
    activePage.next();
  }


  /**
   * Go back to the previous screen in the story, if there is one.
   * @private
   */
  previous_() {
    const activePage = dev().assert(this.activePage_,
      'No active page set when navigating to next page.');
    activePage.previous();
  }

  /**
   * @param {!AmpStoryPage} page
   * @return {!Promise}
   */
  maybeApplyFirstAnimationFrame_(page) {
    return page.maybeApplyFirstAnimationFrame();
  }

  /**
   * @param {!AmpStoryPage} page
   * @return {!Promise}
   */
  maybeStartAnimations_(page) {
    return page.maybeStartAnimations();
  }

  /**
   * Switches to a particular page.
   * @param {string} targetPageId
   * @return {!Promise}
   */
  // TODO: Update history state
  switchTo_(targetPageId) {
    if (this.isBookendActive_) {
      // Disallow switching pages while the bookend is active.
      return;
    }

    const targetPage = this.getPageById_(targetPageId);
    const pageIndex = this.getPageIndex(targetPage);

    this.updateBackground_(targetPage.element);

    if (this.shouldEnterFullScreenOnSwitch_()) {
      this.enterFullScreen_();
    }

    // TODO(alanorozco): decouple this using NavigationState
    this.systemLayer_.setActivePageIndex(pageIndex);

    // TODO(alanorozco): check if autoplay
    this.navigationState_.updateActivePage(pageIndex, targetPage.element.id);

    const oldPage = this.activePage_;

    // TODO(cvializ): Move this to the page class?
    const activePriorSibling = targetPage.element.previousElementSibling;
    const previousActivePriorSibling = scopedQuerySelector(
        this.element, `[${PRE_ACTIVE_PAGE_ATTRIBUTE_NAME}]`);

    this.maybeApplyFirstAnimationFrame_(targetPage);

    return this.mutateElement(() => {
      this.activePage_ = targetPage;
      this.triggerActiveEventForPage_();
      this.maybeStartAnimations_(targetPage);
    })
        .then(() => {
          if (oldPage) {
            oldPage.setActive(false);
          }
          targetPage.setActive(true);

          if (activePriorSibling) {
            activePriorSibling.setAttribute(PRE_ACTIVE_PAGE_ATTRIBUTE_NAME, '');
          }
          if (previousActivePriorSibling) {
            previousActivePriorSibling.removeAttribute(
                PRE_ACTIVE_PAGE_ATTRIBUTE_NAME);
          }
        })
        .then(() => this.preloadPagesByDistance_())
        .then(() => this.forceRepaintForSafari_());
  }


  /** @private */
  triggerActiveEventForPage_() {
    // TODO(alanorozco): pass event priority once amphtml-story repo is merged
    // with upstream.
    Services.actionServiceForDoc(this.element)
        .trigger(this.activePage_.element, 'active', /* event */ null);
  }


  /**
   * For some reason, Safari has an issue where sometimes when pages become
   * visible, some descendants are not painted.  This is a hack where we detect
   * that the browser is Safari and force it to repaint, to avoid this case.
   * See newmuis/amphtml-story#106 for details.
   * @private
   */
  forceRepaintForSafari_() {
    const platform = Services.platformFor(this.win);
    if (platform.isSafari() || platform.isIos()) {
      this.mutateElement(() => {
        this.element.style.display = 'none';

        // Reading the height is what forces the repaint.  The conditional exists
        // only to workaround the fact that the closure compiler would otherwise
        // think that only reading the height has no effect.  Since the height is
        // always >= 0, this conditional will always be executed.
        const height = this.element.offsetHeight;
        if (height >= 0) {
          this.element.style.display = '';
        }
      });
    }
  }


  /**
   * @return {boolean}
   * @private
   */
  shouldEnterFullScreenOnSwitch_() {
    const {width, height} = this.getViewport().getSize();

    const inFullScreenThreshold =
        width <= FULLSCREEN_THRESHOLD && height <= FULLSCREEN_THRESHOLD;

    return inFullScreenThreshold && this.isAutoFullScreenEnabled_;
  }


  /**
   * Handles all key presses within the story.
   * @param {!Event} e The keydown event.
   * @private
   */
  onKeyDown_(e) {
    if (!this.isBookendActive_) {
      switch (e.keyCode) {
        // TODO(newmuis): This will need to be flipped for RTL.
        case KeyCodes.LEFT_ARROW:
          this.previous_();
          break;
        case KeyCodes.RIGHT_ARROW:
          this.next_();
          break;
      }
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
    fullscreenEnter(this.element);
  }


  /**
   * @param {boolean} opt_explicitUserAction
   * @private
   */
  exitFullScreen_(opt_explicitUserAction) {
    if (opt_explicitUserAction) {
      this.setAutoFullScreen(false);
    }

    fullscreenExit(this.element);
  }


  /**
   * Invoked when the document has actually transitioned into or out of
   * fullscreen mode.
   * @private
   */
  onFullscreenChanged_() {
    const isFullscreen = isFullscreenElement(this.element);
    this.systemLayer_.setInFullScreen(isFullscreen);
  }


  /**
   * Shows the bookend overlay.
   * @private
   */
  showBookend_() {
    if (this.isBookendActive_) {
      return;
    }

    this.buildBookend_().then(() => {
      this.exitFullScreen_();
      this.systemLayer_.toggleCloseBookendButton(true);
      this.isBookendActive_ = true;

      this.vsync_.mutate(() => {
        this.element.classList.add('i-amphtml-story-bookend-active');
        this.bookend_.getRoot()./*OK*/scrollTop = 0;
      });
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
      this.element.classList.remove('i-amphtml-story-bookend-active');
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

    event.stopPropagation();

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
  }


  /**
   * @return {!Array<!Array<string>>} A 2D array representing lists of pages by
   *     distance.  The outer array index represents the distance from the
   *     active page; the inner array is a list of page IDs at the specified
   *     distance.
   */
  getPagesByDistance_() {
    const distanceMap = this.getPageDistanceMapHelper_(
        /* distance */ 0, /* map */ {}, this.activePage_.element.id);

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
    page.getAdjacentPageIds().forEach(adjacentPageId => {
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
    if (this.isDesktop_()) {
      return;
    }
    const pagesByDistance = this.getPagesByDistance_();

    this.mutateElement(() => {
      pagesByDistance.forEach((pageIds, distance) => {
        pageIds.forEach(pageId => {
          const page = this.getPageById_(pageId);
          setStyles(page.element, {
            transform: `translateY(${100 * distance}%)`,
          });
        });
      });
    });
  }


  /** @private */
  buildBookend_() {
    if (this.bookend_.isBuilt()) {
      return Promise.resolve();
    }

    this.element.appendChild(this.bookend_.build());

    this.setAsOwner(this.bookend_.getRoot());

    return this.loadBookendConfig_().then(bookendConfig => {
      if (bookendConfig !== null) {
        this.bookend_.setConfig(dev().assert(bookendConfig));
      }
      this.scheduleResume(this.bookend_.getRoot());
    });
  }


  /**
   * @return {!Promise<?./bookend.BookendConfig>}
   * @private
   */
  loadBookendConfigImpl_() {
    // two-tiered implementation for backwards-compatibility with
    // related-articles attribute
    return this.loadBookendConfigInternal_().then(bookendConfig =>
        bookendConfig || this.loadRelatedArticlesAsBookendConfig_());
  }


  /**
   * @return {!Promise<?./bookend.BookendConfig>}
   */
  loadBookendConfigInternal_() {
    return this.loadJsonFromAttribute_(BOOKEND_CONFIG_ATTRIBUTE_NAME)
        .then(response => response && {
          shareProviders: response['share-providers'],
          relatedArticles: response['related-articles'] ?
              buildFromJson(response['related-articles']) : [],
        });
  }


  /**
   * @return {!Promise<?./bookend.BookendConfig>}
   * @private
   */
  loadRelatedArticlesAsBookendConfig_() {
    return this.loadJsonFromAttribute_(RELATED_ARTICLES_ATTRIBUTE_NAME)
        .then(response => response && {
          relatedArticles: buildFromJson(response),
        });
  }


  /**
   * @param {string} attributeName
   * @return {!Promise<?JsonObject>}
   * @private
   */
  loadJsonFromAttribute_(attributeName) {
    if (!this.element.hasAttribute(attributeName)) {
      return Promise.resolve(null);
    }

    const rawUrl = this.element.getAttribute(attributeName);

    return Services.urlReplacementsForDoc(this.getAmpDoc())
        .expandAsync(user().assertString(rawUrl))
        .then(url => Services.xhrFor(this.win).fetchJson(url))
        .then(response => {
          user().assert(response.ok, 'Invalid HTTP response');
          return response.json();
        });
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
   * @return {!AmpStoryPage} Retrieves the page with the specified ID.
   */
  getPageById_(id) {
    return user().assert(this.pages_.find(page => page.element.id === id),
        `Story refers to page "${id}", but no such page exists.`);
  }


  /**
   * @return {number}
   */
  getPageCount() {
    return this.pages_.length;
  }

  /**
   * @param {!AmpStoryPage} desiredPage
   * @return {number} The index of the page.
   */
  getPageIndex(desiredPage) {
    return this.pages_.findIndex(page => page === desiredPage);
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

  /**
   * Marks the story as having audio playing on the active page.
   * @private
   */
  audioPlaying_() {
    this.element.classList.add('audio-playing');
  }

  /**
   * Marks the story as not having audio playing on the active page.
   * @private
   */
  audioStopped_() {
    this.element.classList.remove('audio-playing');
  }
}

AMP.registerElement('amp-story', AmpStory, CSS);
