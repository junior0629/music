/**
 * Border radius scale.
 * Higher numbers = more rounded.
 * Use named tokens, not raw numbers, so the visual language stays consistent.
 */
export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export type RadiiToken = keyof typeof radii;
