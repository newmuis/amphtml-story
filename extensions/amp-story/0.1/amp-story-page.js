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

const LOADING_SCREEN_CONTENTS_TEMPLATE =
    `<ul class="i-amp-story-page-loading-dots">
      <li class="i-amp-story-page-loading-dot"></li>
      <li class="i-amp-story-page-loading-dot"></li>
      <li class="i-amp-story-page-loading-dot"></li>
    </ul>
    <p class="i-amp-story-page-loading-text">Loading</p>`;


/**
 * A map of elements to delay showing the page.  The key is a DOM query to find
 * all elements that should wait for the specified event; the value is a factory
 * method that will return a PageElement to define rendering and loading
 * strategies.
 *
 * @const {!Object<string, !function(!Element, !AmpStoryPage): !PageElement>}
 */
const PAGE_ELEMENT_FACTORIES = {
  'amp-audio, amp-video, .i-amp-story-background-audio':
      (element, page) => new MediaElement(element, page),
  'amp-img, amp-anim':
      (element, page) => new ImageElement(element, page),
  '.i-amphtml-video-interface':
      (element, page) => new VideoInterfaceElement(element, page),
};


/**
 * CSS class for an element on an amp-story-page.
 * @const {string}
 */
const ELEMENT_CLASS_NAME = 'i-amp-story-page-element';


/**
 * CSS class for an element on an amp-story-page that indicates the element is
 * loaded.
 * @const {string}
 */
const ELEMENT_LOADED_CLASS_NAME = 'i-amp-story-page-element-loaded';


/**
 * CSS class for an element on an amp-story-page that indicates the element can
 * be shown in the UI.
 * @const {string}
 */
const ELEMENT_SHOW_CLASS_NAME = 'i-amp-story-page-element-shown';


/**
 * CSS class for an element on an amp-story-page that indicates the element has
 * failed to load.
 * @const {string}
 */
const ELEMENT_FAILED_CLASS_NAME = 'i-amp-story-page-element-failed';


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
const TIMER_POLL_DELAY_MS = 250;


/**
 * The minimum amount of a media item (by percentage) that must be loaded in
 * order for that element to be considered "loaded".  Note that if the total
 * size cannot be determined, this criteria is simply ignored.
 */
const MINIMUM_MEDIA_BUFFER_PERCENTAGE_FROM_BEGINNING = 0.25;


/**
 * The minimum amount of a media item (in seconds) that must be loaded in order
 * for that element to be considered "loaded".
 */
const MINIMUM_MEDIA_BUFFER_SECONDS_FROM_BEGINNING = 3;



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

    // Build load promises for each of the page elements.
    Object.keys(PAGE_ELEMENT_FACTORIES).forEach(query => {
      const elements = this.element.querySelectorAll(query);
      const factory = PAGE_ELEMENT_FACTORIES[query];
      Array.prototype.forEach.call(elements, element => {
        const pageElement = factory(element, this);
        this.pageElements_.push(pageElement);
      });
    });

    // Wait for all load promises to mark the page as loaded.
    this.loadPromise_ = this.timer_.poll(TIMER_POLL_DELAY_MS, () => {
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


class PageElement {
  /**
   * @param {!Element} element The element on the page.
   * @param {!AmpStoryPage} page The page that the element is on.
   */
  constructor(element, page) {
    /** @protected @const {!Element} */
    this.element = element;
    this.element.classList.add(ELEMENT_CLASS_NAME);

    /** @protected @const {!AmpStoryPage} */
    this.page = page;

    /** @public {boolean} */
    this.isLoaded = false;

    /** @public {boolean} */
    this.canBeShown = false;

    /** @public {boolean} */
    this.failed = false;
  }

  /**
   * @return {boolean} Whether this element can be shown.
   * @protected
   */
  canBeShown_() {
    return false;
  }

  /**
   * @return {boolean} Whether this element is considered loaded.
   * @protected
   */
  isLoaded_() {
    return false;
  }

  /**
   * @return {boolean} Whether this element has failed to load.
   * @protected
   */
  hasFailed_() {
    return false;
  }

  /**
   * @public
   */
  updateState() {
    if (!this.canBeShown) {
      this.canBeShown = this.canBeShown_();
      this.element.classList
          .toggle(ELEMENT_SHOW_CLASS_NAME, /* force */ this.canBeShown);
    }

    if (!this.isLoaded && !this.hasFailed) {
      this.isLoaded = this.isLoaded_();
      this.element.classList
          .toggle(ELEMENT_LOADED_CLASS_NAME, /* force */ this.isLoaded);
    }

    if (!this.hasFailed && !this.isLoaded) {
      this.hasFailed = this.hasFailed_();
      this.element.classList
          .toggle(ELEMENT_FAILED_CLASS_NAME, /* force */ this.hasFailed);
    }
  }

  /**
   * Called when the page the element is on becomes active.
   * @public
   */
  resumeCallback() {}

  /**
   * Called when the page the element is on is no longer active.
   * @public
   */
  pauseCallback() {}

  /**
   * @return {boolean} Whether this element produces audio.
   */
  hasAudio() {
    return false;
  }
}

class MediaElement extends PageElement {
  constructor(element, page) {
    super(element, page);

    /** @private {?HTMLMediaElement} */
    this.mediaElement_ = null;

    /** @private {boolean} */
    this.manualLoadInitiatedOnBuild_ = false;
  }

  /**
   * @return {!HTMLMediaElement}
   * @private
   */
  getMediaElement_() {
    if (this.element instanceof HTMLMediaElement) {
      this.mediaElement_ = this.element;
    } else if (!this.mediaElement_) {
      this.mediaElement_ = this.element.querySelector('audio, video');
    }
    return this.mediaElement_;
  }

  /** @override */
  canBeShown_() {
    const mediaElement = this.getMediaElement_();
    return Boolean(mediaElement && mediaElement.readyState >= 2);
  }

  /** @override */
  resumeCallback() {
    this.maybeManuallyForceLoading_();
  }

  /** @private */
  maybeManuallyForceLoading_() {
    const mediaElement = this.getMediaElement_();
    if (!mediaElement ||
        (mediaElement.buffered && mediaElement.buffered.length > 0)) {
      return;
    }

    mediaElement.load();
  }

  /** @override */
  isLoaded_() {
    const mediaElement = this.getMediaElement_();
    const firstTimeRange = this.getFirstTimeRange_();

    if (!mediaElement) {
      return false;
    }

    if (!mediaElement.buffered || mediaElement.buffered.length === 0) {
      if (!this.manualLoadInitiatedOnBuild_) {
        this.maybeManuallyForceLoading_();
        this.manualLoadInitiatedOnBuild_ = true;
      }
      return false;
    }

    const bufferedSeconds = mediaElement.buffered.end(firstTimeRange);
    const bufferedPercentage =
        (mediaElement.buffered.end(firstTimeRange) / mediaElement.duration);

    return bufferedSeconds >= MINIMUM_MEDIA_BUFFER_SECONDS_FROM_BEGINNING ||
        bufferedPercentage >= MINIMUM_MEDIA_BUFFER_PERCENTAGE_FROM_BEGINNING;
  }

  /** @override */
  hasFailed_() {
    const mediaElement = this.getMediaElement_();
    return !!mediaElement.error;
  }

  /**
   * @return {?number} The numbered index of the first buffered time range in
   *     this media element.
   */
  getFirstTimeRange_() {
    const mediaElement = this.getMediaElement_();
    if (mediaElement) {
      for (let i = 0; i < mediaElement.buffered.length; i++) {
        if (mediaElement.buffered.start(i) === 0) {
          return i;
        }
      }
    }

    return null;
  }

  /** @override */
  hasAudio() {
    const mediaElement = this.getMediaElement_();
    return mediaElement.mozHasAudio ||
        Boolean(mediaElement.webkitAudioDecodedByteCount) ||
        Boolean(mediaElement.audioTracks && mediaElement.audioTracks.length);
  }
}

class ImageElement extends PageElement {
  constructor(element, page) {
    super(element, page);

    /**
     * @private {?HTMLImageElement}
     */
    this.imageElement_ = null;
  }

  /**
   * @return {!HTMLImageElement}
   * @private
   */
  getImageElement_() {
    if (this.element instanceof HTMLImageElement) {
      this.imageElement_ = this.element;
    } else if (!this.imageElement_) {
      this.imageElement_ = this.element.querySelector('img');
    }
    return this.imageElement_;
  }

  /** @override */
  isLoaded_() {
    const imageElement = this.getImageElement_();
    return Boolean(imageElement && imageElement.complete &&
        imageElement.naturalWidth && imageElement.naturalHeight);
  }

  /** @override */
  hasFailed_() {
    const imageElement = this.getImageElement_();
    return Boolean(imageElement && imageElement.complete &&
        (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0));
  }

  /** @override */
  hasAudio() {
    return false;
  }
}

class VideoInterfaceElement extends PageElement {
  constructor(element, page) {
    super(element, page);
  }

  /** @private */
  isLaidOut_() {
    return this.element.hasAttribute('i-amphtml-layout');
  }

  /** @override */
  isLoaded_() {
    return this.isLaidOut_();
  }

  /** @override */
  hasFailed_() {
    return !this.isLaidOut_();
  }

  /** @override */
  hasAudio() {
    return true;
  }
}

AMP.registerElement('amp-story-page', AmpStoryPage);
