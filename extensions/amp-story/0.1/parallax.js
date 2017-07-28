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

import {setStyles} from '../../../src/style';
import {toArray} from '../../../src/types';
import {mapRange, logRange, sum} from '../../../src/utils/math'
import {Animation} from '../../../src/animation';
import * as tr from '../../../src/transition';

const SMOOTHING_PTS = 10;
const ANGLE_RANGE = 20;
const PERSPECTIVE = 100;

/**
 * Installs parallax handlers
 */
export class ParallaxService {
  /**
  * @param {!Window} global
  * @param {Array<Element>} pages
  */
  constructor(global, pages) {
    const doc = global.document;
    this.parallaxElements_ = [];

    /** @private {?number} */
    this.middleX_ = 0;

    /** @private {?number} */
    this.middleY_ = 0;

    /** @private {Array} */
    this.smoothingPointsX_ = [];

    /** @private {Array} */
    this.smoothingPointsY_ = [];


    pages
    .filter(page => !page.hasAttribute('no-parallax-fx'))
    .map(page => {
      // Set the page's perspective
      setStyles(page, {
          perspective: PERSPECTIVE + `px`,
        }
      );
      // Loop through the layers in the page and assign a z-index following
      // DOM order
      let zIndex = 1;
      const layers = this.getLayers(page);
      layers.map(layer => {
        const fxElement = new ParallaxElement(layer, zIndex++, layers.length);
        this.parallaxElements_.push(fxElement);
      });
    });

    listen(global, 'deviceorientation', event => {
          this.parallaxOrientationMutate_(
            event,
            this.parallaxElements_,
            viewport
          )
      }
    );

  }

  /**
   * Discovers and returns all layers inside a page
   * @param {Element} page
   * @return {Array<Element>}
   */
  getLayers(page) {
    return toArray(page.querySelectorAll(`amp-story-grid-layer`));
  }

  /**
   * Update each [amp-fx-parallax] element with the new scroll position.
   * Notify any listeners.
   * @param {Event} event
   * @param {!Array<!ParallaxElement>} elements
   * @param {!./viewport-impl.Viewport} viewport
   * @private
   */
  parallaxOrientationMutate_(event, elements, viewport) {

    // Smooth the gamma value (X-AXIS)
    if (this.smoothingPointsX_.length > SMOOTHING_PTS) {
      this.smoothingPointsX_.shift();
    }
    this.smoothingPointsX_.push(event.gamma);
    const avgX = sum(this.smoothingPointsX_) / SMOOTHING_PTS;
    if (this.smoothingPointsX_.length > SMOOTHING_PTS && this.middleX_ == 0) {
      this.middleX_ = avgX;
    }

    // Smooth the beta value (Y-AXIS)
    if (this.smoothingPointsY_.length > SMOOTHING_PTS) {
      this.smoothingPointsY_.shift();
    }
    this.smoothingPointsY_.push(event.beta);
    const avgY = sum(this.smoothingPointsY_) / SMOOTHING_PTS;
    if (this.smoothingPointsY_.length > SMOOTHING_PTS && this.middleY_ == 0) {
      this.middleY_ = avgY;
    }

    const rangeMin = this.middleX_ - ANGLE_RANGE;
    const rangeMax = this.middleX_ + ANGLE_RANGE;
    const mappedX = mapRange(avgX, rangeMin, rangeMax, -10, 10);
    const mappedY = mapRange(avgY, rangeMin, rangeMax, -10, 10);

    if (this.middleY_ != 0 && this.middleX_ != 0) {
      elements.forEach(element => {
        if (element.shouldUpdate(viewport)) {
          element.update(mappedX, mappedY);
        }
      });
    }
  }


  animateLeave(page) {
    this.parallaxElements_.forEach(layer => {
      layer.animateLeave();
    });
  }
}

/**
 * Encapsulates and tracks an element's linear parallax effect.
 */
export class ParallaxElement {
  /**
   * @param {!Element} element The element to give a parallax effect.
   * @param {number} factor the index of the layer
   * @param {!function(number):string} transform Computes the transform from the position.
   */
  constructor(element, factor, total) {
    /** @private @const {!Element} */
    this.element_ = element;

    /** @private @const {number} */
    this.factor_ = factor;

    /** @private {number} */
    this.offsetX_ = 0;

    /** @private {number} */
    this.offsetY_ = 0;

    /** @private {number} */
    this.total_ = total;

    /** @private {number} */
    this.offsetZ_ = -this.factor_ * (PERSPECTIVE/this.total_);

    /** @private {number} */
    this.scaleFactor_ = 1.1 + (this.offsetZ_ * -1) / PERSPECTIVE;
  }


  /**
   * Apply the parallax effect to the offset given how much the page
   * has moved since the last frame.
   * @param {number} x The movement of the layer in the x axis
   * @param {number} y The movement of the layer in the y axis
   */
  update(x = 0, y = 0) {
    this.offsetX_ = logRange(this.scaleFactor_, this.total_, x * this.factor_);
    this.offsetY_ = logRange(this.scaleFactor_, this.total_, y * this.factor_);

    const translateZ = `translateZ(${this.offsetZ_.toFixed(2)}px) `;
    const scale = `scale(${this.scaleFactor_}) `;
    const translateX = `translateX(${this.offsetX_.toFixed(2)}px) `;
    const translateY = `translateY(${this.offsetY_.toFixed(2)}px)`;

    setStyles(this.element_, {
        transform: translateZ + scale + translateX + translateY,
      }
    );
  }

  /**
   * True if the element is in the viewport.
   * @param {!./viewport-impl.Viewport} viewport
   * @return {boolean}
   */
  shouldUpdate(viewport) {
    const viewportRect = viewport.getRect();
    const elementRect = viewport.getLayoutRect(this.element_);
    elementRect.top -= viewportRect.top;
    elementRect.bottom = elementRect.top + elementRect.height;
    return this.isRectInView_(elementRect, viewportRect.height);
  }

  /**
   * Check if a rectange is within the viewport.
   * @param {!../layout-rect.LayoutRectDef} rect
   * @param {number} viewportHeight
   * @private
   */
  isRectInView_(rect, viewportHeight) {
    return rect.bottom >= 0 && rect.top <= viewportHeight;
  }

  animateLeave() {
    Animation.animate(this.element_,
    tr.setStyles(this.element_, {
      transform: tr.concat([
        tr.translateZ(tr.numeric(this.offsetZ_.toFixed(2), this.offsetZ_.toFixed(2))),
        tr.scale(tr.numeric(this.scaleFactor_, this.scaleFactor_)),
        tr.translateX(tr.numeric(0, -200))
      ]),
    }),
    2000, 'ease-out').thenAlways(() => {

    });
    console.log({
      transform: tr.concat([
        tr.translateZ(tr.numeric(this.offsetZ_.toFixed(2), this.offsetZ_.toFixed(2))),
        tr.scale(tr.numeric(this.scaleFactor_, this.scaleFactor_)),
        tr.translateX(tr.numeric(0, -200))
      ]),
    });
  }
}

export function installParallaxHandler(win, pages) {
  return new ParallaxService(win, pages);
}
