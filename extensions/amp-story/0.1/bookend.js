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
import {ICONS} from './icons';
import {EventType, dispatch} from './events';
import {Services} from '../../../src/services';
import {createElementWithAttributes, escapeHtml} from '../../../src/dom';
import {dev, user} from '../../../src/log';
import {dict} from './../../../src/utils/object';
import {isObject} from '../../../src/types';
import {scale, setStyles} from '../../../src/style';
import {vsyncFor} from '../../../src/services';


/**
 * @typedef {{
 *   shareProviders: !JsonObject|undefined,
 *   relatedArticles: !Array<!./related-articles.RelatedArticleSet>
 * }}
 */
export let BookendConfig;


/**
 * Maps share provider type to visible name.
 * If the name only needs to be capitalized (e.g. `facebook` to `Facebook`) it
 * does not need to be included here.
 * @const {!JsonObject}
 */
const SHARE_PROVIDER_NAME = dict({
  'gplus': 'Google+',
  'linkedin': 'LinkedIn',
  'whatsapp': 'WhatsApp',
});


// TODO(alanorozco): Use a precompiled template for performance
const TEMPLATE =
    `<amp-carousel class="i-amp-story-share-carousel"
        height="98"
        layout="fixed-height"
        type="carousel">
      <ul class="i-amp-story-share-list">
        <li>
          <div class="i-amp-story-share-icon">
            ${ICONS.link}
          </div>
          <span class="i-amp-story-share-name">Get link</span>
        </li>
      </ul>
    </amp-carousel>`;


/**
 * @param {!./related-articles.RelatedArticle} articleData
 * @return {!string}
 */
// TODO(alanorozco): link
// TODO(alanorozco): reading time
// TODO(alanorozco): domain name
function articleHtml(articleData) {
  // TODO(alanorozco): Consider using amp-img and what we need to get it working
  const imgHtml = articleData.image ? (
      `<div class="i-amp-story-bookend-article-image">
        <img src="${articleData.image}"
            width="116"
            height="116">
        </img>
      </div>`
  ) : '';

  return (
      `${imgHtml}
      <h2 class="i-amp-story-bookend-article-heading">
        ${articleData.title}
      </h2>
      <div class="i-amp-story-bookend-article-meta">
        example.com - 10 mins
      </div>`
  );
}


/**
 * @param {string} type
 * @param {!JsonObject=} opt_params
 * @return {string}
 */
// TODO(alanorozco): article metadata
function shareProviderHtml(type, opt_params) {
  const params = !opt_params ? '' :
      Object.keys(opt_params)
          .map(field => `data-param-${field}="${opt_params[field]}"`)
          .join(' ');

  const name = SHARE_PROVIDER_NAME[type] || type;

  // `email` should have an icon different than the default in amp-social-share,
  // so it is special-cased
  const icon = type == 'email' ? ICONS.mail : '';

  return (
      `<amp-social-share
          type="${type}"
          width="48"
          height="48"
          class="i-amp-story-share-icon"
          ${params}>
          ${icon}
      </amp-social-share>
      <span class="i-amp-story-share-name">${name}</span>`
  );
}


/**
 * Bookend component for <amp-story>.
 */
export class Bookend {
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
  }

  /**
   * @return {!Element}
   */
  build() {
    if (this.isBuilt_) {
      return this.getRoot();
    }

    this.isBuilt_ = true;

    this.root_ = this.win_.document.createElement('section');
    this.root_.classList.add('i-amp-story-bookend');
    this.root_./*OK*/innerHTML = TEMPLATE;

    this.loadRequiredExtensions_();

    return this.getRoot();
  }

  /** @private */
  loadRequiredExtensions_() {
    Services.extensionsFor(this.win_).loadExtension('amp-carousel');
  }

  /**
   * @retun {boolean}
   */
  isBuilt() {
    return this.isBuilt_;
  }

  /** @private */
  assertBuilt_() {
    dev().assert(this.isBuilt(), 'Bookend component needs to be built.');
  }

  /**
   * @param {!BookendConfig} bookendConfig
   */
  setConfig(bookendConfig) {
    this.assertBuilt_();

    if (bookendConfig.shareProviders) {
      Services.extensionsFor(this.win_).loadExtension('amp-social-share');
      this.setShareProviders_(dev().assert(bookendConfig.shareProviders));
    }

    this.maybeInsertNativeShare_();

    this.setRelatedArticles_(bookendConfig.relatedArticles);
  }

  /** @private */
  maybeInsertNativeShare_() {
    // TODO(alanorozco): Implement
  }

  /**
   * @param {!Array<!JsonObject>} shareProviders
   * @private
   */
  // TODO(alanorozco): Set story metadata in share config
  setShareProviders_(shareProviders) {
    const fragment = this.win_.document.createDocumentFragment();

    Object.keys(shareProviders).forEach(type => {
      if (isObject(shareProviders[type])) {
        fragment.appendChild(
            this.buildShareProvider_(type,
                /** @type {!JsonObject} */ (shareProviders[type])));
        return;
      }

      // Bookend config API requires real boolean, not just truthy
      if (shareProviders[type] === true) {
        fragment.appendChild(this.buildShareProvider_(type));
        return;
      }

      user().warn(
          'Invalid amp-story bookend share configuration for %s. ' +
          'Value must be `true` or a params object.',
          type);
    });

    this.insertShareItem_(fragment);
  }

  /**
   * @param {string} type
   * @param {!JsonObject=} opt_params
   * @return {!Element}
   * @private
   */
  buildShareProvider_(type, opt_params) {
    return this.buildShareItem_(shareProviderHtml(type, opt_params));
  }

  /**
   * @param {string} html
   * @return {!Element}
   * @private
   */
  buildShareItem_(html) {
    const el = this.win_.document.createElement('li');
    el./*OK*/innerHTML = html;
    return el;
  }

  /**
   * @param {!Node} node
   * @private
   */
  insertShareItem_(node) {
    dev().assert(this.getRoot().querySelector('.i-amp-story-share-list'))
        .appendChild(node);
  }

  /**
   * @param {!Array<!./related-articles.RelatedArticleSet>} articleSets
   * @private
   */
  setRelatedArticles_(articleSets) {
    const fragment = this.win_.document.createDocumentFragment();

    articleSets.forEach(articleSet =>
        fragment.appendChild(this.buildArticleSet_(articleSet)));

    this.getRoot().appendChild(fragment);
  }

  /**
   * @param {!./related-articles.RelatedArticleSet} articleSet
   * @return {!DocumentFragment}
   */
  // TODO(alanorozco): typing and format
  buildArticleSet_(articleSet) {
    const fragment = this.win_.document.createDocumentFragment();

    if (articleSet.heading) {
      fragment.appendChild(
          this.buildArticleSetHeading_(articleSet.heading));
    }

    fragment.appendChild(this.buildArticleList_(articleSet.articles));

    return fragment;
  }

  /**
   * @param {!Array<!./related-articles.RelatedArticle>} articleList
   * @return {!Element}
   * @private
   */
  buildArticleList_(articleList) {
    const container = createElementWithAttributes(this.win_.document, 'div', {
      'class': 'i-amp-story-bookend-article-set',
    });
    articleList.forEach(article =>
        container.appendChild(this.buildArticle_(article)));
    return container;
  }

  /**
   * @param {!string} heading
   * @return {!Element}
   */
  buildArticleSetHeading_(heading) {
    const headingEl = createElementWithAttributes(this.win_.document, 'h3', {
      'class': 'i-amp-story-bookend-heading',
    });
    headingEl.innerText = escapeHtml(heading);
    return headingEl;
  }

  /**
   * @param {!./related-articles.RelatedArticle} article
   * @return {!Element}
   */
  // TODO(alanorozco): typing and format
  buildArticle_(article) {
    const el = this.win_.document.createElement('article');
    el./*OK*/innerHTML = articleHtml(article);
    return el;
  }

  /**
   * @return {!Element}
   */
  getRoot() {
    this.assertBuilt_();
    return dev().assertElement(this.root_);
  }
}
