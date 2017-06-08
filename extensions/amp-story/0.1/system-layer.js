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
import {EventType, dispatch} from './events';
import {dev} from '../../../src/log';
import {scale, setStyles} from '../../../src/style';
import {vsyncFor} from '../../../src/services';


// TODO(alanorozco): Use a precompiled template for performance
const TEMPLATE =
    `<div class="i-amp-story-progress">
      <div class="i-amp-story-progress-bar"></div>
      <div class="i-amp-story-progress-value"></div>
    </div>
    <div class="i-amp-story-ui-right">
      <div role="button" class="i-amp-story-exit-fullscreen i-amp-story-button" hidden>
        <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      </div>
      <div div role="button" class="i-amp-story-bookend-close" hidden>
        <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          <path d="M0 0h24v24H0z" fill="none"/>
        </svg>
      </div role="button">
    </nav>`;


/**
 * System Layer (i.e. UI Chrome) for <amp-story>.
 */
export class SystemLayer {
  /**
   * @param {!Window} win
   */
  constructor(win) {
    /** @private {!Window} */
    this.win_ = win;

    /** @private {boolean} */
    this.isBuilt_ = false;

    /** @private {?Element} */
    this.root_ = null;

    /** @private {boolean} */
    this.inFullScreen_ = false;

    /** @private {?Element} */
    this.exitFullScreenBtn_ = null;

    /** @private {?Element} */
    this.progressEl_ = null;
  }

  /**
   * @return {!Element}
   */
  build() {
    if (this.isBuilt_) {
      return this.getRoot();
    }

    this.isBuilt_ = true;

    this.root_ = this.win_.document.createElement('aside');
    this.root_.classList.add('i-amp-story-system-layer');
    this.root_./*OK*/innerHTML = TEMPLATE;

    this.exitFullScreenBtn_ =
        this.root_.querySelector('.i-amp-story-exit-fullscreen');

    this.progressEl_ = this.root_.querySelector('.i-amp-story-progress-value');

    this.addEventHandlers_();

    return this.getRoot();
  }

  /**
   * @private
   */
  addEventHandlers_() {
    // TODO(alanorozco): Listen to tap event properly (i.e. fastclick)
    this.exitFullScreenBtn_.addEventListener(
        'click', e => this.onExitFullScreenClick_(e));
  }

  /**
   * @return {!../../../src/vsync-impl.Vsync}
   * @private
   */
  getVsync_() {
    return vsyncFor(this.win_);
  }

  /**
   * @return {!Element}
   */
  getRoot() {
    return dev().assertElement(this.root_);
  }

  /**
   * @param {boolean} inFullScreen
   */
  setInFullScreen(inFullScreen) {
    this.inFullScreen_ = inFullScreen;

    this.toggleExitFullScreenBtn_(inFullScreen);
  }

  /**
   * @param {boolean} isEnabled
   * @private
   */
  toggleExitFullScreenBtn_(isEnabled) {
    this.getVsync_().mutate(() => {
      if (isEnabled) {
        this.exitFullScreenBtn_.removeAttribute('hidden');
      } else {
        this.exitFullScreenBtn_.setAttribute('hidden', 'hidden');
      }
    });
  }

  /**
   * @param {!Event} e
   * @private
   */
  onExitFullScreenClick_(e) {
    e.stopPropagation();

    dispatch(this.getRoot(), EventType.EXIT_FULLSCREEN, /* opt_bubbles */ true);
  }

  /**
   * @param {number} index
   * @param {number} total
   */
  updateProgressBar(index, total) {
    const factor = index / total;

    this.getVsync_().mutate(() => {
      setStyles(this.progressEl_, {
        'transform': scale(`${factor},1`),
      });
    });
  }
}
