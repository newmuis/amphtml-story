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
 * <amp-story-page>
 * </amp-story>
 * </code>
 */
import {
  AnimationManager,
  hasAnimations,
} from './animation';
import {Layout} from '../../../src/layout';
import {Services} from '../../../src/services';
import {upgradeBackgroundAudio} from './audio';
import {dev, user} from '../../../src/log';
import {EventType, dispatch} from './events';
import {PageElement} from './page-element';

const LOADING_SCREEN_CONTENTS_TEMPLATE =
    `<ul class="i-amp-story-page-loading-dots">
      <li class="i-amp-story-page-loading-dot"></li>
      <li class="i-amp-story-page-loading-dot"></li>
      <li class="i-amp-story-page-loading-dot"></li>
    </ul>
    <p class="i-amp-story-page-loading-text">Loading</p>`;


/**
 * CSS class for an amp-story-page that indicates the entire page is loaded.
 * @const {string}
 */
const PAGE_LOADED_CLASS_NAME = 'i-amp-story-page-loaded';


/**
 * The duration of time (in milliseconds) to show the loading screen for this
 * page, before showing the page content.
 * @const {number}
 */
const LOAD_TIMEOUT_MS = 8000;


/**
 * The delay (in milliseconds) to wait between polling for loaded resources.
 */
const LOAD_TIMER_POLL_DELAY_MS = 250;


export class AmpStoryPage extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private @const {?AnimationManager} */
    this.animationManager_ = null;

    /** @private @const {!Array<!PageElement>} */
    this.pageElements_ = [];

    /** @private {?function()} */
    this.resolveLoadPromise_ = null;

    /** @private {?Promise<undefined>} */
    this.loadPromise_ = new Promise(resolve => {
      this.resolveLoadPromise_ = resolve;
    });

    /** @private {?Promise<undefined>} */
    this.loadTimeoutPromise_ = null;

    /** @private @const {!../../../src/service/timer-impl.Timer} */
    this.timer_ = Services.timerFor(this.win);

    /** @private {boolean} */
    this.isLoaded_ = false;
  }


  /*
   * @return {?./animation.AnimationManager}
   */
  maybeCreateAnimationManager_() {
    if (!this.animationManager_) {
      if (!hasAnimations(this.element)) {
        return;
      }

      this.animationManager_ = AnimationManager.create(
          this.element, this.getAmpDoc(), this.getAmpDoc().getUrl());
    }
  }


  /** @override */
  buildCallback() {
    upgradeBackgroundAudio(this.element);
    this.markMediaElementsWithPreload_();
    this.maybeCreateAnimationManager_();
    this.initializeLoading_();
  }


  /**
   * Marks any AMP elements that represent media elements with preload="auto".
   */
  markMediaElementsWithPreload_() {
    const mediaSet = this.element.querySelectorAll('amp-audio, amp-video');
    for (const mediaItem of mediaSet) {
      mediaItem.setAttribute('preload', 'auto');
    }
  }


  /**
   * Initializes the loading screen for this amp-story-page, and the listeners
   * to remove it once loaded.
   */
  initializeLoading_() {
    // Add the loading screen into the DOM.
    const loadingScreen = this.win.document.createElement('div');
    loadingScreen.classList.add('i-amp-story-page-loading-screen');
    loadingScreen./*OK*/innerHTML = LOADING_SCREEN_CONTENTS_TEMPLATE;
    this.element.appendChild(loadingScreen);

    // Build a list of page elements and poll until they are all loaded.
    this.pageElements_ = PageElement.getElementsFromPage(this);
    this.loadPromise_ = this.timer_.poll(LOAD_TIMER_POLL_DELAY_MS, () => {
      return this.calculateLoadStatus();
    }).then(() => this.markPageAsLoaded_());
  }


  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }


  /** @override */
  pauseCallback() {
    this.pauseAllMedia_();
    this.pageElements_.forEach(pageElement => {
      pageElement.pauseCallback();
    });

    if (this.animationManager_) {
      this.animationManager_.cancelAll();
    }
  }


  /** @override */
  resumeCallback() {
    if (!this.loadPromise_) {
      return;
    }

    if (!this.loadTimeoutPromise_) {
      this.loadTimeoutPromise_ = this.timer_.promise(LOAD_TIMEOUT_MS);
    }

    this.pageElements_.forEach(pageElement => {
      pageElement.resumeCallback();
    });

    Promise.race([this.loadPromise_, this.loadTimeoutPromise_]).then(() => {
      //this.maybeApplyFirstAnimationFrame();
      this.markPageAsLoaded_();
      this.toggleAudioIcon_();
      this.playAllMedia_();
    });
  }


  /** @private */
  markPageAsLoaded_() {
    this.element.classList.add(PAGE_LOADED_CLASS_NAME);
    this.resolveLoadPromise_();
  }


  /** @private */
  toggleAudioIcon_() {
    // Dispatch event to signal whether audio is playing.
    const eventType = this.hasAudio_() ?
        EventType.AUDIO_PLAYING : EventType.AUDIO_STOPPED;
    dispatch(this.element, eventType, /* opt_bubbles */ true);
  }


  /**
   * @return {boolean}
   * @private
   */
  hasAudio_() {
    return this.pageElements_.some(pageElement => pageElement.hasAudio());
  }


  /**
   * @return {boolean} true, if the page is completely loaded; false otherwise.
   * @public
   */
  calculateLoadStatus() {
    if (this.isLoaded_) {
      return true;
    }

    const isLoaded = this.pageElements_.reduce(
        (otherPageElementsAreLoaded, pageElement) => {
          pageElement.updateState();
          const currentPageElementIsLoaded =
              (pageElement.isLoaded || pageElement.hasFailed);
          return otherPageElementsAreLoaded && currentPageElementIsLoaded;
        }, /* initialValue */ true);

    this.isLoaded_ = isLoaded;

    if (this.isLoaded_) {
      this.markPageAsLoaded_();
    }

    return this.isLoaded_;
  }


  /** @override */
  prerenderAllowed() {
    return true;
  }


  /**
   * Gets all media on this page.
   * @private
   */
  getAllMedia_() {
    return this.element.querySelectorAll('audio, video');
  }


  /**
   * Pauses all media on this page.
   * @private
   */
  pauseAllMedia_() {
    const mediaSet = this.getAllMedia_();
    for (const mediaItem of mediaSet) {
      mediaItem.pause();
      mediaItem.currentTime = 0;
    }
  }


  /**
   * Pauses all media on this page.
   * @private
   */
  playAllMedia_() {
    const mediaSet = this.getAllMedia_();
    for (const mediaItem of mediaSet) {
      mediaItem.play().catch(() => {
        user().error(`Failed to play media element with src ${mediaItem.src}.`);
      });
    }
  }

  /** */
  maybeStartAnimations() {
    if (!this.animationManager_) {
      return;
    }
    this.animationManager_.animateIn();
  }


  /**
   * @return {boolean} True if animations were stopped.
   */
  maybeFinishEnterAnimations() {
    if (!this.animationManager_) {
      return false;
    }

    if (!this.animationManager_.hasAnimationStarted()) {
      return false;
    }

    this.animationManager_.finishAll();

    return true;
  }


  /**
   * @return {!Promise}
   * @private
   */
  maybeApplyFirstAnimationFrame() {
    if (!this.animationManager_) {
      return Promise.resolve();
    }
    return this.animationManager_.applyFirstFrame();
  }


  /**
   * @return {boolean} Whether this page is currently active.
   * @public
   */
  isActive() {
    return this.element.getAttribute('active');
  }
}

AMP.registerElement('amp-story-page', AmpStoryPage);
