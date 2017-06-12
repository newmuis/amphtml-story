import {AmpStory} from '../amp-story';
import {EventType} from '../events';
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

  function createPages(container, count) {
    return Array(count).fill(undefined).map(() => {
      const page = win.document.createElement('amp-story-page');
      container.appendChild(page);
      return page;
    });
  }

  beforeEach(() => {
    win = env.win;
    element = win.document.createElement('amp-story');
    win.document.body.appendChild(element);
  });

  afterEach(() => {
    resetFullScreenForTesting();
    sandbox.restore();
    element.remove();
  });

  it('should build', () => {
    const systemLayerRootMock = {};

    const systemLayerBuild =
        sandbox.stub(element.implementation_.systemLayer_, 'build')
            .returns(systemLayerRootMock);

    const appendChild = sandbox.stub(element, 'appendChild', NOOP);

    element.build();

    expect(appendChild).to.have.been.calledWithExactly(systemLayerRootMock);
  });

  it('should enter fullscreen when switching pages', () => {
    const requestFullScreen = sandbox.spy();
    const systemLayerSetInFullScreen = sandbox.stub(
        element.implementation_.systemLayer_, 'setInFullScreen', NOOP);

    stubEmptyActivePage();
    stubFullScreenForTesting(/* isSupported */ true, requestFullScreen, NOOP);

    element.implementation_.switchTo_(win.document.createElement('div'));

    expect(requestFullScreen).to.be.calledOnce;
    expect(systemLayerSetInFullScreen)
        .to.have.been.calledWith(/* inFullScreen */ true);
  });

  it('should not enter fullscreen when switching if auto is disabled', () => {
    const requestFullScreen = sandbox.spy();

    const enterFullScreen = sandbox.stub(
        element.implementation_, 'enterFullScreen_', NOOP);

    stubEmptyActivePage();

    element.implementation_.setAutoFullScreen(false);
    element.implementation_.switchTo_(win.document.createElement('div'));

    expect(enterFullScreen).to.not.have.been.called;
  });

  it('should exit fullscreen when switching to the bookend page', () => {
    const exitFullScreen = sandbox.spy();
    const systemLayerSetInFullScreen = sandbox.stub(
        element.implementation_.systemLayer_, 'setInFullScreen', NOOP);

    const bookend = win.document.createElement('section');

    stubEmptyActivePage();
    stubBookend(bookend);
    stubFullScreenForTesting(/* isSupported */ true, NOOP, exitFullScreen);

    element.implementation_.switchTo_(bookend);

    expect(exitFullScreen).to.be.calledOnce;
    expect(systemLayerSetInFullScreen)
        .to.have.been.calledWith(/* inFullScreen */ false);
  });

  it('should disable auto fullscreen when exiting explicitly', () => {
    const setAutoFullScreenSpy = sandbox.spy(
        element.implementation_, 'setAutoFullScreen');

    stubFullScreenForTesting(/* isSupported */ true, NOOP, NOOP);

    element.implementation_.exitFullScreen_(/* opt_explicitUserAction */ true);

    expect(setAutoFullScreenSpy)
        .to.have.been.calledWith(/* isEnabled */ false);
  });

  it('should exit fullscreen when EXIT_FULLSCREEN is triggered', () => {
    const exitFullScreenStub = sandbox.stub(
        element.implementation_, 'exitFullScreen_', NOOP);

    element.build();

    element.dispatchEvent(new Event(EventType.EXIT_FULLSCREEN));

    expect(exitFullScreenStub)
        .to.have.been.calledWith(/* opt_explicitUserAction */ true);
  });

  it('should return a valid page count', () => {
    const count = 5;

    createPages(element, count);

    expect(element.implementation_.getPageCount()).to.equal(count);
  });

  it('should return a valid page index', () => {
    const count = 5;

    const pages = createPages(element, count);

    pages.forEach((page, i) => {
      expect(element.implementation_.getPageIndex(page)).to.equal(i);
    });
  });

  it('should return all pages', () => {
    const pages = createPages(element, 5);

    const result = element.implementation_.getPages();

    expect(result.length).to.equal(pages.length);

    pages.forEach((page, i) =>
        expect(Array.prototype.includes.call(result, page)).to.be.true);
  });

  it('should update progress bar when switching pages', () => {
    const impl = element.implementation_;

    const count = 10;
    const index = 2;

    const page = win.document.createElement('div');

    const updateProgressBarStub =
        sandbox.stub(impl.systemLayer_, 'updateProgressBar', NOOP);

    stubEmptyActivePage();

    sandbox.stub(impl, 'getPageCount').returns(count);
    sandbox.stub(impl, 'getPageIndex').withArgs(page).returns(index);

    impl.switchTo_(page);

    // first page is not counted as part of the progress
    expect(updateProgressBarStub).to.have.been.calledWith(index, count - 1);
  });
});
