/**
 * Color palette — dark and light.
 * Dark is the primary "premium glassmorphism" mode.
 * Light is a softer alternative; glassmorphism still works but with
 * a different atmosphere.
 *
 * Palette is intentionally narrow: deep base, white-ish text,
 * translucent white glass, accent gradients.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AccentGradient {
  /** First stop (top-left) */
  from: string;
  /** Middle stop */
  via: string;
  /** Last stop (bottom-right) */
  to: string;
}

export interface Palette {
  mode: 'dark' | 'light';

  /** Page background — base layer behind everything */
  bgBase: string;
  /** Second stop of the page background gradient */
  bgBaseAlt: string;

  /** Foreground text */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  /** Glass surfaces (translucent over the background) */
  glassSurface: string;        // default
  glassSurfaceStrong: string; // heavier, for nav/mini-player
  glassSurfaceSubtle: string; // lighter, for hover/pressed states
  glassBorder: string;
  glassBorderStrong: string;
  glassHighlight: string;      // top inner stroke

  /** Accent — used for play buttons, active states */
  accent: string;
  accentSoft: string;
  accentGradient: AccentGradient;

  /** Semantic */
  danger: string;
  success: string;

  /** Shadows */
  shadow: string;
  shadowStrong: string;
}

const darkAccent: AccentGradient = {
  from: '#7C3AED', // violet
  via: '#EC4899',  // pink
  to: '#3B82F6',   // blue
};

const lightAccent: AccentGradient = {
  from: '#8B5CF6',
  via: '#F472B6',
  to: '#60A5FA',
};

export const darkPalette: Palette = {
  mode: 'dark',

  bgBase: '#0A0A14',
  bgBaseAlt: '#14142B',

  textPrimary: 'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.70)',
  textMuted: 'rgba(255,255,255,0.45)',
  textInverse: '#0A0A14',

  glassSurface: 'rgba(255,255,255,0.06)',
  glassSurfaceStrong: 'rgba(255,255,255,0.10)',
  glassSurfaceSubtle: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderStrong: 'rgba(255,255,255,0.18)',
  glassHighlight: 'rgba(255,255,255,0.18)',

  accent: '#A78BFA',
  accentSoft: 'rgba(167,139,250,0.20)',
  accentGradient: darkAccent,

  danger: '#F87171',
  success: '#34D399',

  shadow: 'rgba(0,0,0,0.40)',
  shadowStrong: 'rgba(0,0,0,0.60)',
};

export const lightPalette: Palette = {
  mode: 'light',

  // Medium light purple — the new default. Saturated enough that
  // glassmorphism still pops, but unmistakably purple.
  bgBase: '#C4B5FD',     // violet-300
  bgBaseAlt: '#A78BFA',  // violet-400

  textPrimary: 'rgba(30,15,60,0.92)',     // deep purple-black, high contrast over light purple
  textSecondary: 'rgba(30,15,60,0.70)',
  textMuted: 'rgba(30,15,60,0.50)',
  textInverse: '#FFFFFF',

  // Slightly cooler-tinted glass for the light purple background.
  // White glass on a purple base reads pinkish, so we bias toward
  // a faintly cool white to keep it neutral.
  glassSurface: 'rgba(255,255,255,0.45)',
  glassSurfaceStrong: 'rgba(255,255,255,0.60)',
  glassSurfaceSubtle: 'rgba(255,255,255,0.30)',
  glassBorder: 'rgba(255,255,255,0.55)',
  glassBorderStrong: 'rgba(255,255,255,0.75)',
  glassHighlight: 'rgba(255,255,255,0.85)',

  accent: '#6D28D9',     // violet-700, more saturated for legibility on light purple
  accentSoft: 'rgba(109,40,217,0.18)',
  accentGradient: lightAccent,

  danger: '#DC2626',
  success: '#059669',

  shadow: 'rgba(60,30,120,0.22)',
  shadowStrong: 'rgba(60,30,120,0.35)',
};
