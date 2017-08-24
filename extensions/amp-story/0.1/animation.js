import {Services} from '../../../src/services';
import {
  WebAnimationPlayState,
} from '../../amp-animation/0.1/web-animation-types';
import {dev, user} from '../../../src/log';
import {map} from '../../../src/utils/object';
import {once} from '../../../src/utils/function';
import {setStyle, resetStyles} from '../../../src/style';


import {PRESETS} from './animation-presets';


const ANIMATE_IN_ATTRIBUTE_NAME = 'animate-in';
const ANIMATE_IN_DURATION_ATTRIBUTE_NAME = 'animate-in-duration';
const ANIMATE_IN_DELAY_ATTRIBUTE_NAME = 'animate-in-delay';


const ANIMATABLE_ELEMENTS_SELECTOR = `[${ANIMATE_IN_ATTRIBUTE_NAME}]`;


/** @typedef {!../../amp-animation/0.1/web-animations.WebAnimationRunner} */
let WebAnimationRunner;


/** @typedef {!../../amp-animation/0.1/web-animations.Builder} */
let WebAnimationBuilder;


/**
 * @typedef {
 *   !../../amp-animation/0.1/web-animation-types.WebKeyframeAnimationDef
 * }
 */
let WebKeyframeAnimationDef;


// This format does not match what's in amp-animation, but that shouldn't matter
// since it's a subset.
// TODO: Extract from amp-animation
/**
 * @param {string} time
 * @return {number}
 */
function timeStrToMillis(time) {
  const match = time.match(/^([0-9\.]+)\s*(s|ms)$/);

  const num = match[1];
  const units = match[2];

  user().assert(
      match &&
          match.length == 3 &&
          (units == 's' || units == 'ms'),
      'Invalid time string %s', time);

  return units == 's' ? parseFloat(num) * 1000 : parseInt(num, 10);
}


/**
 * @param {!Object<string, *>} frameDef
 * @return {!Array<string>}
 */
function getCssProps(frameDef) {
  return Object.keys(frameDef).filter(k => k != 'offset');
}


/**
 * @param {!Element} element
 * @return {boolean}
 */
// TODO(alanorozco): maybe memoize?
export function hasAnimations(element) {
  return !!element.querySelector(ANIMATABLE_ELEMENTS_SELECTOR);
}


/** @enum {number} */
const PlaybackActivity = {
  START: 0,
  FINISH: 1,
};


/** Wraps WebAnimationRunner for story page elements. */
class AnimationRunner {
  /**
   * @param {!StoryAnimationDef} animationDef
   * @param {!Promise<!WebAnimationBuilder>} webAnimationBuilderPromise
   * @param {!../../../src/service/vsync-impl.Vsync} vsync
   * @param {!../../../src/service/timer-impl.Timer} timer
   */
  constructor(animationDef, webAnimationBuilderPromise, vsync, timer) {
    /** @private @const */
    this.timer_ = timer;

    /** @private @const */
    this.vsync_ = vsync;

    /** @private @const */
    this.animationDef_ = animationDef;

    /** @private @const */
    this.presetDef_ = animationDef.preset;

    /** @private @const */
    this.target_ = dev().assertElement(animationDef.target);

    /** @private @const */
    this.firstFrameDef_ = dev().assert(animationDef.preset.keyframes[0]);

    /** @private @const */
    this.delay_ = animationDef.delay || this.presetDef_.delay || 0;

    /** @private @const */
    this.duration_ = animationDef.duration || this.presetDef_.duration || 0;

    /** @private @const {!Promise<!WebAnimationRunner>} */
    this.runnerPromise_ =
        webAnimationBuilderPromise
            .then(builder => builder.createRunner(this.getWebAnimationDef_()));

    /** @private {?WebAnimationRunner} */
    this.runner_ = null;

    /** @private {?PlaybackActivity} */
    this.scheduledActivity_ = null;

    /** @private {?Promise} */
    this.scheduledWait_ = null;

    /** @private */
    this.runnerReset_ = true;

    /** @private */
    this.firstFrameApplied_ = false;

    dev().assert(
        !this.firstFrameDef_.offset,
        'First keyframe offset for animation presets should be 0 or undefined');

    this.runnerPromise_.then(runner => this.onRunnerReady_(runner));
  }

  /**
   * @return {!WebKeyframeAnimationDef}
   * @private
   */
  getWebAnimationDef_() {
    return {
      target: this.target_,
      duration: `${this.duration_}ms`,
      keyframes: this.presetDef_.keyframes,
    };
  }

  /**
   * @return {!Promise<void>}
   * @private
   */
  applyFirstFrame() {
    if (this.firstFrameApplied_) {
      return;
    }

    this.firstFrameApplied_ = true;

    return this.vsync_.mutatePromise(() => {
      getCssProps(this.firstFrameDef_).forEach(k => {
        setStyle(this.target_, k, this.firstFrameDef_[k]);
      });
    });
  }

  /** @private */
  resetFirstFrame_() {
    if (!this.firstFrameApplied_) {
      return;
    }

    this.firstFrameApplied_ = false;

    this.vsync_.mutate(() => {
      resetStyles(this.target_, getCssProps(this.firstFrameDef_));
    });
  }

  /** Starts or resumes the animation. */
  start() {
    if (this.hasStarted()) {
      return;
    }

    this.playback_(PlaybackActivity.START, this.delay_);
  }

  /**
   * @param {!WebAnimationRunner} runner
   * @private
   */
  startWhenReady_(runner) {
    const shouldStart = !!this.runnerReset_;

    this.runnerReset_ = false;

    this.resetFirstFrame_();

    if (shouldStart) {
      runner.start();
      return;
    }

    runner.resume();
  }

  /** @return {!Promise<boolean>} */
  hasStarted() {
    return this.isActivityScheduled_(PlaybackActivity.START) ||
        this.runner_ && dev().assert(this.runner_)
            .getPlayState() == WebAnimationPlayState.RUNNING;
  }

  /** Force-finishes all animations. */
  finish() {
    this.resetFirstFrame_();
    this.playback_(PlaybackActivity.FINISH);
  }

  /**
   * @param {!WebAnimationRunner} runner
   * @private
   */
  finishWhenReady_(runner) {
    if (runner.getPlayState() == WebAnimationPlayState.RUNNING) {
      runner.finish();
      this.runnerReset_ = true;
    }
  }

  /**
   * @param {!PlaybackActivity}
   * @param {number=} opt_delay
   */
  playback_(activity, opt_delay) {
    const wait = opt_delay ? this.timer_.promise(opt_delay) : null;

    this.scheduledActivity_ = activity;
    this.scheduledWait_ = wait;

    if (this.runner_) {
      this.playbackWhenReady_(activity, wait);
    }
  }

  /**
   * Executes playback activity if runner is ready.
   * @param {!PlaybackActivity} activity
   * @param {?Promise} wait
   */
  playbackWhenReady_(activity, wait) {
    const runner = dev().assert(
        this.runner_,
        'Tried to execute playbackWhenReady_ before runner was resolved.');

    (wait || Promise.resolve()).then(() => {
      if (!this.isActivityScheduled_(activity)) {
        return;
      }

      this.scheduledActivity_ = null;
      this.scheduledWait_ = null;

      switch (activity) {
        case PlaybackActivity.START: return this.startWhenReady_(runner);
        case PlaybackActivity.FINISH: return this.finishWhenReady_(runner);
      }
    });
  }

  /**
   * Marks runner as ready and executes playback activity if needed.
   * @param {!WebAnimationRunner} runner
   * @return {boolean} True if modifies runner state
   * @private
   */
  onRunnerReady_(runner) {
    this.runner_ = runner;

    if (!this.isActivityScheduled_()) {
      return;
    }

    this.playbackWhenReady_(this.scheduledActivity_, this.scheduledWait_);
  }

  /**
   * @param {!PlaybackActivity=} opt_activity
   * @return {boolean}
   */
  isActivityScheduled_(opt_activity) {
    if (!opt_activity) {
      return this.scheduledActivity_ !== null;
    }
    return this.scheduledActivity_ === opt_activity;
  }
}


// TODO(alanorozco): Looping animations
/** Manager for animations in story pages. */
export class AnimationManager {
  /**
   * @param {!Element} root
   * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampdoc
   */
  constructor(root, ampdoc) {
    dev().assert(hasAnimations(root));

    /** @private @const */
    this.root = root;

    /** @private @const */
    this.ampdoc_ = ampdoc;

    /** @private @const */
    this.vsync_ = Services.vsyncFor(this.ampdoc_.win);

    /** @private @const */
    this.resources_ = Services.resourcesForDoc(this.ampdoc_);

    /** @private @const */
    this.timer_ = Services.timerFor(this.ampdoc_.win);

    /** @private @const */
    this.builderPromise_ = this.createAnimationBuilderPromise_();

    /** @private {?Array<!Promise<!AnimationRunner>>} */
    this.runners_ = null;
  }

  /**
   * Decouples constructor so it can be stubbed in tests.
   * @param {!Element} root
   * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampdoc
   * @return {!AnimationManager}
   */
  static create(root, ampdoc, baseUrl) {
    return new AnimationManager(root, ampdoc, baseUrl);
  }

  /**
   * Applies first frame to target element before starting animation.
   * @return {!Promise}
   */
  applyFirstFrame() {
    return Promise.all(
        this.getOrCreateRunners_().map(runner => runner.applyFirstFrame()));
  }

  /** Starts all transition-in animations for the page. */
  animateIn() {
    this.getRunners_().forEach(runner => runner.start());
  }

  /** Skips all transition-in animations for the page. */
  finishAll() {
    this.getRunners_().forEach(runner => runner.finish());
  }

  /** Determines if there is a transition-in animation running. */
  hasAnimationStarted() {
    return this.getRunners_().some(runner => runner.hasStarted());
  }

  /** @private */
  getRunners_() {
    return dev().assert(this.runners_, 'Executed before applyFirstFrame');
  }

  /**
   * @return {!Array<!Promise<!AnimationRunner>>}
   * @private
   */
  getOrCreateRunners_() {
    if (!this.runners_) {
      this.runners_= Array.prototype.map.call(
          this.root.querySelectorAll(ANIMATABLE_ELEMENTS_SELECTOR),
          el => this.createRunner_(el))
    }
    return dev().assert(this.runners_);
  }

  /**
   * @param {!Element} el
   * @return {!Promise<!AnimationRunner>>}
   */
  createRunner_(el) {
    const preset = this.getPreset_(el);
    const animationDef = this.createAnimationDef(el, preset);

    return new AnimationRunner(
        animationDef,
        dev().assert(this.builderPromise_),
        this.vsync_,
        this.timer_);
  }

  /**
   * @param {!Element} el
   * @param {!./animation-types.StoryAnimationPresetDef} preset
   * @return {!./animation-types.StoryAnimationDef}
   */
  createAnimationDef(el, preset) {
    const animationDef = {target: el, preset};

    if (el.hasAttribute(ANIMATE_IN_DURATION_ATTRIBUTE_NAME)) {
      animationDef.duration =
          timeStrToMillis(el.getAttribute(ANIMATE_IN_DURATION_ATTRIBUTE_NAME));
    }

    if (el.hasAttribute(ANIMATE_IN_DELAY_ATTRIBUTE_NAME)) {
      animationDef.delay =
          timeStrToMillis(el.getAttribute(ANIMATE_IN_DELAY_ATTRIBUTE_NAME));
    }

    return animationDef;
  }

  /**
   * @param {!Element} el
   * @return {!Promise<!WebAnimationBuilder>}
   */
  createAnimationBuilderPromise_(el, animationDef) {
    return Services.extensionsFor(this.ampdoc_.win)
        .loadExtension('amp-animation')
        .then(() => Services.webAnimationServiceForOrNull(this.ampdoc_.win))
        .then(webAnimationService =>
            dev().assert(
                webAnimationService,
                'Could not resolve WebAnimationService'))
        .then(webAnimationService =>
            webAnimationService.createBuilder(
                    this.win_,
                    this.ampdoc_.getRootNode(),
                    this.ampdoc_.getUrl(),
                    this.vsync_,
                    this.resources_));
  }

  /**
   * @param {string} name
   * @return {?./animation-types.StoryAnimationPresetDef}
   */
  getPreset_(el) {
    const name = el.getAttribute(ANIMATE_IN_ATTRIBUTE_NAME);

    return user().assert(
        PRESETS[name],
        'Invalid %s preset "%s" for element %s',
        ANIMATE_IN_ATTRIBUTE_NAME,
        name,
        el);
  }
}
