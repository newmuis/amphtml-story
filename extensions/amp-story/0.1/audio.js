import {dev} from '../../../src/log';
import {Services} from '../../../src/services';


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



/** @typedef {{ source: AudioBufferSourceNode, gainNode: GainNode }} */
let AudioSource;

/**
 * The volume to which audio should be reduced when other audio sources are
 * played.
 * @const {number}
 */
const REDUCED_VOLUME = 0.5;

/**
 * @const {number}
 */
const VOLUME_CHANGE_DURATION_MS = 500;

/**
 * @const {!function(number): number}
 */
const VOLUME_EASING_FN = input => input;

/**
 * @const {string}
 */
const PLAYABLE_ID_PREFIX = 'i-amphtml-playable-';


/**
 * @const {string}
 */
const BACKGROUND_AUDIO_ELEMENT_CLASS_NAME = 'i-amp-story-background-audio';


/**
 * Adds support for the background-audio property on the specified element.
 * @param {!Element} element The element to upgrade with support for background
 *     audio.
 */
export function upgradeBackgroundAudio(element) {
  if (element.hasAttribute('background-audio')) {
    const audioEl = element.ownerDocument.createElement('audio');
    const audioSrc = element.getAttribute('background-audio');
    audioEl.setAttribute('src', audioSrc);
    audioEl.setAttribute('preload', 'auto');
    audioEl.setAttribute('loop', '');
    audioEl.setAttribute('autoplay', '');
    audioEl.classList.add(BACKGROUND_AUDIO_ELEMENT_CLASS_NAME);
    element.appendChild(audioEl);
  }
}


export class AudioManager {
  constructor(win, rootElement) {
    /** @private @const {!Object<!Element, !Playable>} */
    this.playables_ = {};

    /** @private @const {!Array<!Playable>} */
    this.nowPlaying_ = [];

    /** @private {number} */
    this.nextId_ = 0;

    /** @private {boolean} */
    this.isMuted_ = true;

    /** @private {!Window} */
    this.win_ = win;

    /** @private {!Element} */
    this.rootElement_ = rootElement;
  }

  /**
   * @param {!Element} sourceElement The element causing audio to be played.
   * @return {!Playable} The {@link Playable} instance to play the audio
   *     represented by the specified sourceElement.
   */
  createPlayable_(sourceElement) {
    if (!(sourceElement instanceof Element)) {
      dev().error('amp-story', 'Played item must be element.');
    }

    if (sourceElement instanceof HTMLMediaElement) {
      return new MediaElementPlayable(this.win_, sourceElement);
    }
  }

  /**
   * @param {!Element} sourceElement
   * @return {?Playable}
   */
  getPlayable_(sourceElement) {
    return this.playables_[sourceElement.id];
  }

  /**
   * Loads the audio for the specified.
   * @param {!Element} sourceElement The element whose audio should be loaded.
   */
  load(sourceElement) {
    const playable = this.getPlayable_(sourceElement) ||
        this.createPlayable_(sourceElement);

    if (!playable) {
      return Promise.resolve();
    }

    if (!sourceElement.id) {
      sourceElement.id = `${PLAYABLE_ID_PREFIX}${this.nextId_++}`;
    }

    this.playables_[sourceElement.id] = playable;
    return playable.load();
  }

  /** @private */
  getMediaElementChildren_(element) {
    return element.querySelectorAll('audio, video');
  }

  /**
   * Plays the audio generated by a given element.
   * @param {!Element} sourceElement The element to be played.
   */
  play(sourceElement) {
    this.load(sourceElement)
        .then(() => {
          const playable = this.getPlayable_(sourceElement);
          if (!playable) {
            return;
          }

          // Play the audio.
          this.addToNowPlaying_(playable);
        });
  }

  /**
   * Stops the audio generated by a given element.
   * @param {!Element} sourceElement The element to be stopped.
   */
  stop(sourceElement) {
    const playable = this.getPlayable_(sourceElement);
    if (!playable) {
      return;
    }

    // Stop the audio.
    this.removeFromNowPlaying_(playable);
  }

  /**
   * Mutes all of the audio sources that are playing.
   */
  muteAll() {
    this.nowPlaying_.forEach(playable => {
      playable.mute();
    });
    this.isMuted_ = true;
  }

  /**
   * Unmutes all of the audio sources that are playing.
   */
  unmuteAll() {
    this.nowPlaying_.forEach(playable => {
      playable.unmute();
    });
    this.isMuted_ = false;
  }

  /**
   * @param {!Playable} playable The playable to add to the "Now Playing" list.
   * @private
   */
  addToNowPlaying_(playable) {
    const index = this.nowPlaying_.indexOf(playable);
    if (index >= 0) {
      return;
    }

    playable.setVolume(1 /* volume */, 0 /* durationMs */, VOLUME_EASING_FN);
    if (this.isMuted_) {
      playable.mute();
    } else {
      playable.unmute();
    }

    this.nowPlaying_.push(playable);
    this.nowPlayingChanged_();
  }

  /**
   * @param {!Playable} playable The playable to remove from the "Now Playing"
   *     list.
   * @private
   */
  removeFromNowPlaying_(playable) {
    const index = this.nowPlaying_.indexOf(playable);
    if (index < 0) {
      return;
    }

    this.nowPlaying_.splice(index, 1);
    this.nowPlayingChanged_();
  }


  nowPlayingChanged_() {
    // Populate a sparse array where the indices of the array represent the
    // tree depths at which there is audio currently playing.
    const prioritiesByDepth = [];
    let depthCount = 0;
    this.nowPlaying_.forEach(playable => {
      const depth = playable.getDepth();
      if (prioritiesByDepth[depth] !== undefined) {
        return;
      }

      prioritiesByDepth[depth] = 0;
      depthCount++;
    });

    // Set a numerical priority for each of the tree depths at which there is
    // audio currently playing (0 is highest priority).
    let iteration = 0;
    prioritiesByDepth.forEach((unusedValue, depth) => {
      iteration++;
      prioritiesByDepth[depth] = depthCount - iteration;
    });

    // Set volumes on each of the playables that is currently playing, based on
    // its priority (higher priority results in louder volume).
    this.nowPlaying_.forEach(playable => {
      const depth = playable.getDepth();
      const volume = Math.pow(REDUCED_VOLUME, prioritiesByDepth[depth]);
      playable.setVolume(volume, VOLUME_CHANGE_DURATION_MS, VOLUME_EASING_FN);
    });
  }
}


class Playable {
  constructor(win, sourceElement) {
    /**
     * @protected @const {!Window}
     */
    this.win = win;

    /**
     * The element that is causing audio to be played.
     * @private @const {!Element}
     */
    this.sourceElement_ = sourceElement;

    this.depth_ = Playable.calculateDepthForElement(sourceElement);
  }

  /**
   * Gets the depth in the tree for the specified element.
   * @param {!Element} element
   * @return {number} The element's depth from the root of the DOM tree.
   */
  static calculateDepthForElement(element) {
    // Calculate the tree depth of the specified element.
    let depth = 0;
    for (let el = element; el; el = el.parentElement) {
      depth++;
    }

    // The depth of background audio elements is one less, since we add the
    // <audio> tag as a child of the element on which the background-audio
    // attribute is specified.
    if (element.classList.contains(BACKGROUND_AUDIO_ELEMENT_CLASS_NAME)) {
      depth--;
    }

    return depth;
  }

  /**
   * @return {!Element} The element causing audio to be played.
   */
  getSourceElement() {
    return this.sourceElement_;
  }

  /**
   * @return {!Element}
   */
  getDepth() {
    return this.depth_;
  }

  /**
   * Loads the resources necessary to play this item.  Should be a no-op if
   * called when the item is already loaded.
   * @return {!Promise} A promise that is resolved once the resource has been
   *     loaded.
   */
  load() {
    return Promise.resolve();
  }

  /**
   * @return {boolean} true, if this item's resources have been loaded.
   */
  isLoaded() {
    return false;
  }

  /**
   * Causes this item to start playing if it was not already playing.  load()
   * will be called before play() in all cases.  play() should be a no-op if the
   * item is already being played.
   */
  play() {}

  /**
   * Sets the volume of this item to the specified volume, over the specified
   * duration of time.
   *
   * @param {number} unusedVolume A volume from 0.0 (silent) to 1.0 (loudest).
   * @param {number} unusedDurationMs The duration over which the new volume
   *     should be achieved.
   * @param {!function(number): number} unusedEasingFn The easing function which
   *     describes the curve the volume should be modified.
   */
  setVolume(unusedVolume, unusedDurationMs, unusedEasingFn) {}

  /**
   * Causes this item to stop playing if it was playing.  stop() should be a
   * no-op if the item is already stopped.
   */
  stop() {}

  /**
   * Unloads the resources associated with this item.  Can be called to free up
   * resources.  Should be a no-op if called when the item is not yet loaded.
   */
  unload() {}

  /**
   * Mutes this item, without affecting its volume or play state.
   */
  mute() {}

  /**
   * Unmutes this item, without affecting its volume or play state.
   */
  unmute() {}

  /**
   * @return {boolean} true, if this item is muted; false otherwise.
   */
  isMuted() {}
}


/**
 * An HTMLMediaElement that potentially has audio.
 */
class MediaElementPlayable extends Playable {
  constructor(win, element) {
    super(win, element);
    this.element_ = element;
  }

  /** @override */
  isLoaded() {
    return !!this.element_;
  }

  /** @override */
  isPlaying() {
    return !this.element_.paused;
  }

  /** @override */
  play() {
    this.element_.play();
  }

  /** @override */
  setVolume(volume, durationMs, easingFn) {
    // TODO(newmuis): Fade to volume over durationMs following easingFn.
    if (volume === this.element_.volume) {
      return;
    }

    this.element_.volume = volume;
  }

  /** @override */
  stop() {
    this.element_.pause();
    this.element_.currentTime = 0;
  }

  /** @override */
  mute() {
    this.element_.muted = true;
  }

  /** @override */
  unmute() {
    this.element_.muted = false;
  }

  /** @override */
  isMuted() {
    return this.element_.muted;
  }
}
