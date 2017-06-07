const Z_INDEX = {
  'SYSTEM': 2,
  'CONTENT': 1,
};

const ATTRIBUTE_NAMES = {
  'ACTIVE': 'active',
  'BOOKEND': 'bookend',
};

const TAG_NAMES = {
  'BOOKEND': 'amp-story-bookend',
  'PAGE': 'amp-story-page',
  'STORY': 'amp-story',
};

const NEXT_SCREEN_AREA_RATIO = 0.75;

const HEADER_HEIGHT = '4.5em';
const PROGRESS_BAR_HEIGHT = '4px';

const DEFAULT_ACCENT_COLOR = '#4285f4';

class AmpStory extends BaseStampElement {
  constructor() {
    super();

    // Export as global for debugging.
    window['story'] = this;
  }

  connectedCallback() {
    super.connectedCallback();

    this.root_ = this.attachShadow({
      mode: 'open'
    });

    this.root_.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css?family=Roboto');

        :host {
          bottom: 0;
          contain: strict;
          font-size: 2.8125vmax; /** 16px at 320x569 */
          left: 0;
          overflow: hidden;
          position: absolute;
          right: 0;
          text-rendering: geometricPrecision !important;
          top: 0;
        }

        #content {
          bottom: 0;
          contain: strict;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
        }

        #content {
          z-index: ${Z_INDEX.CONTENT};
        }

        /** NAVIGATION **/
        #systemLayer {
          background: linear-gradient(to bottom, black, transparent);
          height: ${HEADER_HEIGHT};
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          z-index: ${Z_INDEX.SYSTEM};
        }

        nav {
          align-items: center;
          color: #fff;
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          left: 0;
          padding-top: ${PROGRESS_BAR_HEIGHT};
          position: absolute;
          right: 0;
          top: 0;
        }

        #articleProgress {
          flex-shrink: 0;
          height: ${PROGRESS_BAR_HEIGHT};
          opacity: 1;
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        #articleProgressBar,
        #articleProgressValue {
          background-color: #fff;
          bottom: 0;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
        }

        #articleProgressBar {
          opacity: 0.15;
          z-index: 1;
        }

        #articleProgressValue {
          -webkit-transform: scaleX(0);
          transform: scaleX(0);
          -webkit-transform-origin: left;
          transform-origin: left;
          -webkit-transition: -webkit-transform 0.5s cubic-bezier(0.86, 0, 0.07, 1);
          transition: transform 0.5s cubic-bezier(0.86, 0, 0.07, 1);
          z-index: 2;
        }

        nav button {
          background: transparent;
          border: 0;
          box-sizing: content-box;
          flex-grow: 0;
          flex-shrink: 0;
          font-size: 1.5em;
          height: 1em;
          margin: 0;
          outline: none;
          padding: 0.33em;
          width: 1em;
        }

        nav button > svg {
          height: 100%;
          width: 100%;
        }

        #exitFullscreen {
          display: none;
        }

        :host-context(:fullscreen) #exitFullscreen {
          display: inline-block;
        }

        :host-context(:-webkit-full-screen) #exitFullscreen {
          display: inline-block;
        }

        :host-context(:-moz-full-screen) #exitFullscreen {
          display: inline-block;
        }

        :host-context(:-ms-fullscreen) #exitFullscreen {
          display: inline-block;
        }

        :host-context([bookend]) #exitFullscreen {
          display: none;
        }

        #bookendClose {
          display: none;
        }

        :host-context([bookend]) #bookendClose {
          display: inline-block;
        }

        /** BOOKEND **/
        amp-story-bookend {
          background-color: rgba(0, 0, 0, 0.75);
          bottom: 0;
          contain: strict;
          display: none;
          left: 0;
          overflow-x: hidden;
          overflow-y: auto;
          padding: ${HEADER_HEIGHT} 2em 2em;
          position: absolute;
          text-align: left !important;
          right: 0;
          top: 0;
        }

        :host-context([bookend]) amp-story-bookend {
          display: block;
          z-index: 2;
        }

        .bookend-section {
          margin-top: 2em;
        }

        .bookend-section:first-child {
          margin-top: 0;
        }

        .bookend-section-name {
          border-bottom: 1px solid #aaa;
          color: #aaa;
          font-family: 'Roboto', sans-serif;
          font-size: 0.6875em;
          line-height: 2em;
          letter-spacing: 0.2em;
          margin: 0 0 1.25em;
          text-align: left !important;
          text-transform: uppercase !important;
        }

        .bookend-share-targets {
          align-items: center;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }

        .shareBtn {
          background: transparent;
          border: 0;
          height: 2em;
          font-size: 2.8125vmax;
          flex-grow: 0;
          flex-shrink: 0;
          margin: 1em 0.5em;
          padding: 0;
          width: 2em;
        }

        .shareBtn svg {
          height: 100%;
          width: 100%;
        }

        .bookend-entries {
          margin: 0;
          padding: 0;
        }

        .bookend-entry {
          display: flex;
          flex-direction: row;
          margin-bottom: 1em;
          text-decoration: none;
        }

        .bookend-entry-info {
          flex-grow: 1;
        }

        .bookend-entry-title {
          color: #fff;
          font-family: 'Roboto', sans-serif;
          font-size: 0.8em;
          line-height: 1.5;
          margin: 0 1em 0 0;
        }

        .bookend-entry-domain {
          color: #888;
          font-family: 'Roboto', sans-serif;
          font-size: 0.625em;
          line-height: 1.5;
          margin: 0 1em 0 0;
        }

        .bookend-entry-image-box {
          flex-grow: 0;
          flex-shrink: 0;
          height: 6em;
          position: relative;
          overflow: hidden;
          width: 6em;
        }

        .bookend-entry-image {
          bottom: 0;
          height: 100%;
          left: 0;
          object-fit: cover;
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          z-index: 1;
        }

        .bookend-entry-icon {
          height: 1.25em;
          margin: 0.5em;
          position: absolute;
          right: 0;
          top: 0;
          width: 1.25em;
          z-index: 2;
        }
      </style>

      <aside id="systemLayer">
        <div id="articleProgress">
          <div id="articleProgressBar"></div>
          <div id="articleProgressValue"></div>
        </div>
        <nav>
          <button id="exitFullscreen">
            <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          </button>
          <button id="bookendClose">
            <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              <path d="M0 0h24v24H0z" fill="none"/>
            </svg>
          </button>
        </nav>
      </aside>
      <main id="content">
        <slot></slot>
        <amp-story-bookend>
          <section class="bookend-section">
            <h1 class="bookend-section-name">Share this Story</h1>
            <div class="bookend-share-targets">
              <button class="shareBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path fill="none" d="M0 0h24v24H0V0z"/>
                  <path d="M23 11h-2V9h-2v2h-2v2h2v2h2v-2h2zM8 11v2.4h3.97c-.16 1.03-1.2 3.02-3.97 3.02-2.39 0-4.34-1.98-4.34-4.42S5.61 7.58 8 7.58c1.36 0 2.27.58 2.79 1.08l1.9-1.83C11.47 5.69 9.89 5 8 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.11-1.16H8z"/>
                  <path fill="none" d="M1 5h14v14H1z"/>
                </svg>
              </button>
              <button class="shareBtn">
                <svg width="32" height="27" viewBox="0 0 32 27" xmlns="http://www.w3.org/2000/svg"><title>Group 5</title><g fill="none" fill-rule="evenodd"><path d="M31.117.493c-1.27.77-2.672 1.33-4.172 1.63C25.75.818 24.045 0 22.155 0 18.53 0 15.59 3.014 15.59 6.732c0 .528.058 1.04.17 1.533-5.456-.28-10.293-2.958-13.533-7.036-.565.997-.888 2.154-.888 3.387 0 2.334 1.157 4.395 2.92 5.603-1.075-.033-2.09-.34-2.976-.84v.083c0 3.262 2.263 5.985 5.27 6.6-.55.16-1.132.237-1.73.237-.424 0-.836-.04-1.237-.118.836 2.673 3.26 4.62 6.133 4.672-2.247 1.807-5.08 2.883-8.154 2.883-.53 0-1.053-.03-1.566-.092 2.905 1.907 6.358 3.022 10.063 3.022 12.078 0 18.68-10.256 18.68-19.153 0-.293-.005-.586-.017-.873C30.01 5.69 31.123 4.508 32 3.158c-1.176.535-2.442.897-3.77 1.06 1.356-.833 2.397-2.152 2.887-3.724" fill="#FFF"/><path d="M0-2h32v32H0z"/></g></svg>
              </button>
              <button class="shareBtn">
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Page 1</title><defs><path id="a" d="M31.75 31.75V0H0v31.75z"/></defs><g fill="none" fill-rule="evenodd"><mask id="b" fill="#fff"><use xlink:href="#a"/></mask><path d="M31.75 29.998c0 .968-.784 1.752-1.752 1.752h-8.09V19.455h4.126l.618-4.792h-4.745v-3.06c0-1.386.385-2.332 2.375-2.332h2.538V4.984c-.44-.058-1.945-.188-3.7-.188-3.657 0-6.162 2.233-6.162 6.333v3.533H12.82v4.792h4.138V31.75H1.752C.785 31.75 0 30.966 0 29.998V1.752C0 .784.785 0 1.752 0h28.246c.968 0 1.752.784 1.752 1.752v28.246z" fill="#FFF" mask="url(#b)"/></g></svg>
              </button>
            </div>
            <div class="bookend-share-targets">
              <button class="shareBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
              </button>
              <button class="shareBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                </svg>
              </button>
              <button class="shareBtn filler"></button>
            </div>
          </section>
        </amp-story-bookend>
      </main>`;

    // Initialize instance members.
    this.bookend_ = this.root_.querySelectorAll(TAG_NAMES.BOOKEND)[0];
    this.systemLayer_ = this.root_.getElementById('systemLayer');
    this.btnExitFullscreen_ = this.root_.getElementById('exitFullscreen');
    this.btnCloseBookend_ = this.root_.getElementById('bookendClose');
    this.progressEl_ = this.root_.getElementById('articleProgressValue');
    this.isIos_ = navigator.userAgent ?
        navigator.userAgent.match(/(iphone|ipad)/gi) : false;

    // Initialize story UI.
    this.initializeBookend_();

    if (!this.supportsFullscreen_()) {
      this.btnExitFullscreen_.style.display = 'none';
    }

    const activeScreenIndex = parseInt(window.location.hash.substring(1));
    if (activeScreenIndex >= 0 && activeScreenIndex < this.children.length) {
      this.children[activeScreenIndex].enterViewport();
    } else if (this.children.length > 0) {
      this.children[0].enterViewport();
    } else {
      throw new Error('This story has no pages!');
    }

    // Ensure the page is up-to-date.
    this.updatePage_();

    // Add event listeners.
    this.root_.addEventListener('click', this.onStoryClick_.bind(this), true);
    document.addEventListener('keydown', this.onKeyDown_.bind(this), true);
    this.btnExitFullscreen_
        .addEventListener('click', this.exitFullscreen_.bind(this), true);
    this.btnCloseBookend_
        .addEventListener('click', this.exitBookend_.bind(this), true);
  }

  /**
   * Gets the amp-story-page or amp-story-bookend element that is currently
   * being shown.
   * @return {!Element} The element representing the screen currently being
   *     shown.
   * @private
   */
  getActiveScreen_() {
    const activeScreen = document.querySelectorAll('amp-story-page[active]')[0];

    if (!activeScreen) {
      throw new Error('There is no active screen.');
    }

    return activeScreen;
  }


  /**
   * Initializes the bookend with the content from the related JSON file.
   * @private
   */
  initializeBookend_() {
    if (this.hasAttribute('related-articles')) {
      this.requestRelatedStoriesData_(this.getAttribute('related-articles'))
          .then((responseText) => JSON.parse(responseText))
          .then((responseJson) => this.renderBookendFromJson_(responseJson))
          .then((bookendHtml) => this.bookend_.innerHTML += bookendHtml);
    }
  }


  /**
   * Fetches the related JSON data.
   * @param {string} requestEndpointUrl The URL from which the JSON data may be
   *     fetched.
   * @return {!Promise<string>} A promise which yields the JSON data at the
   *     specified URL, as a string.
   * @private
   */
  requestRelatedStoriesData_(requestEndpointUrl) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('load', () => {
        resolve(xhr.responseText);
      });
      xhr.open('GET', requestEndpointUrl);
      xhr.send();
    });
  }


  /**
   * Gets the favicon URL from a page at a given URL.
   * @param {string} pageUrl The URL of the page whose favicon URL should be
   *     retrieved.
   * @return {?string} The URL to the favicon of the specified page.
   */
  fetchFaviconUrlFromPage_(pageUrl) {
    if (pageUrl.indexOf('a-publisher.com') > 0) {
      return 'media/a-favicon.png';
    } else {
      return null;
    }
  }


  /**
   * Renders the bookend page from the JSON data response.
   * @param {!Object} responseJson The JSON data response.
   * @return {string} The HTML for the bookend.
   * @private
   */
  renderBookendFromJson_(responseJson) {
    let builder = '';
    for (const sectionName in responseJson) {
      const entries = responseJson[sectionName];
      builder += this.renderBookendSectionFromEntries_(sectionName, entries);
    }

    return builder;
  }


  /**
   * Renders a single section of the bookend.
   * @param {string} sectionName The name of the section of the bookend.
   * @param {!Array<!Object>} entries The entries in the section.
   * @return {string} The HTML for this section of the bookend.
   * @private
   */
  renderBookendSectionFromEntries_(sectionName, entries) {
    let builder = `<section class="bookend-section">
        <h1 class="bookend-section-name">${sectionName}</h1>
        <div class="bookend-entries">`;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      builder += this.renderBookendEntryFromJson_(entry);
    }
    builder += '</div></section>\n';
    return builder;
  }


  /**
   * Renders a single entry in the bookend.
   * @param {!Object} entryJson A single entry in the bookend.
   * @return {string} The HTML for this entry of the bookend.
   * @private
   */
  renderBookendEntryFromJson_(entryJson) {
    const iconUrl = this.fetchFaviconUrlFromPage_(entryJson.url);
    const domain = extractRootDomain(entryJson.url);

    const imageBox = (entryJson.image ?
              (`<div class="bookend-entry-image-box">` +
              (iconUrl ?
                  `<img class="bookend-entry-icon" src="${iconUrl}">` :
                  '') +
              `<img class="bookend-entry-image" src="${entryJson.image}">
            </div>`) :
              '');
    return `
        <a href="#${entryJson.url}"
            target="_blank" class="bookend-entry">
          <div class="bookend-entry-info">
            <h2 class="bookend-entry-title">${entryJson.title}</h2>
            <span class="bookend-entry-domain">${domain}</span>
          </div>
          ${imageBox}
        </a>`;
  }


  /**
   * Go back to the previous screen in the story, if there is one.
   * @private
   */
  previous_() {
    const activeScreen = this.getActiveScreen_();

    if (activeScreen.tagName.toLowerCase() === TAG_NAMES.PAGE) {
      if (activeScreen.previousElementSibling) {
        this.enterFullscreen_();
        const newScreen = activeScreen.previousElementSibling;
        newScreen.enterViewport();
        activeScreen.exitViewport();
      } else {
        // No-op; we are on the first page, so there is no previous.
      }
    } else {
      // The active thing wasn't a page... ¯\_(ツ)_/¯
    }

    this.updatePage_();
  }


  /**
   * Advance to the next screen in the story, if there is one.
   * @private
   */
  next_() {
    const activeScreen = this.getActiveScreen_();

    if (activeScreen.tagName.toLowerCase() === TAG_NAMES.PAGE) {
      if (activeScreen.nextElementSibling) {
        const newScreen = activeScreen.nextElementSibling;
        this.enterFullscreen_();
        newScreen.enterViewport()
        activeScreen.exitViewport();
      } else {
        this.launchBookend_();
      }
    } else {
      // The active thing wasn't a bookend or a page... ¯\_(ツ)_/¯
    }

    this.updatePage_();
  }


  /**
   * Request to enter full screen mode.
   * @private
   */
  supportsFullscreen_() {
    if (this.requestFullscreen) {
      return true;
    } else if (this.webkitRequestFullScreen) {
      return true;
    } else if (this.mozRequestFullScreen) {
      return true;
    } else if (this.msRequestFullscreen) {
      return true;
    }

    return false;
  }


  /**
   * Request to enter full screen mode.
   * @private
   */
  enterFullscreen_() {
    if (this.requestFullscreen) {
      this.requestFullscreen();
    } else if (this.webkitRequestFullScreen) {
      this.webkitRequestFullScreen();
    } else if (this.mozRequestFullScreen) {
      this.mozRequestFullScreen();
    } else if (this.msRequestFullscreen) {
      this.msRequestFullscreen();
    } else {
      console.warn('Ignored fullscreen request.');
    }
  }


  /**
   * Request to exit full screen mode.
   * @private
   */
  exitFullscreen_() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else {
      console.warn('Ignored fullscreen request.');
    }
  }


  /**
   * Launches the bookend fullscreen.
   * @private
   */
  launchBookend_() {
    this.setAttribute(ATTRIBUTE_NAMES.BOOKEND, '');
    this.exitFullscreen_();
  }


  /**
   * Exits the bookend.
   * @private
   */
  exitBookend_() {
    this.removeAttribute(ATTRIBUTE_NAMES.BOOKEND);
  }


  /**
   * Handles all clicks within the story.
   * @param {!Event} e The click event.
   * @private
   */
  onStoryClick_(e) {
    if (!this.isNavigationalClick_(e)) {
      return;
    }

    const nextScreenAreaThreshold =
        (1 - NEXT_SCREEN_AREA_RATIO) * window.screen.width;

    if (e.pageX >= nextScreenAreaThreshold) {
      this.next_();
    } else {
      this.previous_();
    }

    e.stopPropagation();
  }


  /**
   * Handles all key presses within the story.
   * @param {!Event} e The keydown event.
   * @private
   */
  onKeyDown_(e) {
    switch(e.which || e.keyCode) {
      case 37: /* LEFT */
        this.previous_();
        break;
      case 39: /* RIGHT */
        this.next_();
        break;
    }
  }


  /**
   * Determines whether a click should be used for navigation.  Navigate should
   * occur unless the click is on the system layer, or on an element that
   * defines on="tap:..."
   * @param {!Event} e The click event.
   * @return {boolean} true, if the click should be used for navigation.
   * @private
   */
  isNavigationalClick_(e) {
    let currentElement = e.target || e.srcElement;

    while (currentElement) {
      if (currentElement === this.systemLayer_) {
        return false;
      } else if (currentElement === this.bookend_) {
        return false;
      } else if (currentElement.hasAttribute('on') &&
          currentElement.getAttribute('on').indexOf('tap:') >= 0) {
        return false;
      } else if (currentElement.tagName.toLowerCase() == 'a' &&
          currentElement.hasAttribute('href')) {
        return false;
      }

      currentElement = currentElement.parentElement;
    }

    return true;
  }


  /**
   * @return {number} The index of the active screen.
   * @private
   */
  getScreenIndex_() {
    const activeScreen = this.getActiveScreen_();
    return Array.prototype.indexOf.call(this.children, activeScreen);
  }


  /**
   * Updates the progress bar, according to what page the user is currently on.
   * @private
   */
  updatePage_() {
    const screenIndex = this.getScreenIndex_();
    const screenCount = (this.childElementCount - 1);
    const scalingFactor = screenIndex / screenCount;

    this.progressEl_.style.webkitTransformStyle = `scaleX(${scalingFactor})`;
    this.progressEl_.style.transform = `scaleX(${scalingFactor})`;

    history.replaceState(null, null, `#${screenIndex}`);

    if (this.isIos_) {
      this.forceRepaint_();
    }
  }


  forceRepaint_() {
    this.style.display = 'none';
    this.offsetHeight;
    this.style.display = '';
  }

  /**
   * @override
   */
  validateChildren() {
    this.assertDescendents([
      'amp-story-page',
    ]);
  }
}
