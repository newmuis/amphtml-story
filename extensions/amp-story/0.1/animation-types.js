/** @typedef {!Array<!Object<string, *>>} */
export let Keyframes;


/** @typedef {(function(StoryAnimationTargetDims):!Keyframes)|!Keyframes} */
export let KeyframesOrFilterFn;


/**
 * @typedef {{
 *   pageWidth: number,
 *   pageHeight: number,
 *   targetWidth: number,
 *   targetHeight: number,
 *   targetX: number,
 *   targetY: number,
 * }}
 */
export let StoryAnimationDims;


/**
 * @typedef {{
 *   duration: number,
 *   easing: string|undefined,
 *   keyframes: !KeyframesOrFilterFn,
 * }}
 */
export let StoryAnimationPresetDef;


/**
 * @typedef {{
 *  target: !Element,
 *  startAfterId: string|undefined,
 *  preset: !StoryAnimationPresetDef,
 *  duration: number=,
 *  delay: number=,
 * }}
 */
export let StoryAnimationDef;
