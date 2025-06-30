export const CARD_DIMENSIONS = {
  minHeight: '70dvh',
  maxHeight: '80dvh',
  maxWidth: 360,
} as const;

export const ANIMATION_DURATION = 600;

export const CARD_CONTAINER_STYLE = {
  maxWidth: CARD_DIMENSIONS.maxWidth,
  width: '100%',
  minHeight: CARD_DIMENSIONS.minHeight,
  maxHeight: CARD_DIMENSIONS.maxHeight,
} as const;