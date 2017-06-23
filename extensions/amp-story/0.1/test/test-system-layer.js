/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {SystemLayer} from '../system-layer';
import {EventType} from '../events';


const NOOP = () => {};


describes.fakeWin('amp-story system layer', {}, env => {
  let win;
  let systemLayer;

  function matchEventHandlerThatExecutes(spy) {
    return sandbox.match(handler => {
      handler(new Event('covfefe'));
      return spy.called;
    });
  }

  function matchEvent(name, bubbles) {
    return sandbox.match.has('type', name)
        .and(sandbox.match.has('bubbles', bubbles));
  }

  function expectEventTransform(eventHandler, expectedEventType) {
    const dispatchEvent = sandbox.spy();
    const stopPropagation = sandbox.spy();

    sandbox.stub(systemLayer, 'getRoot').returns({dispatchEvent});

    eventHandler({stopPropagation});

    expect(stopPropagation).to.be.calledOnce;
    expect(dispatchEvent).to.have.been.calledWith(
        matchEvent(expectedEventType, /* bubbles */ true));
  }

  beforeEach(() => {
    win = env.win;

    systemLayer = new SystemLayer(win);

    sandbox.stub(systemLayer, 'getVsync_').returns({
      mutate: fn => fn(),
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should build UI', () => {
    const addEventHandlers =
        sandbox.stub(systemLayer, 'addEventHandlers_', NOOP);

    const root = systemLayer.build();

    expect(root).to.not.be.null;
    expect(systemLayer.exitFullScreenBtn_).to.not.be.null;

    expect(addEventHandlers).to.have.been.called;
  });

  it('should attach event handlers', () => {
    const onExitFullScreenClick =
        sandbox.stub(systemLayer, 'onExitFullScreenClick_');

    const onCloseBookendClick =
        sandbox.stub(systemLayer, 'onCloseBookendClick_');

    const exitFullScreenBtnMock = {
      addEventListener: sandbox.spy(),
    };

    const closeBookendBtnMock = {
      addEventListener: sandbox.spy(),
    };

    sandbox.stub(systemLayer, 'exitFullScreenBtn_', exitFullScreenBtnMock);
    sandbox.stub(systemLayer, 'closeBookendBtn_', closeBookendBtnMock);

    systemLayer.addEventHandlers_();

    expect(exitFullScreenBtnMock.addEventListener).to.have.been.calledWith(
        'click', matchEventHandlerThatExecutes(onExitFullScreenClick));

    expect(closeBookendBtnMock.addEventListener).to.have.been.calledWith(
        'click', matchEventHandlerThatExecutes(onCloseBookendClick));
  });

  it('should dispatch EXIT_FULLSCREEN when button is clicked', () => {
    expectEventTransform(
        e => systemLayer.onExitFullScreenClick_(e), EventType.EXIT_FULLSCREEN);
  });

  it('should dispatch CLOSE_BOOKEND when button is clicked', () => {
    expectEventTransform(
        e => systemLayer.onCloseBookendClick_(e), EventType.CLOSE_BOOKEND);
  });

  it('should hide exit fullscreen button when not in fullscreen', () => {
    const button = win.document.createElement('button');

    sandbox.stub(systemLayer, 'exitFullScreenBtn_', button);

    systemLayer.setInFullScreen(false);

    expect(button.hasAttribute('hidden')).to.be.true;
  });

  it('should show exit fullscreen button when in fullscreen', () => {
    const button = win.document.createElement('button');

    sandbox.stub(systemLayer, 'exitFullScreenBtn_', button);

    systemLayer.setInFullScreen(true);

    expect(button.hasAttribute('hidden')).to.be.false;
  });

  it('should scale progess bar element', () => {
    const progressEl = win.document.createElement('div');

    sandbox.stub(systemLayer, 'progressEl_', progressEl);

    [
      {args: [ 0, 10], expectedFactor: 0},
      {args: [ 1,  2], expectedFactor: 0.5},
      {args: [ 1, 10], expectedFactor: 0.1},
      {args: [10, 10], expectedFactor: 1},
      {args: [ 1,  1], expectedFactor: 1},
      {args: [ 1,  5], expectedFactor: 0.2},
    ].forEach(testSet => {
      systemLayer.updateProgressBar.apply(systemLayer, testSet.args);
      expect(progressEl.style.transform)
          .to.equal(`scale(${testSet.expectedFactor}, 1)`);
    });
  });
});
