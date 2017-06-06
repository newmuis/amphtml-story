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

    const exitFullScreenBtnMock = {
      addEventListener: sandbox.spy(),
    };

    sandbox.stub(systemLayer, 'exitFullScreenBtn_', exitFullScreenBtnMock);

    systemLayer.addEventHandlers_();

    expect(exitFullScreenBtnMock.addEventListener).to.have.been.calledWith(
        'click', matchEventHandlerThatExecutes(onExitFullScreenClick));
  });

  it('should dispatch EXIT_FULLSCREEN when button is clicked', () => {
    const dispatchEvent = sandbox.spy();
    const stopPropagation = sandbox.spy();

    sandbox.stub(systemLayer, 'getRoot').returns({dispatchEvent});

    systemLayer.onExitFullScreenClick_({stopPropagation});

    expect(stopPropagation).to.be.calledOnce;
    expect(dispatchEvent).to.have.been.calledWith(
        matchEvent(EventType.EXIT_FULLSCREEN, /* bubbles */ true));
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
});
