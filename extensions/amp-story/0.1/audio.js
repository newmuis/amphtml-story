import {dev} from '../../../src/log';
import {xhrFor} from '../../../src/services';

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

/** @const {!AudioContext} */
const context = new (window.AudioContext || window.webkitAudioContext)();


export class AudioManager {
  constructor() {
    /** @const {!Object<number, Playable>} */
    this.playables_ = {};

    /** @const {!Array<number>} */
    this.nowPlaying_ = [];

    /** @type {number} */
    this.nextId_ = 0;
  }

  createPlayable_(elementOrSource, priority) {
    if (elementOrSource instanceof Element) {
      return new ElementPlayable(
          /** @type {!Element} */ (elementOrSource), priority);
    } else if (typeof elementOrSource === 'string') {
      return new BackgroundPlayable(
          /** @type {string} */ (elementOrSource), priority);
    }

    dev().error('amp-story', 'Played item must be element or source URI.');
  }

  load(elementOrSource, priority) {
    const id = this.nextId_++;
    const playable = this.createPlayable_(elementOrSource, priority);
    this.playables_[id] = playable;

    return playable.load()
        .then(() => id);
  }

  play(id) {
    dev().assert(this.playables_[id],
        `Attempted to play non-existant audio: ${id}`);
    this.nowPlaying_[id] = true;
    this.playables_[id].play();
  }

  stop(id) {
    dev().assert(this.playables_[id],
        `Attempted to stop non-existant audio: ${id}`);
    delete this.nowPlaying_[id];
    this.playables_[id].stop();
  }
}


class Playable {
  constructor(priority) {
    this.priority = priority;
  }

  /**
   * Loads the resources necessary to play this item.  Should be a no-op if
   * called when the item is already loaded.
   */
  load() {}

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
   * @param {function(number): number} unusedEasingFn The easing function which
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
}


/**
 * A playable piece of audio loaded from a URI.
 */
class BackgroundPlayable extends Playable {
  constructor(sourceUri, priority) {
    super(priority);

    this.sourceUri_ = sourceUri;

    this.buffer_ = null;
  }

  /**
   * 
   * @param {*} buffer 
   * @return {!AudioSource}
   */
  createSource_(buffer) {
    const source = context.createBufferSource();
    const gainNode = context.createGain();

    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    gainNode.connect(context.destination);

    return {
      source,
      gainNode,
    };
  }

  /** @override */
  isLoaded() {
    return !!this.buffer_;
  }

  /** @override */
  load() {
    if (this.isLoaded()) {
      return Promise.resolve(this.buffer_);
    }

    return xhrFor(window)
        .fetch(this.sourceUri_)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => this.decodeAudioData_(arrayBuffer))
        .then(buffer => this.buffer_ = buffer);
  }


  /**
   * Transforms an ArrayBuffer into an audio buffer.
   * @param {!ArrayBuffer} arrayBuffer The array buffer containing the bytes of
   *     the audio to be decoded.
   * @return {!Promise<!AudioBuffer>}
   * @private
   */
  decodeAudioData_(arrayBuffer) {
    return new Promise((resolve, reject) => {
      context.decodeAudioData(arrayBuffer,
          audioBuffer => resolve(audioBuffer), error => reject(error));
    });
  }

  /** @override */
  play() {
    this.load()
        .then(buffer => this.createSource_(buffer))
        .then(source => this.playSource_(source));
  }

  /**
   * @param {!AudioSource} audioSource
   * @private
   */
  playSource_(audioSource) {
    if (audioSource.source.start) {
      audioSource.source.start(0);
    } else {
      audioSource.source.noteOn(0);
    }
  }

  /** @override */
  setVolume(volume, durationMs, easingFn) {
    console.log(`Setting volume to ${volume} over ${durationMs}`);
  }

  /** @override */
  unload() {
    this.buffer_ = null;
  }
}

class ElementPlayable extends Playable {
  constructor(element, priority) {
    super(priority);


    dev().assert(element instanceof HTMLMediaElement,
        'Only media elements can be played.');

    this.element_ = element;
  }

  /** @override */
  load() {
    console.log('ElementPlayable does not load.');
  }

  /**
   * @return {boolean} true, if this item's resources have been loaded.
   */
  isLoaded() {
    return !!this.element_;
  }

  /** @override */
  play() {
    this.element_.play();
  }

  /** @override */
  setVolume(volume, durationMs, easingFn) {
    const startTimeMs = Date.now();

    function stepVolume() {
      this.vsync_.mutate(() => {
        const currentTimeMs = Date.now();
        const elapsedTimeMs = currentTimeMs - startTimeMs;
        const currentPercentage = elapsedTimeMs / durationMs;
        this.element_.volume = easingFn(currentPercentage);

        if (currentPercentage < 1) {
          stepVolume();
        }
      });
    }

    stepVolume();
  }

  /** @override */
  stop() {
    this.element_.pause();
    this.element_.currentTime = 0;
  }

  /** @override */
  unload() {
    console.log('ElementPlayable does not unload.');
  }
}
