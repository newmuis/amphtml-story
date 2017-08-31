import {px} from '../../../src/style';


/** @const {!Object<string, ./animation-types.AnimationPresetDef>} */
// First keyframe will always be considered offset: 0 and will be applied to the
// element as the first frame before animation starts.
export const PRESETS = {
  'pulse': {
    duration: 500,
    easing: 'linear',
    keyframes: [
      {
        offset: 0,
        transform: 'scale(1)',
      },
      {
        offset: 0.25,
        transform: 'scale(0.95)',
      },
      {
        offset: 0.75,
        transform: 'scale(1.05)',
      },
      {
        offset: 1,
        transform: 'scale(1)',
      },
    ],
  },
  'fly-in-left': {
    duration: 500,
    easing: 'ease-out',
    keyframes(dimensions) {
      const offsetX = -(dimensions.targetX + dimensions.targetWidth);

      return [
        {transform: `translate(${px(offsetX)}, 0)`},
        {transform: 'translate(0, 0)'},
      ];
    },
  },
  'fly-in-right': {
    duration: 500,
    easing: 'ease-out',
    keyframes(dimensions) {
      const offsetX = dimensions.pageWidth - dimensions.targetX;

      return [
        {transform: `translate(${px(offsetX)}, 0)`},
        {transform: 'translate(0, 0)'},
      ];
    },
  },
  'bounce': {
    duration: 1600,
    keyframes: [
      {
        offset: 0,
        transform: 'translateY(-200px)',
        opacity: 0,
        easing: 'cubic-bezier(.75,.05,.86,.08)'
      },
      {
        offset: 0.3,
        transform: 'translateY(0)',
        opacity: 1,
        easing: 'cubic-bezier(.22,.61,.35,1)'
      },
      {
        offset: 0.52,
        transform: 'translateY(-110px)',
        opacity: 1,
        easing: 'cubic-bezier(.75,.05,.86,.08)'
      },
      {
        offset: 0.74,
        transform: 'translateY(0)',
        opacity: 1,
        easing: 'cubic-bezier(.22,.61,.35,1)'
      },
      {
        offset: 0.83,
        transform: 'translateY(-50px)',
        opacity: 1,
        easing: 'cubic-bezier(.75,.05,.86,.08)'
      },
      {
        offset: 1,
        transform: 'translateY(0)',
        opacity: 1,
        easing: 'cubic-bezier(.22,.61,.35,1)'
      }
    ]
  }
};
