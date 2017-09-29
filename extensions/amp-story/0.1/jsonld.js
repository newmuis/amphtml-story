import {isJsonLdScriptTag} from '../../../src/dom';
import {tryParseJson} from '../../../src/json';
import {user} from '../../../src/log';

const TAG = 'getJsonLd';

export function getJsonLd(root) {
  const scriptTag = root.querySelector('script[type="application/ld+json"]');

  if (!scriptTag || !isJsonLdScriptTag(scriptTag)) {
    return;
  }

  return tryParseJson(scriptTag.textContent, e => {
    user().error(TAG, 'Failed to parse ld+json. Is it valid JSON?', e);
  });
}
