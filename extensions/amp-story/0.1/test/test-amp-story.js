import {AmpStory} from '../amp-story';
import {
  stubFullScreenForTesting,
  resetFullScreenForTesting,
} from '../fullscreen';


const NOOP = () => {};


describes.realWin('amp-story', {
  amp: {
    extensions: ['amp-story'],
  }
}, env => {

  let win;
  let element;

  function stubEmptyActivePage() {
    sandbox./*OK*/stub(element.implementation_, 'getActivePage_',
        () => document.createElement('amp-story-page'));
  }

  function stubBookend(bookend) {
    sandbox./*OK*/stub(element.implementation_, 'bookend_', bookend);
  }

  beforeEach(() => {
    win = env.win;
    element = win.document.createElement('amp-story');
    win.document.body.appendChild(element);
  });

  afterEach(() => {
    resetFullScreenForTesting();
    sandbox.restore();
  });

  it('should build', () => {
    element.build();
  });

  it('should enter fullscreen when switching pages', () => {
    const requestFullScreen = sandbox.spy();

    stubEmptyActivePage();
    stubFullScreenForTesting(/* isSupported */ true, requestFullScreen, NOOP);

    element.implementation_.switchTo_(win.document.createElement('div'));

    expect(requestFullScreen).to.be.calledOnce;
  });

  it('should exit fullscreen when switching to the bookend page', () => {
    const exitFullScreen = sandbox.spy();

    const bookend = win.document.createElement('section');

    stubEmptyActivePage();
    stubBookend(bookend);
    stubFullScreenForTesting(/* isSupported */ true, NOOP, exitFullScreen);

    element.implementation_.switchTo_(bookend);

    expect(exitFullScreen).to.be.calledOnce;
  });
});
