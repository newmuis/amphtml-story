const BACKGROUND_CLASS = 'i-amphtml-story-background'

const HIDDEN_CLASS = 'i-amphtml-story-background-hidden';

export class AmpStoryBackground {
  /**
   * @param {!Element} element
   */
  constructor(element) {
    this.element = element;

    this.container_ = this.element.ownerDocument.createElement('div');
    this.hidden_ = this.createBackground_();
    this.active_ = this.createBackground_();
    this.container_.appendChild(this.hidden_);
    this.hidden_.classList.add(HIDDEN_CLASS);
    // this.container_.appendChild(this.active_);
  }

  /**
   * @return {!Element}
   */
  createBackground_() {
    const bg = this.element.ownerDocument.createElement('div');
    bg.classList.add(BACKGROUND_CLASS);
    return bg;
  }

  /**
   * Attach the backgrounds to the document.
   */
  attach() {
    this.element.insertBefore(this.container_, this.element.firstChild);
  }

  /**
   * Update the background and move the previous background behind the new one.
   * @param {string} newUrl
   */
  setBackground(newUrl) {
    if (newUrl) {
      this.hidden_.style.backgroundImage = `url(${newUrl})`;

      const newHidden = this.active_;
      this.active_ = this.hidden_;
      this.hidden_ = newHidden;
      this.container_.appendChild(this.active_);

      this.hidden_.classList.add(HIDDEN_CLASS);
      this.active_.classList.remove(HIDDEN_CLASS);
    }
  }
}
