const KNOWN_CUSTOM_ELEMENTS = new Set([
  'amp-story',
  'amp-story-page',
  'amp-story-fill-layer',
  'amp-story-sequential-layer',
]);

class BaseStampElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.validateChildren();

    for (var i = 0; i < this.children.length; i++) {
      const oldChildEl = this.children[i];
      const newChildEl = this.transformChild(oldChildEl);

      if (newChildEl instanceof HTMLElement && oldChildEl !== newChildEl) {
        this.replaceChild(newChildEl, oldChildEl);
      }
    }
  }

  assertDescendents(legalDescendents) {
    const illegalDescendentSelector = legalDescendents
        .reduce((selector, legalDescendent) => {
          return `${selector}:not(${legalDescendent})`;
        }, '');

    const illegalDescendents = Array.prototype
        .slice.call(this.querySelectorAll(illegalDescendentSelector))
        .filter((el) => {
          if (this.canSkipValidation_(el)) {
            return false;
          }
          return true;
        });

    illegalDescendents.forEach((el) => {
      el.parentElement.removeChild(el);
      console.error('Illegal descendent', el, 'of', this, 'has been removed.');
    });
  }

  canSkipValidation_(el, opt_nested) {
    if (!el) {
      return false;
    } else if (el === this) {
      return false;
    } else if (el.tagName.toLowerCase().startsWith('amp-')) {
      if (opt_nested || !this.isDirectChild_) {
        return true;
      }
    } else if (KNOWN_CUSTOM_ELEMENTS.has(el.tagName.toLowerCase())) {
      return true;
    }

    return this.canSkipValidation_(el.parentElement, true /* opt_nested */);
  }


  isDirectChild_(el) {
    return el.parentElement === this;
  }

  enterViewport() {
    // To be overridden; no-op by default.
  }

  exitViewport() {
    // To be overridden; no-op by default.
  }

  transformChild(childEl) {
    // To be overridden; no-op by default.
  }


  validateChildren() {
    // To be overridden; warn by default.
    console.warn(`${this.constructor.name} does not validate its children.`);
  }
}
