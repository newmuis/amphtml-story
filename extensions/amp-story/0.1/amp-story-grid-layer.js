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
 * <amp-story-grid-layer>
 * </amp-story-grid-layer>
 * </code>
 */

import {Layout} from '../../../src/layout';

/**
 * A mapping of attribute names we support for grid layers to the CSS Grid
 * properties they control.
 * @private @const {!Object<string, string>}
 */
const SUPPORTED_CSS_GRID_ATTRIBUTES = {
  'align-content': 'alignContent',
  'align-items': 'alignItems',
  'align-self': 'alignSelf',
  'grid-area': 'gridArea',
  'justify-content': 'justifyContent',
  'justify-items': 'justifyItems',
  'justify-self': 'justifySelf',
};

/**
 * Converts the keys of the SUPPORTED_CSS_GRID_ATTRIBUTES object above into a
 * selector for the specified attributes.
 * (e.g. [align-content], [align-items], ...)
 * @private @const {string}
 */
const SUPPORTED_CSS_GRID_ATTRIBUTES_SELECTOR =
    Object.keys(SUPPORTED_CSS_GRID_ATTRIBUTES)
    .map(key => `[${key}]`)
    .join(',');

export class AmpStoryGridLayer extends AMP.BaseElement {
  buildCallback() {
    const elementsToUpgradeStyles = this.element
        .querySelectorAll(SUPPORTED_CSS_GRID_ATTRIBUTES_SELECTOR);

    for (const element of elementsToUpgradeStyles) {
      this.setCssGridStyles_(element);
    }
  }

  /**
   * Copies the values of an element's attributes to its styles, if the
   * attributes/properties are in the whitelist.
   *
   * @param {!Element} element The element whose styles should be copied from
   *     its attributes.
   */
  setCssGridStyles_(element) {
    for (let i = element.attributes.length - 1; i >= 0; i--) {
      const attribute = element.attributes[i];
      const attributeName = attribute.name.toLowerCase();
      const propertyName = SUPPORTED_CSS_GRID_ATTRIBUTES[attributeName];
      if (propertyName) {
        element.style[propertyName] = attribute.value;
        element.removeAttribute(attributeName);
      }
    }
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }
}

AMP.registerElement('amp-story-grid-layer', AmpStoryGridLayer);
