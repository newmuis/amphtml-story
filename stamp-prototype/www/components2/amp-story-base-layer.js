class AmpStoryBaseLayer extends BaseStampElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  copyAttribute_(attributeName, srcEl, destEl) {
    if (srcEl.hasAttribute(attributeName)) {
      destEl.setAttribute(attributeName, srcEl.getAttribute(attributeName));
    }
  }

  transformChild(childEl) {
    const childTagName = childEl.tagName.toLowerCase();

    switch(childTagName) {
      case 'blockquote':
      case 'em':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      case 'p':
      case 'strong':
        childEl.classList.add('i-text');
        break;

      case 'amp-img':
        const imgEl = document.createElement('img');
        this.copyAttribute_('src', childEl, imgEl);
        this.copyAttribute_('layout', childEl, imgEl);
        return imgEl;

      case 'amp-video':
        const wrapperEl = document.createElement('stamp-video');
        const videoEl = document.createElement('video');

        this.copyAttribute_('src', childEl, videoEl);
        this.copyAttribute_('layout', childEl, wrapperEl);

        videoEl.setAttribute('muted', 'true');
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('loop', '');

        wrapperEl.appendChild(videoEl);
        return wrapperEl;
    }
  }
}
