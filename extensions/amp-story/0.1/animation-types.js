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
 *  startAfterId: string|undefined,
 *  preset: !StoryAnimationPresetDef,
 *  duration: number=,
 *  delay: number=,
 * }}
 */
export let StoryAnimationDef;
