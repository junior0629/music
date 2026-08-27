/**
 * Spacing scale. 4-pt grid.
 * Use these instead of raw numbers so layout rhythm is consistent.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;
