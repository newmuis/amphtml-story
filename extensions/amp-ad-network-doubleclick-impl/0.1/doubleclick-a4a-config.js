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

// Because AdSense and DoubleClick are both operated by Google and their A4A
// implementations share some behavior in common, part of the logic for this
// implementation is located in the ads/google/a4a directory rather than here.
// Most other ad networks will want to put their A4A code entirely in the
// extensions/amp-ad-network-${NETWORK_NAME}-impl directory.

import {
  MANUAL_EXPERIMENT_ID,
  extractUrlExperimentId,
  addExperimentIdToElement,
} from '../../../ads/google/a4a/traffic-experiments';
import {supportsNativeCrypto} from '../../../ads/google/a4a/utils';
import {
  /* eslint no-unused-vars: 0 */ ExperimentInfo,
  getExperimentBranch,
  forceExperimentBranch,
  randomlySelectUnsetExperiments,
} from '../../../src/experiments';
import {getMode} from '../../../src/mode';
import {dev} from '../../../src/log';

/** @const {string} */
export const DOUBLECLICK_A4A_EXPERIMENT_NAME = 'expDoubleclickA4A';

/** @const {string} */
export const DFP_CANONICAL_FF_EXPERIMENT_NAME = 'expDfpCanonicalFf';

/** @type {string} */
const TAG = 'amp-ad-network-doubleclick-impl';

/** @const @enum{string} */
export const DOUBLECLICK_EXPERIMENT_FEATURE = {
  HOLDBACK_EXTERNAL_CONTROL: '21060726',
  HOLDBACK_EXTERNAL: '21060727',
  DELAYED_REQUEST_CONTROL: '21060728',
  DELAYED_REQUEST: '21060729',
  SFG_CONTROL_ID: '21060730',
  SFG_EXP_ID: '21060731',
  SRA_CONTROL: '117152666',
  SRA: '117152667',
  HOLDBACK_INTERNAL_CONTROL: '2092613',
  HOLDBACK_INTERNAL: '2092614',
  CANONICAL_CONTROL: '21060932',
  CANONICAL_EXPERIMENT: '21060933',
  CACHE_EXTENSION_INJECTION_CONTROL: '21060955',
  CACHE_EXTENSION_INJECTION_EXP: '21060956',
};

/** @const @type {!Object<string,?string>} */
export const URL_EXPERIMENT_MAPPING = {
  '-1': MANUAL_EXPERIMENT_ID,
  '0': null,
  // Holdback
  '1': DOUBLECLICK_EXPERIMENT_FEATURE.HOLDBACK_EXTERNAL_CONTROL,
  '2': DOUBLECLICK_EXPERIMENT_FEATURE.HOLDBACK_EXTERNAL,
  // Delay Request
  '3': DOUBLECLICK_EXPERIMENT_FEATURE.DELAYED_REQUEST_CONTROL,
  '4': DOUBLECLICK_EXPERIMENT_FEATURE.DELAYED_REQUEST,
  // SFG
  '5': DOUBLECLICK_EXPERIMENT_FEATURE.SFG_CONTROL_ID,
  '6': DOUBLECLICK_EXPERIMENT_FEATURE.SFG_EXP_ID,
  // SRA
  '7': DOUBLECLICK_EXPERIMENT_FEATURE.SRA_CONTROL,
  '8': DOUBLECLICK_EXPERIMENT_FEATURE.SRA,
  // AMP Cache extension injection
  '9': DOUBLECLICK_EXPERIMENT_FEATURE.CACHE_EXTENSION_INJECTION_CONTROL,
  '10': DOUBLECLICK_EXPERIMENT_FEATURE.CACHE_EXTENSION_INJECTION_EXP,
};

/** @const {string} */
export const BETA_ATTRIBUTE = 'data-use-beta-a4a-implementation';

/** @const {string} */
export const BETA_EXPERIMENT_ID = '2077831';

/**
 * Class for checking whether a page/element is eligible for Fast Fetch.
 * Singleton class.
 * @visibleForTesting
 */
export class DoubleclickA4aEligibility {
  /**
   * Returns whether win supports native crypto. Is just a wrapper around
   * supportsNativeCrypto, but this way we can mock out for testing.
   * @param {!Window} win
   * @return {boolean}
   */
  supportsCrypto(win) {
    return supportsNativeCrypto(win);
  }

/**
 * @const {!../../../ads/google/a4a/traffic-experiments.A4aExperimentBranches}
 */
export const DOUBLECLICK_SFG_INTERNAL_EXPERIMENT_BRANCHES = {
  control: '21060540',
  experiment: '21060541',
};

export const BETA_ATTRIBUTE = 'data-use-beta-a4a-implementation';

/**
 * @param {!Window} win
 * @param {!Element} element
 * @returns {boolean}
 */
export function doubleclickIsA4AEnabled(win, element) {
  if (element.hasAttribute('useSameDomainRenderingUntilDeprecated')) {
    return false;
  }
  const a4aRequested = element.hasAttribute(BETA_ATTRIBUTE);
  // Note: Under this logic, a4aRequested shortcuts googleAdsIsA4AEnabled and,
  // therefore, carves out of the experiment branches.  Any publisher using this
  // attribute will be excluded from the experiment altogether.
  // TODO(tdrl): The "is this site eligible" logic has gotten scattered around
  // and is now duplicated.  It should be cleaned up and factored into a single,
  // shared location.
  let externalBranches, internalBranches;
  if (isExperimentOn(win, 'a4aFastFetchDoubleclickLaunched')) {
    externalBranches = DOUBLECLICK_A4A_EXTERNAL_EXPERIMENT_BRANCHES_POST_LAUNCH;
    internalBranches = DOUBLECLICK_A4A_INTERNAL_EXPERIMENT_BRANCHES_POST_LAUNCH;
  } else {
    externalBranches = DOUBLECLICK_A4A_EXTERNAL_EXPERIMENT_BRANCHES_PRE_LAUNCH;
    internalBranches = DOUBLECLICK_A4A_INTERNAL_EXPERIMENT_BRANCHES_PRE_LAUNCH;
  }
  const enableA4A = googleAdsIsA4AEnabled(
          win, element, DOUBLECLICK_A4A_EXPERIMENT_NAME,
          externalBranches, internalBranches,
          DOUBLECLICK_A4A_EXTERNAL_DELAYED_EXPERIMENT_BRANCHES_PRE_LAUNCH,
          DOUBLECLICK_SFG_INTERNAL_EXPERIMENT_BRANCHES) ||
      (a4aRequested && (isProxyOrigin(win.location) ||
       getMode(win).localDev || getMode(win).test));
  if (enableA4A && a4aRequested && !isInManualExperiment(element)) {
    element.setAttribute(EXPERIMENT_ATTRIBUTE,
        DOUBLECLICK_A4A_BETA_BRANCHES.experiment);
  }
  return enableA4A;
}
