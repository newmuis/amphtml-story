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
      return new ElementPlayable(elementOrSource, priority);
    } else if (elementOrSource instanceof String) {
      return new BackgroundPlayable(elementOrSource, priority);
    }

    dev().error('amp-story', 'Played item must be element or source URI.');
  }

  load(elementOrSource, priority) {
    const id = this.nextId_++;
    const playable = this.createPlayable_(elementOrSource, priority);
    this.playables_[id] = playable;

    return id;
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
    this.volume = 1;
  }

  load() {}

  play() {}

  stop() {}
}

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


  /**
   * 
   * @param {*} sourceUri 
   */
  load() {
    if (this.buffer_) {
      return Promise.resolve(this.buffer_);
    }

    return xhrFor(this.win)
        .fetch(this.sourceUri_)
        .then(response => this.decodeAudioData_(response))
        .then(buffer => this.buffer_ = buffer);
  }


  decodeAudioData_(response) {
    return new Promise((resolve, reject) => {
      context.decodeAudioData(response.arrayBuffer(),
          buffer => resolve(buffer), error => reject(error));
    });
  }


  play() {
    this.preloadBuffer()
        .then(buffer => this.createSource_(buffer))
        .then(source => this.playSource_(source));
  }


  /**
   * @param {!AudioSource} audioSource
   * @private
   */
  playSource_(audioSource) {
    if (!audioSource.source.start) {
      audioSource.source.noteOn(0);
    } else {
      audioSource.source.start(0);
    }
  }
}

class ElementPlayable extends Playable {

}
