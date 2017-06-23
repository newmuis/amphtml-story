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
import {DEMO_PLACEHOLDER_DATA} from './placeholder-data';
import {ICONS} from './icons';
import {EventType, dispatch} from './events';
import {dev} from '../../../src/log';
import {scale, setStyles} from '../../../src/style';
import {vsyncFor} from '../../../src/services';


// TODO(alanorozco): Use a precompiled template for performance
const TEMPLATE =
    `<h3 class="i-amp-story-bookend-heading">Share the story</h3>
    <ul class="i-amp-story-bookend-share">
      <li>
        <div class="i-amp-story-bookend-share-icon">
          ${ICONS.googleplus}
        </div>
      </li>
      <li>
        <div class="i-amp-story-bookend-share-icon">
          ${ICONS.mail}
        </div>
      </li>
      <li>
        <div class="i-amp-story-bookend-share-icon">
          ${ICONS.link}
        </div>
      </li>
    </ul>
    <h3 class="i-amp-story-bookend-heading">More to read</h3>
    <div class="i-amp-story-bookend-more-articles"></div>`;


function articleHtml(articleData) {
  // TODO(alanorozco): Consider using amp-img and what we need to get it working
  const imgHtml = articleData.image ? (
      `<div class="i-amp-story-bookend-article-image">
        <img src="${articleData.image.url}"
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
        ${articleData.domainName} - ${articleData.readingTimeMins} mins
      </div>`
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

    /** @private {?Element} */
    this.moreArticlesContainer_ = null;
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

    this.moreArticlesContainer_ =
        this.root_.querySelector('.i-amp-story-bookend-more-articles');

    DEMO_PLACEHOLDER_DATA.articles.forEach(articleSet =>
        this.moreArticlesContainer_.appendChild(
            this.buildArticleSet_(articleSet)));

    return this.getRoot();
  }

  /**
   * @retun {boolean}
   */
  isBuilt() {
    return this.isBuilt_;
  }

  /**
   * @param {!Array<Object>} articleSet
   * @return {!Element}
   */
  // TODO(alanorozco): typing and format
  buildArticleSet_(articleSet) {
    const container = this.win_.document.createElement('div');
    container.classList.add('i-amp-story-bookend-article-set');
    articleSet.forEach(articleData =>
        container.appendChild(this.buildArticle_(articleData)));
    return container;
  }

  /**
   * @param {!Object} articleData
   * @return {!Element}
   */
  // TODO(alanorozco): typing and format
  buildArticle_(articleData) {
    const article = this.win_.document.createElement('article');
    article./*OK*/innerHTML = articleHtml(articleData);
    return article;
  }

  /**
   * @return {!Element}
   */
  getRoot() {
    dev().assert(this.isBuilt_, 'Component has not been built');
    return dev().assertElement(this.root_);
  }
}
