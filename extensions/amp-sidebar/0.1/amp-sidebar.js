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

import {CSS} from '../../../build/amp-sidebar-0.1.css';
import {KeyCodes} from '../../../src/utils/key-codes';
import {closestByTag, tryFocus, isRTL} from '../../../src/dom';
import {Layout} from '../../../src/layout';
import {Services} from '../../../src/services';
import {Toolbar} from './toolbar';
import {closestByTag, tryFocus, isRTL} from '../../../src/dom';
import {dev} from '../../../src/log';
import {Services} from '../../../src/services';
import {setStyles, toggle} from '../../../src/style';
import {debounce} from '../../../src/utils/rate-limit';
import {removeFragment, parseUrl} from '../../../src/url';

/** @const */
const TAG = 'amp-sidebar toolbar';

/** @const */
const ANIMATION_TIMEOUT = 350;

/** @const */
const IOS_SAFARI_BOTTOMBAR_HEIGHT = '10vh';

export class AmpSidebar extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?../../../src/service/viewport/viewport-impl.Viewport} */
    this.viewport_ = null;

    /** @const @private {!../../../src/service/vsync-impl.Vsync} */
    this.vsync_ = Services.vsyncFor(this.win);

    /** @private {?Element} */
    this.maskElement_ = null;

    /** @private @const {!Document} */
    this.document_ = this.win.document;

    /** @private @const {!Element} */
    this.documentElement_ = this.document_.documentElement;

    /** @private {?string} */
    this.side_ = null;

    const platform = Services.platformFor(this.win);

    /** @private @const {boolean} */
    this.isIos_ = platform.isIos();

    /** @private @const {boolean} */
    this.isSafari_ = platform.isSafari();

    /** @private {number} */
    this.historyId_ = -1;

    /** @private {boolean} */
    this.bottomBarCompensated_ = false;

    /** @private @const {!../../../src/service/timer-impl.Timer} */
    this.timer_ = Services.timerFor(this.win);

    /** @private {number|string|null} */
    this.openOrCloseTimeOut_ = null;

    /** @const {function()} */
    this.boundOnAnimationEnd_ =
        debounce(this.win, this.onAnimationEnd_.bind(this), ANIMATION_TIMEOUT);
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.NODISPLAY;
  }

  /** @override */
  buildCallback() {
    this.element.classList.add('i-amphtml-overlay');

    this.side_ = this.element.getAttribute('side');

    this.viewport_ = this.getViewport();

    this.viewport_.addToFixedLayer(this.element, /* forceTransfer */ true);

    if (this.side_ != 'left' && this.side_ != 'right') {
      this.side_ = isRTL(this.document_) ? 'right' : 'left';
      this.element.setAttribute('side', this.side_);
    }

    if (this.isIos_) {
      this.fixIosElasticScrollLeak_();
    }

    if (this.isOpen_()) {
      this.open_();
    } else {
      this.element.setAttribute('aria-hidden', 'true');
    }

    if (!this.element.hasAttribute('role')) {
      this.element.setAttribute('role', 'menu');
    }
    // Make sidebar programmatically focusable and focus on `open` for a11y.
    this.element.tabIndex = -1;

    this.documentElement_.addEventListener('keydown', event => {
      // Close sidebar on ESC.
      if (event.keyCode == KeyCodes.ESCAPE) {
        this.close_();
      }
    });

    // Replacement label for invisible close button set value in amp sidebar
    const ariaLabel = this.element.getAttribute('data-close-button-aria-label')
    || 'Close the sidebar';

    // Invisible close button at the end of sidebar for screen-readers.
    const screenReaderCloseButton = this.document_.createElement('button');

    screenReaderCloseButton.textContent = ariaLabel;
    screenReaderCloseButton.classList.add('i-amphtml-screen-reader');
    // This is for screen-readers only, should not get a tab stop.
    screenReaderCloseButton.tabIndex = -1;
    screenReaderCloseButton.addEventListener('click', () => {
      this.close_();
    });
    this.element.appendChild(screenReaderCloseButton);

    this.registerAction('toggle', this.toggle_.bind(this));
    this.registerAction('open', this.open_.bind(this));
    this.registerAction('close', this.close_.bind(this));
    this.element.addEventListener('click', e => {
      const target = closestByTag(dev().assertElement(e.target), 'A');
      if (target && target.href) {
        const tgtLoc = parseUrl(target.href);
        const currentHref = this.getAmpDoc().win.location.href;
        // Important: Only close sidebar (and hence pop sidebar history entry)
        // when navigating locally, Chrome might cancel navigation request
        // due to after-navigation history manipulation inside a timer callback.
        // See this issue for more details:
        // https://github.com/ampproject/amphtml/issues/6585
        if (removeFragment(target.href) != removeFragment(currentHref)) {
          return;
        }

        if (tgtLoc.hash) {
          this.close_();
        }
      }
    }, true);

    this.element.addEventListener('transitionend', this.boundOnAnimationEnd_);
    this.element.addEventListener('animationend', this.boundOnAnimationEnd_);
  }

  /** @override */
  activate() {
    this.open_();
  }

  /** @override */
  onLayoutMeasure() {
    if (this.isToolbarExperimentEnabled_) {
      // Check our toolbars for changes
      this.toolbars_.forEach(toolbar => {
        toolbar.onLayoutChange(() => this.onToolbarOpen_());
      });
    }
  }

  /**
   * Function called whenever a tollbar is opened.
   * @private
   */
  onToolbarOpen_() {
    this.close_();
  }

  /**
   * Returns true if the sidebar is opened.
   * @returns {boolean}
   * @private
   */
  isOpen_() {
    return this.element.hasAttribute('open');
  }

  /**
   * Toggles the open/close state of the sidebar.
   * @private
   */
  toggle_() {
    if (this.isOpen_()) {
      this.close_();
    } else {
      this.open_();
    }
  }

  /**
   * Reveals the sidebar.
   * @private
   */
  open_() {
    if (this.isOpen_()) {
      return;
    }
    this.viewport_.enterOverlayMode();
    this.vsync_.mutate(() => {
      toggle(this.element, /* display */true);
      if (this.isIos_ && this.isSafari_) {
        this.compensateIosBottombar_();
      }
      this.element./*OK*/scrollTop = 1;
      // Start animation in a separate vsync due to display:block; set above.
      this.vsync_.mutate(() => {
        this.openMask_();
        this.element.setAttribute('open', '');
        this.boundOnAnimationEnd_();
        this.element.setAttribute('aria-hidden', 'false');
      });
    });
    this.getHistory_().push(this.close_.bind(this)).then(historyId => {
      this.historyId_ = historyId;
    });
  }

  /**
   * Hides the sidebar.
   * @private
   */
  close_() {
    if (!this.isOpen_()) {
      return;
    }
    this.viewport_.leaveOverlayMode();
    this.vsync_.mutate(() => {
      this.closeMask_();
      this.element.removeAttribute('open');
      this.boundOnAnimationEnd_();
      this.element.setAttribute('aria-hidden', 'true');
    });
    if (this.historyId_ != -1) {
      this.getHistory_().pop(this.historyId_);
      this.historyId_ = -1;
    }
  }

  /**
   * @private
   */
  openMask_() {
    if (!this.maskElement_) {
      const mask = this.document_.createElement('div');
      mask.classList.add('i-amphtml-sidebar-mask');
      mask.addEventListener('click', () => {
        this.close_();
      });
      this.element.ownerDocument.body.appendChild(mask);
      mask.addEventListener('touchmove', e => {
        e.preventDefault();
      });
      this.maskElement_ = mask;
    }
    toggle(this.maskElement_, /* display */true);
  }

  /**
   * @private
   */
  closeMask_() {
    if (this.maskElement_) {
      toggle(this.maskElement_, /* display */false);
    }
  }

  /**
   * @private
   */
  fixIosElasticScrollLeak_() {
    this.element.addEventListener('scroll', e => {
      if (this.isOpen_()) {
        if (this.element./*OK*/scrollTop < 1) {
          this.element./*OK*/scrollTop = 1;
          e.preventDefault();
        } else if (this.element./*OK*/scrollHeight ==
              this.element./*OK*/scrollTop +
              this.element./*OK*/offsetHeight) {
          this.element./*OK*/scrollTop =
              this.element./*OK*/scrollTop - 1;
          e.preventDefault();
        }
      }
    });
  }

  /**
   * @private
   */
  compensateIosBottombar_() {
    if (!this.bottomBarCompensated_) {
      // Compensate for IOS safari bottom navbar.
      const div = this.document_.createElement('div');
      setStyles(div, {
        'height': IOS_SAFARI_BOTTOMBAR_HEIGHT,
        'width': '100%',
        'background-color': 'transparent',
      });
      this.element.appendChild(div);
      this.bottomBarCompensated_ = true;
    }
  }

  /**
   * @private @return {!../../../src/service/history-impl.History}
   */
  getHistory_() {
    return Services.historyForDoc(this.getAmpDoc());
  }
}

AMP.extension('amp-sidebar', '0.1', AMP => {
  AMP.registerElement('amp-sidebar', AmpSidebar, CSS);
});
