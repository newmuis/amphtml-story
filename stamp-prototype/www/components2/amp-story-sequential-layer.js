class AmpStorySequentialLayer extends AmpStoryBaseLayer {
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
          box-sizing: border-box;
          contain: content;
          font-size: inherit;
          left: 0;
          overflow: hidden;
          padding: 2em;
          position: absolute;
          right: 0;
        }

        :host([anchor="top"]) {
          bottom: auto;
          top: 0;
        }

        :host([anchor="top"]) ::slotted(.i-text:first-child) {
          margin-top: 2.5rem !important;
        }

        :host,
        :host([anchor="bottom"]) {
          bottom: 0;
          top: auto;
        }

        ::slotted(*) {
          border: 0;
          display: block;
          margin-bottom: 0.5rem !important;
          padding: 0 !important;
        }

        ::slotted(:last-child) {
          margin-bottom: 0 !important;
        }
      </style>

      <slot></slot>`;
  }

  validateChildren() {
    this.assertDescendents([
      'blockquote',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'strong',
      'amp-anim',
      'amp-audio',
      'amp-gfycat',
      'amp-img',
      'amp-instagram',
      'amp-soundcloud',
      'amp-twitter',
    ]);
  }
}
