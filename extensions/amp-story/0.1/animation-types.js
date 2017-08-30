/**
 * @typedef {{
 *   duration: number,
 *   easing: string,
 *   keyframes: !Array<!Object<string, *>>
 * }}
 */
export let StoryAnimationPresetDef;


/**
 * @typedef {{
 *  target: !Element,
 *  preset: !StoryAnimationPresetDef,
 *  duration: number=,
 *  delay: number=,
 * }}
 */
export let StoryAnimationDef;
