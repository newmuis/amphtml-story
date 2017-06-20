class AmpStoryGridLayer extends AmpStoryBaseLayer {
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
          bottom: 0 !important;
          display: grid !important;
          left: 0 !important;
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          padding-top: 2em;
        }

        ::slotted(*) {
          box-sizing: border-box !important;
          margin: 0 !important;
        }

        :host([preset="fill"]) ::slotted(:not(:first-child)) {
          display: none !important;
        }

        :host([preset="fill"]) ::slotted(:first-child) {
          bottom: 0 !important;
          display: block !important;
          height: auto !important;
          left: 0 !important;
          position: absolute !important;
          right: 0 !important;
          top: 0 !important;
          width: auto !important;
        }

        :host([preset="vertical"]) {
          align-content: start;
          grid-auto-flow: row !important;
          grid-template-columns: auto !important;
          justify-content: start;
        }

        :host([preset="horizontal"]) {
          align-content: center;
          grid-auto-flow: column !important;
          grid-template-rows: auto !important;
          justify-content: start;
        }

        :host([preset="thirds"]) {
          grid-template-rows: repeat(3, auto) !important;
          grid-template-areas: "upper-third"
                               "middle-third"
                               "lower-third" !important;
        }
      </style>

      <slot></slot>`;
  }

  validateChildren() {
    if (this.getAttribute('preset') === 'fill') {
      if (this.children.length > 1) {
        console.error('amp-story-grid-layer[preset="fill"] can only have 1 ' +
            'child, but has ' + this.children.length + '.  Excess children ' +
            'have been removed.');

        for (let i = 1; i < this.children.length; i++) {
          this.removeChild(this.children[i]);
        }
      }

      const child = this.children[0];
      if (!child) {
        return;
      }

      child.setAttribute('layout', 'fill');
    }
  }
}
