const ACTIVE = 'active';

class AmpStoryPage extends BaseStampElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    this.root_ = this.attachShadow({
      mode: 'open'
    });

    this.root_.innerHTML = `
      <style>
        :host {
          contain: strict;
          height: 100%;
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        :host,
        :host([theme="dark"]) {
          background-color: #222;
          color: #fff;
        }

        :host([theme="light"]) {
          background-color: #f0f0f0;
          color: #000;
        }
      </style>

      <slot></slot>`;

    this.setAttribute('index',
        Array.prototype.indexOf.call(this.parentElement.children, this));
  }

  getVideos_() {
    return Array.prototype.slice.call(this.querySelectorAll('video'));
  }

  playVideos_() {
    this.getVideos_().forEach((video) => {
      video.play();
    });
  }

  pauseVideos_() {
    this.getVideos_().forEach((video) => {
      video.pause();
    });
  }

  enterViewport() {
    this.setAttribute(ACTIVE, '');
    this.playVideos_();
  }

  exitViewport() {
    this.removeAttribute(ACTIVE);
    this.pauseVideos_();
  }

  validateChildren() {
    this.assertDescendents([
      'amp-story-fill-layer',
      'amp-story-sequential-layer',
    ]);
  }
}
