class AmpStoryFillLayer extends AmpStoryBaseLayer {
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
          bottom: 0;
          box-sizing: border-box;
          contain: strict;
          left: 0;
          overflow: hidden;
          position: absolute;
          right: 0;
          top: 0;
        }

        ::slotted(*) {
          border: 0;
          display: block;
          margin: 0;
          padding: 0;
        }
      </style>

      <slot></slot>`;
  }

  validateChildren() {
    this.assertDescendents([
      'amp-anim',
      'amp-img',
      'amp-video',
    ]);

    if (this.children.length > 1) {
      console.error('amp-story-fill-layer can only have 1 child, but has ' +
          this.children.length + '.  Excess children have been removed.');

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
