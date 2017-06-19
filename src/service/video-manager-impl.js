
/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
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

import {ActionTrust} from '../action-trust';
import {listen, listenOncePromise} from '../event-helper';
import {dev} from '../log';
import {getMode} from '../mode';
import {registerServiceBuilderForDoc, getServiceForDoc} from '../service';
import {setStyles} from '../style';
import {isFiniteNumber} from '../types';
import {mapRange} from '../utils/math';
import {startsWith} from '../string.js';
import {
  PlayingStates,
  VideoAnalyticsEvents,
  VideoAttributes,
  VideoEvents,
} from '../video-interface';
import {Services} from '../services';
import {
  installPositionObserverServiceForDoc,
} from './position-observer/position-observer-impl';
import {
  PositionObserverFidelity,
} from './position-observer/position-observer-worker';
import {map} from '../utils/object';
import {layoutRectLtwh, RelativePositions} from '../layout-rect';
import {
  EMPTY_METADATA,
  parseSchemaImage,
  parseOgImage,
  parseFavicon,
  setMediaSession,
} from '../mediasession-helper';
import {Animation} from '../animation';
import * as st from '../style';
import * as tr from '../transition';

const TAG = 'video-manager';

/**
 * @const {number} Percentage of the video that should be in viewport before it
 * is considered visible.
 */
const VISIBILITY_PERCENT = 75;

/**
 * Playing States
 *
 * Internal playing states used to distinguish between video playing on user's
 * command and videos playing automatically
 *
 * @constant {!Object<string, string>}
 */
export const PlayingStates = {
  /**
   * playing_manual
   *
   * When the video user manually interacted with the video and the video
   * is now playing
   *
   * @event playing_manual
   */
  PLAYING_MANUAL: 'playing_manual',

  /**
   * playing_auto
   *
   * When the video has autoplay and the user hasn't interacted with it yet
   *
   * @event playing_auto
   */
  PLAYING_AUTO: 'playing_auto',

  /**
   * paused
   *
   * When the video is paused.
   *
   * @event paused
   */
  PAUSED: 'paused',
};


/**
 * VideoManager keeps track of all AMP video players that implement
 * the common Video API {@see ../video-interface.VideoInterface}.
 *
 * It is responsible for providing a unified user experience and analytics for
 * all videos within a document.
 */
export class VideoManager {

  /**
   * @param {!./ampdoc-impl.AmpDoc} ampdoc
   */
  constructor(ampdoc) {

    /** @const {!./ampdoc-impl.AmpDoc}  */
    this.ampdoc = ampdoc;

    /** @private {!../service/viewport/viewport-impl.Viewport} */
    this.viewport_ = Services.viewportForDoc(this.ampdoc);

    /** @private {?Array<!VideoEntry>} */
    this.entries_ = null;

    /** @private {boolean} */
    this.scrollListenerInstalled_ = false;

    /** @private {boolean} */
    this.resizeListenerInstalled_ = false;

    /** @private {./position-observer/position-observer-impl.PositionObserver} */
    this.positionObserver_ = null;

    /** @private {?VideoEntry} */
    this.dockedVideo_ = null;

    /** @private @const */
    this.timer_ = Services.timerFor(ampdoc.win);

    /** @private @const */
    this.boundSecondsPlaying_ = () => this.secondsPlaying_();

    // TODO(cvializ, #10599): It would be nice to only create the timer
    // if video analytics are present, since the timer is not needed if
    // video analytics are not present.
    this.timer_.delay(this.boundSecondsPlaying_, SECONDS_PLAYED_MIN_DELAY);
  }

  /**
   * Each second, trigger video-seconds-played for videos that are playing
   * at trigger time.
   * @private
   */
  secondsPlaying_() {
    for (let i = 0; i < this.entries_.length; i++) {
      const entry = this.entries_[i];
      if (entry.getPlayingState() !== PlayingStates.PAUSED) {
        analyticsEvent(entry, VideoAnalyticsEvents.SECONDS_PLAYED);
      }
    }
    this.timer_.delay(this.boundSecondsPlaying_, SECONDS_PLAYED_MIN_DELAY);
  }

  /**
   * Registers a video component that implements the VideoInterface.
   * @param {!../video-interface.VideoInterface} video
   */
  register(video) {
    dev().assert(video);

    this.registerCommonActions_(video);

    if (!video.supportsPlatform()) {
      return;
    }

    this.entries_ = this.entries_ || [];
    const entry = new VideoEntry(this, video);
    this.maybeInstallVisibilityObserver_(entry);
    this.maybeInstallPositionObserver_(entry);
    this.maybeInstallOrientationObserver_(entry);
    this.entries_.push(entry);
    video.element.dispatchCustomEvent(VideoEvents.REGISTERED);
    // Add a class to element to indicate it implements the video interface.
    video.element.classList.add('i-amphtml-video-interface');
  }

  /**
   * Register common actions such as play, pause, etc... on the video element
   * so they can be called using AMP Actions.
   * For example: <button on="tap:myVideo.play">
   *
   * @param {!../video-interface.VideoInterface} video
   * @private
   */
  registerCommonActions_(video) {
    video.registerAction('play', video.play.bind(video, /* isAutoplay */ false),
        ActionTrust.HIGH);
    video.registerAction('pause', video.pause.bind(video), ActionTrust.LOW);
    video.registerAction('mute', video.mute.bind(video), ActionTrust.LOW);
    video.registerAction('unmute', video.unmute.bind(video),
        ActionTrust.HIGH);
  }

  /**
   * Install the necessary listeners to be notified when a video becomes visible
   * in the viewport.
   *
   * Visibility of a video is defined by being in the viewport AND having
   * {@link VISIBILITY_PERCENT} of the video element visible.
   *
   * @param {VideoEntry} entry
   * @private
   */
  maybeInstallVisibilityObserver_(entry) {
    // TODO(aghassemi): Remove this later. For now, the visibility observer
    // only matters for autoplay videos so no point in monitoring arbitrary
    // videos yet.
    if (!entry.video.element.hasAttribute(VideoAttributes.AUTOPLAY)) {
      return;
    }

    listen(entry.video.element, VideoEvents.VISIBILITY, () => {
      entry.updateVisibility();
    });

    listen(entry.video.element, VideoEvents.RELOAD, () => {
      entry.videoLoaded();
    });

    // TODO(aghassemi, #6425): Use IntersectionObserver
    if (!this.scrollListenerInstalled_) {
      const scrollListener = () => {
        for (let i = 0; i < this.entries_.length; i++) {
          this.entries_[i].updateVisibility();
        }
      };
      this.viewport_.onScroll(scrollListener);
      this.viewport_.onChanged(scrollListener);
      this.scrollListenerInstalled_ = true;
    }
  }

  /**
   * Returns the entry in the video manager corresponding to the video
   * provided
   *
   * @param {!../video-interface.VideoInterface} video
   * @return {VideoEntry} entry
   * @private
   */
  getEntryForVideo_(video) {
    for (let i = 0; i < this.entries_.length; i++) {
      if (this.entries_[i].video === video) {
        return this.entries_[i];
      }
    }
    dev().assert(false, 'video is not registered to this video manager');
    return null;
  }

  /**
   * Returns whether the video is paused or playing after the user interacted
   * with it or playing through autoplay
   *
   * @param {!../video-interface.VideoInterface} video
   * @return {!../video-interface.VideoInterface} PlayingStates
   */
  getPlayingState(video) {
    return this.getEntryForVideo_(video).getPlayingState();
  }

  /**
   * Returns whether the video was interacted with or not
   *
   * @param {!../video-interface.VideoInterface} video
   * @return {boolean}
   */
  userInteractedWithAutoPlay(video) {
    return this.getEntryForVideo_(video).userInteractedWithAutoPlay();
  }



}

/**
 * VideoEntry represents an entry in the VideoManager's list.
 */
class VideoEntry {
  /**
   * @param {!VideoManager} manager
   * @param {!../video-interface.VideoInterface} video
   */
  constructor(manager, video) {

    /** @private @const {!VideoManager} */
    this.manager_ = manager;

    /** @private @const {!./ampdoc-impl.AmpDoc}  */
    this.ampdoc_ = manager.ampdoc;

    /** @private {!../service/viewport/viewport-impl.Viewport} */
    this.viewport_ = Services.viewportForDoc(this.ampdoc_);

    /** @package @const {!../video-interface.VideoInterface} */
    this.video = video;

    /** @private {?Element} */
    this.autoplayAnimation_ = null;

    /** @private {boolean} */
    this.loaded_ = false;

    /** @private {boolean} */
    this.isPlaying_ = false;

    /** @private {boolean} */
    this.isVisible_ = false;

    /** @private @const {!../service/vsync-impl.Vsync} */
    this.vsync_ = Services.vsyncFor(this.ampdoc_.win);

    /** @private @const */
    this.actionSessionManager_ = new VideoSessionManager();

    this.actionSessionManager_.onSessionEnd(
        () => analyticsEvent(this, VideoAnalyticsEvents.SESSION));

    /** @private @const */
    this.visibilitySessionManager_ = new VideoSessionManager();

    this.visibilitySessionManager_.onSessionEnd(
        () => analyticsEvent(this, VideoAnalyticsEvents.SESSION_VISIBLE));

    /** @private @const {function(): !Promise<boolean>} */
    this.boundSupportsAutoplay_ = supportsAutoplay.bind(null, this.ampdoc_.win,
        getMode(this.ampdoc_.win).lite);

    const element = dev().assert(video.element);

    // Autoplay Variables

    /** @private {boolean} */
    this.userInteractedWithAutoPlay_ = false;

    /** @private {boolean} */
    this.playCalledByAutoplay_ = false;

    /** @private {boolean} */
    this.pauseCalledByAutoplay_ = false;

    /** @private {?Element} */
    this.internalElement_ = null;

    /** @private {?Element} */
    this.draggingMask_ = null;

    /** @private {boolean} */
    this.muted_ = false;

    // Dockabled Video Variables

    /** @private {Object} */
    this.inlineVidRect_ = null;

    /** @private {Object} */
    this.minimizedRect_ = null;

    /** @private {string} */
    this.dockPosition_ = DockPositions.INLINE;

    /** @private {string} */
    this.dockState_ = DockStates.INLINE;

    /** @private {number} */
    this.dockVisibleHeight_ = 0;

    /** @private {?./position-observer/position-observer-worker.PositionInViewportEntryDef} */
    this.dockLastPosition_ = null;

    /** @private {boolean} */
    this.dockPreviouslyInView_ = false;

    // Dragging Variables

    /** @private {boolean} */
    this.dragListenerInstalled_ = false;

    /** @private {boolean} */
    this.isTouched_ = false;

    /** @private {boolean} */
    this.isDragging_ = false;

    /** @private {boolean} */
    this.isSnapping_ = false;

    /** @private {boolean} */
    this.isDismissed_ = false;

    /** @private {Object} */
    this.dragCoordinates_ = {
      mouse: {x: 0, y: 0},
      displacement: {x: 0, y: 0},
      initial: {x: 0, y: 0},
      position: {x: 0, y: 0},
      previous: {x: 0, y: 0},
      velocity: {x: 0, y: 0},
    };

    /** @private {Array<!UnlistenDef>} */
    this.dragUnlisteners_ = [];

    this.hasDocking = element.hasAttribute(VideoAttributes.DOCK);

    this.hasAutoplay = element.hasAttribute(VideoAttributes.AUTOPLAY);

    const fsOnLandscapeAttr = element.getAttribute(
        VideoAttributes.FULLSCREEN_ON_LANDSCAPE
    );

    this.hasFullscreenOnLandscape = fsOnLandscapeAttr == ''
                                    || fsOnLandscapeAttr == 'always';

    // Media Session API Variables

    /** @private {!../mediasession-helper.MetadataDef} */
    this.metadata_ = EMPTY_METADATA;

    /** @private {boolean} */
    this.userInteractedWithAutoPlay_ = false;

    /** @private {boolean} */
    this.playCalledByAutoplay_ = false;

    listenOncePromise(element, VideoEvents.LOAD)
        .then(() => this.videoLoaded_());


    listen(this.video.element, VideoEvents.PAUSE, this.videoPaused_.bind(this));

    listen(this.video.element, VideoEvents.PLAY, this.videoPlayed_.bind(this));


    // Currently we only register after video player is build.
    this.videoBuilt_();
  }

  /**
   * Called when the video element is built.
   * @private
   */
  videoBuilt_() {
    this.updateVisibility();
    if (this.hasAutoplay) {
      this.autoplayVideoBuilt_();
    }
    if (this.hasDocking) {
      this.dockableVideoBuilt_();
    }
  }

  /**
   * Callback for when the video starts playing
   * @private
   */
  videoPlayed_() {
    this.isPlaying_ = true;
  }

  /**
  * Callback for when the video has been paused
   * @private
   */
  videoPaused_() {
    this.isPlaying_ = false;
  }

  /**
   * Called when the video is loaded and can play.
   * @private
   */
  videoPlayed_() {
    this.isPlaying_ = true;

    if (!this.video.preimplementsMediaSessionAPI()) {
      const playHandler = () => {
        this.video.play(/*isAutoplay*/ false);
      };
      const pauseHandler = () => {
        this.video.pause();
      };
      // Update the media session
      setMediaSession(
          this.ampdoc_.win,
          this.metadata_,
          playHandler,
          pauseHandler
      );
    }

    this.actionSessionManager_.beginSession();
    if (this.isVisible_) {
      this.visibilitySessionManager_.beginSession();
    }
    analyticsEvent(this, VideoAnalyticsEvents.PLAY);
  }

  /**
   * Callback for when the video has been paused
   * @private
   */
  videoPaused_() {
    if (this.video.getCurrentTime() === this.video.getDuration()) {
      analyticsEvent(this, VideoAnalyticsEvents.ENDED);
    } else {
      analyticsEvent(this, VideoAnalyticsEvents.PAUSE);
    }
    this.isPlaying_ = false;

    // Prevent double-trigger of session if video is autoplay and the video
    // is paused by a the user scrolling the video out of view.
    if (!this.pauseCalledByAutoplay_) {
      this.actionSessionManager_.endSession();
    } else {
      // reset the flag
      this.pauseCalledByAutoplay_ = false;
    }
  }

  /**
   * Called when the video is loaded and can play.
   */
  videoLoaded() {
    this.loaded_ = true;

    // Get the internal element (the actual video/iframe)
    this.internalElement_ = scopedQuerySelector(
        this.video.element,
        'video, iframe'
    );

    // Just in case the video's size changed during layout
    this.vsync_.measure(() => {
      this.inlineVidRect_ = this.video.element./*OK*/getBoundingClientRect();
    });

    this.fillMediaSessionMetadata_();

    this.updateVisibility();
    if (this.isVisible_) {
      // Handles the case when the video becomes visible before loading
      this.loadedVideoVisibilityChanged_();
    }
  }

  /**
   * Gets the provided metadata and fills in missing fields
   * @private
   */
  fillMediaSessionMetadata_() {
    if (this.video.preimplementsMediaSessionAPI()) {
      return;
    }

    if (this.video.getMetadata()) {
      this.metadata_ = map(
          /** @type {!../mediasession-helper.MetadataDef} */
          (this.video.getMetadata())
      );
    }

    const doc = this.ampdoc_.win.document;

    if (!this.metadata_.artwork || this.metadata_.artwork.length == 0) {
      const posterUrl = parseSchemaImage(doc)
                        || parseOgImage(doc)
                        || parseFavicon(doc);

      if (posterUrl) {
        this.metadata_.artwork = [{
          'src': posterUrl,
        }];
      }
    }

    if (!this.metadata_.title) {
      const title = this.video.element.getAttribute('title')
                    || this.video.element.getAttribute('aria-label')
                    || this.internalElement_.getAttribute('title')
                    || this.internalElement_.getAttribute('aria-label')
                    || doc.title;
      if (title) {
        this.metadata_.title = title;
      }
    }
  }

  /**
   * Called when visibility of a video changes.
   * @private
   */
  videoVisibilityChanged_() {
    if (this.loaded_) {
      this.loadedVideoVisibilityChanged_();
    }
  }

  /**
   * Called when the orientation of the device changes
   * @param {boolean} isLandscape
   * @private
   */
  orientationChanged_(isLandscape) {
    if (!this.loaded_) {
      return;
    }
    // Put the video in/out of fullscreen depending on screen orientation
    if (!isLandscape && this.isFullscreenByOrientationChange_) {
    	this.exitFullscreen_();
    } else if (isLandscape
               && this.getPlayingState() == PlayingStates.PLAYING_MANUAL
               && this.isVisible_
               && Services.viewerForDoc(this.ampdoc_).isVisible()) {
    	this.enterFullscreen_();
    }
  }

  /**
   * Makes the video element go fullscreen and updates its status
   * @private
   */
  enterFullscreen_() {
    if (this.video.isFullscreen() || this.isFullscreenByOrientationChange_) {
      return;
    }
    this.video.fullscreenEnter();
    this.isFullscreenByOrientationChange_ = this.video.isFullscreen();
  }

  /**
   * Makes the video element quit fullscreen and updates its status
   * @private
   */
  exitFullscreen_() {
    if (!this.isFullscreenByOrientationChange_) {
      return;
    }
    this.video.fullscreenExit();
    this.isFullscreenByOrientationChange_ = false;
  }

  /**
   * Only called when visibility of a loaded video changes.
   * @private
   */
  loadedVideoVisibilityChanged_() {
    if (!Services.viewerForDoc(this.ampdoc_).isVisible()) {
      return;
    }

    this.boundSupportsAutoplay_().then(supportsAutoplay => {
      const canAutoplay = this.hasAutoplay && !this.userInteractedWithAutoPlay_;

      if (canAutoplay && supportsAutoplay) {
        this.autoplayLoadedVideoVisibilityChanged_();
      } else {
        this.nonAutoplayLoadedVideoVisibilityChanged_();
      }
    });
  }

  /* Autoplay Behaviour */

  /**
   * Called when an autoplay video is built.
   * @private
   */
  autoplayVideoBuilt_() {

    // Hide controls until we know if autoplay is supported, otherwise hiding
    // and showing the controls quickly becomes a bad user experience for the
    // common case where autoplay is supported.
    if (this.video.isInteractive()) {
      this.video.hideControls();
    }

    this.boundSupportsAutoplay_().then(supportsAutoplay => {
      if (!supportsAutoplay && this.video.isInteractive()) {
        // Autoplay is not supported, show the controls so user can manually
        // initiate playback.
        this.video.showControls();
        return;
      }

      // Only muted videos are allowed to autoplay
      this.video.mute();

      if (this.video.isInteractive()) {
        this.autoplayInteractiveVideoBuilt_();
      }
    });
  }

  /**
   * Called by autoplayVideoBuilt_ when an interactive autoplay video is built.
   * It handles hiding controls, installing autoplay animation and handling
   * user interaction by unmuting and showing controls.
   * @private
   */
  autoplayInteractiveVideoBuilt_() {
    const toggleAnimation = playing => {
      this.vsync_.mutate(() => {
        animation.classList.toggle('amp-video-eq-play', playing);
      });
    };

    // Hide the controls.
    this.video.hideControls();

    // Create autoplay animation and the mask to detect user interaction.
    const animation = this.createAutoplayAnimation_();
    const mask = this.createAutoplayMask_();
    this.vsync_.mutate(() => {
      this.video.element.appendChild(animation);
      this.video.element.appendChild(mask);
    });

    // Listen to pause, play and user interaction events.
    const unlisteners = [];
    unlisteners.push(listen(mask, 'click', onInteraction.bind(this)));
    unlisteners.push(listen(animation, 'click', onInteraction.bind(this)));

    unlisteners.push(listen(this.video.element, VideoEvents.PAUSE,
        toggleAnimation.bind(this, /*playing*/ false)));

    unlisteners.push(listen(this.video.element, VideoEvents.PLAYING,
        toggleAnimation.bind(this, /*playing*/ true)));

    unlisteners.push(listen(this.video.element, VideoEvents.AD_START,
        adStart.bind(this)));

    unlisteners.push(listen(this.video.element, VideoEvents.AD_END,
        adEnd.bind(this)));

    function onInteraction() {
      this.userInteractedWithAutoPlay_ = true;
      this.video.showControls();
      this.video.unmute();
      unlisteners.forEach(unlistener => {
        unlistener();
      });
      removeElement(animation);
      removeElement(mask);
    }

    function adStart() {
      setStyles(mask, {
        'display': 'none',
      });
    }

    function adEnd() {
      setStyles(mask, {
        'display': 'block',
      });
    }
  }

  /**
   * Called when visibility of a loaded autoplay video changes.
   * @private
   */
  autoplayLoadedVideoVisibilityChanged_() {
    if (this.userInteractedWithAutoPlay_
       || !viewerForDoc(this.ampdoc_).isVisible()) {
      return;
    }

    this.vsync_.mutate(() => {
      const internalElement = this.internalElement_;
      function cloneStyle(prop) {
        return st.getStyle(dev().assertElement(internalElement), prop);
      };

      st.setStyles(dev().assertElement(this.draggingMask_), {
        'top': cloneStyle('top'),
        'left': cloneStyle('left'),
        'bottom': cloneStyle('bottom'),
        'right': cloneStyle('right'),
        'transform': cloneStyle('transform'),
        'transform-origin': cloneStyle('transform-origin'),
        'borderRadius': cloneStyle('borderRadius'),
        'width': cloneStyle('width'),
        'height': cloneStyle('height'),
        'position': 'fixed',
        'z-index': '17',
        'background': 'transparent',
      });
    });
  }

  /**
   * Called when the video's position in the viewport changed (at most once per
   * animation frame)
   * @param {./position-observer/position-observer-worker.PositionInViewportEntryDef} newPos
   */
  onDockableVideoPositionChanged(newPos) {
    this.vsync_.run({
      measure: () => {
        this.inlineVidRect_ = this.video.element./*OK*/getBoundingClientRect();
        this.updateDockableVideoPosition_(newPos);
      },
      mutate: () => {
        // Short-circuit the position change handler if the video isn't loaded yet
        // or is not playing manually while in-line (paused videos need to go
        // through if they are docked since this method handles the "undocking"
        // animation)
        if (!this.loaded_
          || !this.inlineVidRect_
          || !this.internalElement_
          || (this.getPlayingState() != PlayingStates.PLAYING_MANUAL
                  && !this.internalElement_.classList.contains(DOCK_CLASS))
        ) {
          return;
        }

        // During the docking transition we either perform the docking or
        // undocking scroll-bound animations
        //
        // Conditions for animating the video are:
        // 1. The video is out of view and it has been in-view  before
        const outOfView = (this.dockPosition_ != DockPositions.INLINE)
                          && this.dockPreviouslyInView_;
        // 2. Is either manually playing or paused while docked (so that it is
        // undocked even when paused)
        const manual = this.getPlayingState() == PlayingStates.PLAYING_MANUAL;
        const paused = this.getPlayingState() == PlayingStates.PAUSED;
        const docked = this.internalElement_.classList.contains(DOCK_CLASS);

        if (outOfView && (manual || (paused && docked))) {
          // On the first time, we initialize the docking animation
          if (this.dockState_ == DockStates.INLINE
              && this.manager_.canDock(this)) {
            this.initializeDocking_();
          }
          // Then we animate docking or undocking
          if (this.dockState_ != DockStates.INLINE) {
            this.animateDocking_();
          }
        } else if (docked) {
          // Here undocking animations are done so we restore the element
          // inline by clearing all styles and removing the position:fixed
          this.finishDocking_();
        }

        if (this.dockState_ == DockStates.DOCKED) {
          this.initializeDragging_();
        } else {
          this.finishDragging_();
        }
      },
    });
  }

  /**
   * Updates the minimization position of the video (in viewport, above or
   * below viewport), also the height of the part of the video that is
   * currently in the viewport (between 0 and the initial video height).
   * @param {./position-observer/position-observer-worker.PositionInViewportEntryDef} newPos
   * @private
   */
  updateDockableVideoPosition_(newPos) {
    const isBottom = newPos.relativePos == RelativePositions.BOTTOM;
    const isTop = newPos.relativePos == RelativePositions.TOP;
    const isInside = newPos.relativePos == RelativePositions.INSIDE;

    // Record last position in case we need to redraw (ex. on resize);
    this.dockLastPosition_ = newPos;

    // If the video is out of view, newPos.positionRect will be null so we can
    // fake the position to be right above or below the viewport based on the
    // relativePos field
    if (!newPos.positionRect) {
      newPos.positionRect = isBottom ?
        // A fake rectangle with same width/height as the video, except it's
        // position right below the viewport
        layoutRectLtwh(
            this.inlineVidRect_.left,
            this.viewport_.getHeight(),
            this.inlineVidRect_.width,
            this.inlineVidRect_.height
        ) :
        // A fake rectangle with same width/height as the video, except it's
        // position right above the viewport
        layoutRectLtwh(
            this.inlineVidRect_.left,
            -this.inlineVidRect_.height,
            this.inlineVidRect_.width,
            this.inlineVidRect_.height
        );
    }

    const docViewTop = newPos.viewportRect.top;
    const docViewBottom = newPos.viewportRect.bottom;
    const elemTop = newPos.positionRect.top;
    const elemBottom = newPos.positionRect.bottom;

    // Calculate height currently displayed
    if (elemTop <= docViewTop) {
      this.dockVisibleHeight_ = elemBottom - docViewTop;
    } else if (elemBottom >= docViewBottom) {
      this.dockVisibleHeight_ = docViewBottom - elemTop;
    } else {
      this.dockVisibleHeight_ = elemBottom - elemTop;
    }

    // Calculate whether the video has been in view at least once
    this.dockPreviouslyInView_ = this.dockPreviouslyInView_ ||
            Math.ceil(this.dockVisibleHeight_) >= this.inlineVidRect_.height;

    // Calculate space on top and bottom of the video to see if it is possible
    // for the video to become hidden by scrolling to the top/bottom
    const spaceOnTop = this.video.element./*OK*/offsetTop;
    const spaceOnBottom = this.viewport_.getScrollHeight()
                         - spaceOnTop
                         - this.video.element./*OK*/offsetHeight;
    // Don't minimize if video can never be hidden by scrolling to top/bottom
    if ((isBottom && spaceOnTop < this.viewport_.getHeight())
        || (isTop && spaceOnBottom < this.viewport_.getHeight())) {
      this.dockPosition_ = DockPositions.INLINE;
      return;
    }

    // Don't minimize if the video is bigger than the viewport (will always
    // minimize and never be inline otherwise!)
    if (this.video.element./*OK*/offsetHeight >= this.viewport_.getHeight()) {
      this.dockPosition_ = DockPositions.INLINE;
      return;
    }

    const doc = this.ampdoc_.win.document;

    // Calculate where the video should be docked if it hasn't been dragged
    if (this.dockPosition_ == DockPositions.INLINE && !isInside) {
      if (isTop) {
        this.dockPosition_ = isRTL(doc) ? DockPositions.TOP_LEFT
                                       : DockPositions.TOP_RIGHT;
      } else if (isBottom) {
        this.dockPosition_ = isRTL(doc) ? DockPositions.BOTTOM_LEFT
                                       : DockPositions.BOTTOM_RIGHT;
      }
    } else if (isInside) {
      this.dockPosition_ = DockPositions.INLINE;
    } else {
      // The inline video is outside but the dockPosition has been set, this
      // means the position was manually changed by drag/drop, keep it as is.
    }
  }

      if (this.isVisible_) {
        this.video.play(/*autoplay*/ true);
        this.playCalledByAutoplay_ = true;
      } else {
        this.video.pause();
      }
    }
  }

  /**
   * Restores styling of the video to make it go back to its original inline
   * position.
   *
   * @private
   */
  finishDocking_() {
    // Remove draggable mask and listeners
    this.finishDragging_();
    // Re-enable controls
    this.video.showControls();
    // Restore the video inline
    this.internalElement_.classList.remove(DOCK_CLASS);
    this.internalElement_.setAttribute('style', '');
    st.setStyles(dev().assertElement(this.video.element), {
      'background-color': 'transparent',
    });
    this.dockState_ = DockStates.INLINE;
    this.manager_.unregisterDocked();
  }

  /**
   * Creates a pure CSS animated equalizer icon.
   * @private
   * @return {!Element}
   */
  createAutoplayAnimation_() {
    const doc = this.ampdoc_.win.document;
    const anim = doc.createElement('i-amphtml-video-eq');
    anim.classList.add('amp-video-eq');
    // Four columns for the equalizer.
    for (let i = 1; i <= 4; i++) {
      const column = doc.createElement('div');
      column.classList.add('amp-video-eq-col');
      // Two overlapping filler divs that animate at different rates creating
      // randomness illusion.
      for (let j = 1; j <= 2; j++) {
        const filler = doc.createElement('div');
        filler.classList.add(`amp-video-eq-${i}-${j}`);
        column.appendChild(filler);
      }
      anim.appendChild(column);
    }
    const platform = Services.platformFor(this.ampdoc_.win);
    if (platform.isIos()) {
      // iOS can not pause hardware accelerated animations.
      anim.setAttribute('unpausable', '');
    }
    return anim;
  }
  /**
   * Update's the elements coordinates to one of the set corners with a timeDef
   * animation
   * @private
   * @param {?Element} element
   */
  animateSnap_(element, newPosX, newPosY) {
    Animation.animate(dev().assertElement(element),
        tr.setStyles(dev().assertElement(element), {
          'transform': tr.concat([
            tr.translate(
                tr.px(tr.numeric(this.dragCoordinates_.position.x, newPosX)),
                tr.px(tr.numeric(this.dragCoordinates_.position.y, newPosY))
            ),
            tr.scale(tr.numeric(DOCK_SCALE, DOCK_SCALE)),
          ]),
        }), 200).thenAlways(() => {
          // Update the positions
          this.dragCoordinates_.position.x = newPosX;
          this.dragCoordinates_.position.y = newPosY;
          this.isSnapping_ = false;
        });
  }

  /**
   * Update's the elements coordinates according to the draggable's
   * set coordinates
   * @private
   * @param {?Element} element
   */
  dragMove_(element) {
    const translate = st.translate(
        st.px(this.dragCoordinates_.position.x),
        st.px(this.dragCoordinates_.position.y)
    );
    const scale = st.scale(DOCK_SCALE);
    st.setStyles(dev().assertElement(element), {
      'transform': translate + ' ' + scale,
      'transform-origin': 'top left',
      'bottom': 'auto',
      'top': '0px',
      'right': 'auto',
      'left': '0px',
    });
  }

  /**
   * Creates a mask to overlay on top of an autoplay video to detect the first
   * user tap.
   * We have to do this since many players are iframe-based and we can not get
   * the click event from the iframe.
   * We also can not rely on hacks such as constantly checking doc.activeElement
   * to know if user has tapped on the iframe since they won't be a trusted
   * event that would allow us to unmuted the video as only trusted
   * user-initiated events can be used to interact with the video.
   * @private
   * @return {!Element}
   */
  createAutoplayMask_() {
    const doc = this.ampdoc_.win.document;
    const mask = doc.createElement('i-amphtml-video-mask');
    mask.classList.add('i-amphtml-fill-content');
    return mask;
  }

  /**
   * Creates a mask to overlay on top of a minimized video to capture drag
   * and drop events on iframe-based players
   * @private
   */
  createDraggingMask_() {
    const doc = this.ampdoc_.win.document;
    this.draggingMask_ = doc.createElement('i-amphtml-dragging-mask');
    this.realignDraggingMask_();
    this.video.element.appendChild(this.draggingMask_);
  }

  /**
   * Removes the draggable mask so that the video can be interacted with
   * again when inline
   * @private
   */
  removeDraggingMask_() {
    if (this.draggingMask_) {
      removeElement(this.draggingMask_);
      this.draggingMask_ = null;
    }
  }

  /**
   * Called by all possible events that might change the visibility of the video
   * such as scrolling or {@link ../video-interface.VideoEvents#VISIBILITY}.
   * @package
   */
  updateVisibility() {
    const wasVisible = this.isVisible_;

    // Measure if video is now in viewport and what percentage of it is visible.
    const measure = () => {
      // Calculate what percentage of the video is in viewport.
      const change = this.video.element.getIntersectionChangeEntry();
      const visiblePercent = !isFiniteNumber(change.intersectionRatio) ? 0
          : change.intersectionRatio * 100;
      this.isVisible_ = visiblePercent >= VISIBILITY_PERCENT;
    };

    // Mutate if visibility changed from previous state
    const mutate = () => {
      if (this.isVisible_ != wasVisible) {
        this.videoVisibilityChanged_();
      }
    };

    this.vsync_.run({
      measure,
      mutate,
    });
  }


  /**
   * Returns whether the video is paused or playing after the user interacted
   * with it or playing through autoplay
   * @return {!../video-interface.VideoInterface} PlayingStates
   */
  getPlayingState() {
    if (!this.isPlaying_) {
      return PlayingStates.PAUSED;
    }

    if (this.isPlaying_
       && this.playCalledByAutoplay_
       && !this.userInteractedWithAutoPlay_) {
      return PlayingStates.PLAYING_AUTO;
    }

    return PlayingStates.PLAYING_MANUAL;
  }

  /**
   * Returns whether the video was interacted with or not
   * @return {boolean}
   */
  userInteractedWithAutoPlay() {
    return this.userInteractedWithAutoPlay_;
  }
}

/* @type {?Promise<boolean>} */
let supportsAutoplayCache_ = null;

/**
 * Detects whether autoplay is supported.
 * Note that even if platfrom supports autoplay, users or browsers can disable
 * autoplay to save data / battery. This function detects both platfrom support
 * and when autoplay is disabled.
 *
 * Service dependencies are taken explicitly for testability.
 *
 * @private visible for testing.
 * @param {!Window} win
 * @param {boolean} isLiteViewer
 * @return {!Promise<boolean>}
 */
export function supportsAutoplay(win, isLiteViewer) {

  // Use cached result if available.
  if (supportsAutoplayCache_) {
    return supportsAutoplayCache_;
  }

  // We do not support autoplay in amp-lite viewer regardless of platform.
  if (isLiteViewer) {
    return supportsAutoplayCache_ = Promise.resolve(false);
  }

  // To detect autoplay, we create a video element and call play on it, if
  // `paused` is true after `play()` call, autoplay is supported. Although
  // this is unintuitive, it works across browsers and is currently the lightest
  // way to detect autoplay without using a data source.
  const detectionElement = win.document.createElement('video');
  // NOTE(aghassemi): We need both attributes and properties due to Chrome and
  // Safari differences when dealing with non-attached elements.
  detectionElement.setAttribute('muted', '');
  detectionElement.setAttribute('playsinline', '');
  detectionElement.setAttribute('webkit-playsinline', '');
  detectionElement.muted = true;
  detectionElement.playsinline = true;
  detectionElement.webkitPlaysinline = true;
  detectionElement.setAttribute('height', '0');
  detectionElement.setAttribute('width', '0');
  setStyles(detectionElement, {
    position: 'fixed',
    top: '0',
    width: '0',
    height: '0',
    opacity: '0',
  });

  try {
    const playPromise = detectionElement.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        // Suppress any errors, useless to report as they are expected.
      });
    }
  } catch (e) {
    // Suppress any errors, useless to report as they are expected.
  }

  const supportsAutoplay = !detectionElement.paused;
  return supportsAutoplayCache_ = Promise.resolve(supportsAutoplay);
}

/**
 * @param {!VideoEntry} entry
 * @param {!VideoAnalyticsEvents} eventType
 * @param {!Object<string, string>=} opt_vars A map of vars and their values.
 * @private
 */
function analyticsEvent(entry, eventType, opt_vars) {
  const video = entry.video;
  const detailsPromise = opt_vars ? Promise.resolve(opt_vars) :
      entry.getAnalyticsDetails();

  detailsPromise.then(details => {
    video.element.dispatchCustomEvent(
        eventType, details);
  });
}

/**
 * Clears the cache used by supportsAutoplay method.
 *
 * @private visible for testing.
 */
export function clearSupportsAutoplayCacheForTesting() {
  supportsAutoplayCache_ = null;
}

/**
 * @param {!Node|!./ampdoc-impl.AmpDoc} nodeOrDoc
 */
export function installVideoManagerForDoc(nodeOrDoc) {
  registerServiceBuilderForDoc(nodeOrDoc, 'video-manager', VideoManager);
};
