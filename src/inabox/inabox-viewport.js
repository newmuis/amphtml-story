/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
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

import {childElementByTag} from '../../src/dom.js';
import {iframeMessagingClientFor} from './inabox-iframe-messaging-client';
import {Services} from '../services';
import {Viewport} from '../service/viewport/viewport-impl';
import {ViewportBindingDef} from '../service/viewport/viewport-binding-def';
import {registerServiceBuilderForDoc} from '../service';
import {
  layoutRectLtwh,
  moveLayoutRect,
} from '../layout-rect';
import {Observable} from '../observable';
import {MessageType} from '../../src/3p-frame-messaging';
import {dev} from '../log';
import {vsyncFor} from '../../src/services';
import {px, setStyles} from '../../src/style';


/** @const {string} */
const TAG = 'inabox-viewport';


/**
 * @param {!HTMLBodyElement} bodyElement
 * @return {!Element}
 * @visibleForTesting
 */
 // TODO(alanorozco):
//   Move this where it makes sense
export function getFixedContainer(bodyElement) {
  return dev().assertElement(childElementByTag(
      dev().assertElement(bodyElement), 'amp-ad-banner'));
}


/** @visibleForTesting */
export function prepareFixedContainer(win, fixedContainer) {
  return vsyncFor(win).runPromise({
    measure: state => {
      state.boundingRect = fixedContainer./*OK*/getBoundingClientRect();
    },
    mutate: state => {
      setStyles(dev().assertElement(win.document.body), {
        'background': 'transparent',
      });

      setStyles(fixedContainer, {
        'position': 'absolute',
        'left': '50%',
        'top': '50%',
        'right': 'auto',
        'bottom': 'auto',
        'width': px(state.boundingRect.width),
        'height': px(state.boundingRect.height),
        'margin-left': px(-(state.boundingRect.width / 2)),
        'margin-top': px(-(state.boundingRect.height / 2)),
      });
    },
  }, {});
}


/** @visibleForTesting */
export function resetFixedContainer(win, fixedContainer) {
  return vsyncFor(win).mutatePromise(() => {
    setStyles(dev().assertElement(win.document.body), {
      'background': 'transparent',
    });

    setStyles(fixedContainer, {
      'position': null,
      'left': null,
      'top': null,
      'right': null,
      'bottom': null,
      'width': null,
      'height': null,
      'margin-left': null,
      'margin-top': null,
    });
  });
}


/**
 * Implementation of ViewportBindingDef that works inside an non-scrollable
 * iframe box by listening to host doc for position and resize updates.
 *
 * @visibleForTesting
 * @implements {ViewportBindingDef}
 */
export class ViewportBindingInabox {

  /**
   * @param {!Window} win
   */
  constructor(win) {
    /** @const {!Window} */
    this.win = win;

    /** @private @const {!Observable} */
    this.scrollObservable_ = new Observable();

    /** @private @const {!Observable} */
    this.resizeObservable_ = new Observable();

    const boxWidth = win./*OK*/innerWidth;
    const boxHeight = win./*OK*/innerHeight;

    /**
     * The current viewport rect.
     * Before hearing from host doc, we're blind about the viewport position
     * and iframe position. 0 scroll is not a bad guess.
     * Meanwhile, use iframe box size as the viewport size gives a good
     * initial resource scheduling.
     * @private {!../layout-rect.LayoutRectDef}
     */
    this.viewportRect_ = layoutRectLtwh(0, 0, boxWidth, boxHeight);

    /**
     * The current layout rect of the iframe box.
     * TODO(lannka, #7971): The best way to stop visibility from firing
     * is to move this functionality to the InOb polyfill.
     * ~To not trigger amp-analytics visibility immediately,
     * we start with an initial position right below the fold.~
     * @private {!../layout-rect.LayoutRectDef}
     */
    this.boxRect_ = layoutRectLtwh(0, boxHeight + 1, boxWidth, boxHeight);

    /** @private @const {!../../3p/iframe-messaging-client.IframeMessagingClient} */
    this.iframeClient_ = iframeMessagingClientFor(win);

    /** @private {?Promise<!../layout-rect.LayoutRectDef>} */
    this.requestPositionPromise_ = null;

    /** @private {!../service/vsync-impl.Vsync} */
    this.vsync_ = Services.vsyncFor(this.win);

    /** @private {function()} */
    this.fireScrollThrottle_ = throttle(this.win, () => {
      this.scrollObservable_.fire();
    }, MIN_EVENT_INTERVAL);

    dev().fine(TAG, 'initialized inabox viewport');
  }

  /** @override */
  connect() {
    this.listenForPosition_();
  }

  /** @private */
  listenForPosition_() {

    this.iframeClient_.makeRequest(
        MessageType.SEND_POSITIONS, MessageType.POSITION,
        data => {
          dev().fine(TAG, 'Position changed: ', data);
          const oldViewportRect = this.viewportRect_;
          this.viewportRect_ = data.viewportRect;

          this.updateBoxRect_(data.targetRect);

          if (isResized(this.viewportRect_, oldViewportRect)) {
            this.resizeObservable_.fire();
          }
          if (isMoved(this.viewportRect_, oldViewportRect)) {
            this.fireScrollThrottle_();
          }
        });
  }

  /** @override */
  getLayoutRect(el) {
    const b = el./*OK*/getBoundingClientRect();
    return layoutRectLtwh(
        Math.round(b.left + this.boxRect_.left),
        Math.round(b.top + this.boxRect_.top),
        Math.round(b.width),
        Math.round(b.height));
  }

  /** @override */
  onScroll(callback) {
    this.scrollObservable_.add(callback);
  }

  /** @override */
  onResize(callback) {
    this.resizeObservable_.add(callback);
  }

  /** @override */
  getSize() {
    return {
      width: this.viewportRect_.width,
      height: this.viewportRect_.height,
    };
  }

  /** @override */
  getScrollTop() {
    return this.viewportRect_.top;
  }

  /** @override */
  getScrollLeft() {
    return this.viewportRect_.left;
  }

  /**
   * @param {?../layout-rect.LayoutRectDef|undefined} positionRect
   * @private
   */
  updateBoxRect_(positionRect) {
    if (!positionRect) {
      return;
    }

    const boxRect = moveLayoutRect(positionRect, this.viewportRect_.left,
        this.viewportRect_.top);

    if (isChanged(boxRect, this.boxRect_)) {
      dev().fine(TAG, 'Updating viewport box rect: ', boxRect);

      this.boxRect_ = boxRect;
      // Remeasure all AMP elements once iframe position or size are changed.
      // Because all layout boxes are calculated relatively to the
      // iframe position.
      this.remeasureAllElements_();
      // TODO: fire DOM mutation event once we handle them
    }
  }

  /**
   * @return {!Array<!../service/resource.Resource>}
   * @visibleForTesting
   */
  getChildResources() {
    return Services.resourcesForDoc(this.win.document).get();
  }

  /** @private */
  remeasureAllElements_() {
    this.getChildResources().forEach(resource => resource.measure());
  }

  /** @override */
  updateLightboxMode(lightboxMode) {
    if (lightboxMode) {
      return this.tryToEnterOverlayMode_();
    }
    return this.leaveOverlayMode_();
  }

  /** @override */
  getRootClientRectAsync() {
    if (!this.requestPositionPromise_) {
      this.requestPositionPromise_ = new Promise(resolve => {
        this.iframeClient_.requestOnce(
            MessageType.SEND_POSITIONS, MessageType.POSITION,
            data => {
              this.requestPositionPromise_ = null;
              dev().assert(data.targetRect, 'Host should send targetRect');
              resolve(data.targetRect);
            }
        );
      });
    }
    return this.requestPositionPromise_;
  }


  /**
   * @return {!Promise}
   * @private
   */
  tryToEnterOverlayMode_() {
    return this.prepareBodyForOverlay_()
        .then(() => this.requestFullOverlayFrame_());
  }

  /**
   * @return {!Promise}
   * @private
   */
  leaveOverlayMode_() {
    return this.requestCancelFullOverlayFrame_()
        .then(() => this.resetBodyForOverlay_());
  }

  /**
   * Prepares the "fixed" container before expanding frame.
   * @return {!Promise}
   * @private
   */
  prepareBodyForOverlay_() {
    return prepareBodyForOverlay(this.win, this.getBodyElement());
  }

  /**
   * Resets the "fixed" container to its original position after collapse.
   * @return {!Promise}
   * @private
   */
  resetBodyForOverlay_() {
    return resetBodyForOverlay(this.win, this.getBodyElement());
  }

  /**
   * @return {!Promise}
   * @private
   */
  requestFullOverlayFrame_() {
    return new Promise((resolve, reject) => {
      const unlisten = this.iframeClient_.makeRequest(
          MessageType.FULL_OVERLAY_FRAME,
          MessageType.FULL_OVERLAY_FRAME_RESPONSE,
          response => {
            unlisten();
            if (response.success) {
              this.updateBoxRect_(response.boxRect);
              resolve();
            } else {
              reject('Request to open lightbox rejected by host document');
            }
          });
    });
  }

  /**
   * @return {!Promise}
   * @private
   */
  requestCancelFullOverlayFrame_() {
    return new Promise(resolve => {
      const unlisten = this.iframeClient_.makeRequest(
          MessageType.CANCEL_FULL_OVERLAY_FRAME,
          MessageType.CANCEL_FULL_OVERLAY_FRAME_RESPONSE,
          response => {
            unlisten();
            this.updateBoxRect_(response.boxRect);
            resolve();
          });
    });
  }

  /** @visibleForTesting */
  getBodyElement() {
    return dev().assertElement(this.win.document.body);
  }

  /** @override */
  updateLightboxMode(lightboxMode) {
    if (lightboxMode) {
      return this.tryToEnterOverlayMode_();
    }
    return this.leaveOverlayMode_();
  }

  /**
   * @return {!Promise}
   * @private
   */
  tryToEnterOverlayMode_() {
    // TODO(alanorozco): Update viewport measurement from host message.
    return this.prepareFixedContainer_()
        .then(() => this.requestFullOverlayFrame_());
  }

  /**
   * @return {!Promise}
   * @private
   */
  leaveOverlayMode_() {
    return this.requestCancelFullOverlayFrame_()
        .then(() => this.resetFixedContainer_());
  }

  /**
   * Prepares the "fixed" container before expanding frame.
   * @return {!Promise}
   * @private
   */
  prepareFixedContainer_() {
    const fixedContainer = this.getFixedContainer_();

    if (!fixedContainer) {
      dev().warn(TAG, 'No fixed container inside frame, content will shift.');
      return Promise.resolve();
    }

    return prepareFixedContainer(this.win, dev().assertElement(fixedContainer));
  }

  /**
   * Resets the "fixed" container to its original position after collapse.
   * @return {!Promise}
   * @private
   */
  resetFixedContainer_() {
    const fixedContainer = this.getFixedContainer_();

    if (!fixedContainer) {
      dev().warn(TAG, 'No fixed container inside frame, content will shift.');
      return Promise.resolve();
    }

    return resetFixedContainer(this.win, dev().assertElement(fixedContainer));
  }

  /**
   * @return {!Promise}
   * @private
   */
  requestFullOverlayFrame_() {
    return new Promise((resolve, reject) => {
      this.iframeClient_.makeRequest(
          MessageType.FULL_OVERLAY_FRAME,
          MessageType.FULL_OVERLAY_FRAME_RESPONSE,
          response => {
            if (response.success) {
              resolve();
            } else {
              reject('Request to open lightbox rejected by host document');
            }
          });
    });
  }

  /**
   * @return {!Promise}
   * @private
   */
  requestCancelFullOverlayFrame_() {
    return new Promise(resolve => {
      this.iframeClient_.makeRequest(
          MessageType.CANCEL_FULL_OVERLAY_FRAME,
          MessageType.CANCEL_FULL_OVERLAY_FRAME_RESPONSE,
          resolve);
    });
  }

  getFixedContainer_() {
    return getFixedContainer(
        /** @type {!HTMLBodyElement} */ (dev().assert(this.win.document.body)));
  }

  /** @override */ disconnect() {/* no-op */}
  /** @override */ updatePaddingTop() {/* no-op */}
  /** @override */ hideViewerHeader() {/* no-op */}
  /** @override */ showViewerHeader() {/* no-op */}
  /** @override */ disableScroll() {/* no-op */}
  /** @override */ resetScroll() {/* no-op */}
  /** @override */ ensureReadyForElements() {/* no-op */}
  /** @override */ setScrollTop() {/* no-op */}
  /** @override */ getScrollWidth() {return 0;}
  /** @override */ getScrollHeight() {return 0;}
  /** @override */ getBorderTop() {return 0;}
  /** @override */ requiresFixedLayerTransfer() {return false;}
}

/**
 * @param {!../service/ampdoc-impl.AmpDoc} ampdoc
 */
export function installInaboxViewportService(ampdoc) {
  const binding = new ViewportBindingInabox(ampdoc.win);
  const viewer = Services.viewerForDoc(ampdoc);
  registerServiceBuilderForDoc(ampdoc,
      'viewport',
      function() {
        return new Viewport(ampdoc, binding, viewer);
      },
      /* opt_instantiate */ true);
}

/**
 * @param {!../layout-rect.LayoutRectDef} newRect
 * @param {!../layout-rect.LayoutRectDef} oldRect
 * @returns {boolean}
 */
function isChanged(newRect, oldRect) {
  return isMoved(newRect, oldRect) || isResized(newRect, oldRect);
}

/**
 * @param {!../layout-rect.LayoutRectDef} newRect
 * @param {!../layout-rect.LayoutRectDef} oldRect
 * @returns {boolean}
 */
function isMoved(newRect, oldRect) {
  return newRect.left != oldRect.left || newRect.top != oldRect.top;
}

/**
 * @param {!../layout-rect.LayoutRectDef} newRect
 * @param {!../layout-rect.LayoutRectDef} oldRect
 * @returns {boolean}
 */
function isResized(newRect, oldRect) {
  return newRect.width != oldRect.width || newRect.height != oldRect.height;
}
