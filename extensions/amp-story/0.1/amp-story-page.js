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
import {dev} from '../../../src/log';

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
 * @const {!Object<string, string>}
 */
const PAGE_ELEMENT_FACTORIES = {
  'amp-audio, amp-video, .i-amp-story-background-audio':
      element => new MediaElement(element),
  'amp-img, amp-anim': element => new ImageElement(element),
  '.i-amphtml-video-interface': element => new VideoInterfaceElement(element),
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
 * CSS class for an amp-story-page that indicates the entire page is loaded.
 * @const {string}
 */
const PAGE_LOADED_CLASS_NAME = 'i-amp-story-page-loaded';



export class AmpStoryPage extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private @const {?AnimationManager} */
    this.animationManager_ = null;

    /** @private {!Array<!PageElement>} */
    this.pageElements_ = [];
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

    this.maybeCreateAnimationManager_();
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
    const loadPromises = [];
    Object.keys(PAGE_ELEMENT_FACTORIES).forEach(query => {
      const elements = this.element.querySelectorAll(query);
      const factory = PAGE_ELEMENT_FACTORIES[query];
      Array.prototype.forEach.call(elements, element => {
        const pageElement = factory(element);
        loadPromises.push(pageElement.loadPromise);
        this.pageElements_.push(pageElement);
      });
    });

    // Wait for all load promises to mark the page as loaded.
    Promise.all(loadPromises)
        .then(() => {
          this.element.classList.add(PAGE_LOADED_CLASS_NAME);
        });
  }


  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }


  /** @override */
  pauseCallback() {
    this.pauseAllMedia_();
  }


  /** @override */
  resumeCallback() {
    this.maybeApplyFirstAnimationFrame();
    this.playAllMedia_();
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
      mediaItem.play();
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
}


class PageElement {
  /**
   * @param {!Element} element The element on the page.
   * @param {!Object<string, string>} eventNames A map of event names that
   *     trigger a set of predefined actions for PageElements (load, show, and
   *     error).
   */
  constructor(element, eventNames) {
    /** @protected @const {!Element} */
    this.element = element;
    this.element.classList.add(ELEMENT_CLASS_NAME);

    /** @private @const {!Object<string, string>} */
    this.eventNames_ = eventNames;

    /**
     * A promise that is resolved when this element is considered to be loaded.
     * The decision as to whether an element is considered loaded is deferred to
     * each subclass of PageElement.
     * @public @const {!Promise<undefined>}
     */
    this.loadPromise = this.getLoadPromise_()
        .then(() => this.onLoad_(), () => this.onError_());

    /**
     * A promise that is resolved when this element can be shown on the page.
     * The decision as to whether an element can be shown is deferred to each
     * subclass of PageElement.
     * @public @const {!Promise<undefined>}
     */
    this.showPromise = this.getShowPromise_()
        .then(() => this.onShow_());
  }

  /**
   * @return {!Promise<undefined>}
   * @private
   */
  getShowPromise_() {
    if (this.canBeShown()) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.element.addEventListener(this.eventNames_.show, () => {
        if (this.canBeShown()) {
          resolve();
        }
      }, true);
    });
  }

  /**
   * @return {!Promise<undefined>}
   * @private
   */
  getLoadPromise_() {
    if (this.isLoaded()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.element.addEventListener(this.eventNames_.load, () => {
        if (this.isLoaded()) {
          resolve();
        }
      }, true);
      this.element.addEventListener(this.eventNames_.error, () => {
        if (this.hasFailed()) {
          reject();
        }
      }, true);
    });
  }

  /** @private */
  onLoad_() {
    this.element.classList.add(ELEMENT_LOADED_CLASS_NAME);
  }

  /** @private */
  onShow_() {
    this.element.classList.add(ELEMENT_SHOW_CLASS_NAME);
  }

  /** @private */
  onError_() {
    // We have currently decided not to show a separate failure state, and
    // simply show the failing UI.
    this.onLoad_();
  }

  /**
   * @return {boolean} Whether this element can be shown.
   * @protected
   */
  canBeShown() {
    return this.isLoaded();
  }

  /**
   * @return {boolean} Whether this element is considered loaded.
   * @protected
   */
  isLoaded() {
    return false;
  }

  /**
   * @return {boolean} Whether this element has failed to load.
   */
  hasFailed() {
    return false;
  }
}

class MediaElement extends PageElement {
  constructor(element) {
    super(element, {
      load: 'loadeddata',
      show: 'loadeddata',
      error: 'error',
    });

    /**
     * @private {?HTMLMediaElement}
     */
    this.mediaElement_ = null;
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
  canBeShown() {
    const mediaElement = this.getMediaElement_();
    return Boolean(mediaElement && mediaElement.readyState >= 2);
  }

  /** @override */
  isLoaded() {
    const mediaElement = this.getMediaElement_();
    return Boolean(mediaElement && mediaElement.readyState >= 4);
  }

  /** @override */
  hasFailed() {
    const mediaElement = this.getMediaElement_();
    return !!mediaElement.error;
  }
}

class ImageElement extends PageElement {
  constructor(element) {
    super(element, {
      load: 'load',
      show: 'load',
      error: 'error',
    });

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
  isLoaded() {
    const imageElement = this.getImageElement_();
    return Boolean(imageElement && imageElement.complete &&
        imageElement.naturalWidth && imageElement.naturalHeight);
  }

  /** @override */
  hasFailed() {
    const imageElement = this.getImageElement_();
    return Boolean(imageElement && imageElement.complete &&
        (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0));
  }
}

class VideoInterfaceElement extends PageElement {
  constructor(element) {
    super(element, {
      load: 'load',
      show: 'load',
      error: 'error',
    });
  }

  /** @private */
  isLaidOut_() {
    return this.element.hasAttribute('i-amphtml-layout');
  }

  /** @override */
  isLoaded() {
    return this.isLaidOut_();
  }

  /** @override */
  hasFailed() {
    return !this.isLaidOut_();
  }
}

AMP.registerElement('amp-story-page', AmpStoryPage);
