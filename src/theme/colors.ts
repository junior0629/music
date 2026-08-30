/**
 * Color palette — minimalist lavender light theme.
 *
 * Inspired by Apple Music + Spotify discoverability but stripped of
 * glassmorphism. Pure whites, soft lavenders, a single purple accent.
 * No dark mode — the app is one aesthetic.
 *
 * Palette is intentionally narrow:
 *   - bgPage / bgPageSoft / bgPageTint for the three page tones
 *   - surface / surfaceMuted for cards and the search bar
 *   - primary / primarySoft / lavender / lavenderSoft for purple identity
 *   - textPrimary / textSecondary / textMuted for hierarchy
 *   - border / borderStrong for dividers
 *   - shadow / shadowStrong for elevation
 */

export interface AccentGradient {
  /** First stop (top-left) */
  from: string;
  /** Middle stop */
  via: string;
  /** Last stop (bottom-right) */
  to: string;
}

export interface Palette {
  mode: 'light';

  // ── Page ────────────────────────────────────────────────────────────
  /** Page background — base layer behind everything */
  bgPage: string;
  /** Slightly tinted page background (for the body of every tab) */
  bgPageSoft: string;
  /** Lavender tint for the Profile header & gradient flourishes */
  bgPageTint: string;

  // ── Surfaces ────────────────────────────────────────────────────────
  /** White card surface */
  surface: string;
  /** Lavender-tinted surface — search bar, inactive chips */
  surfaceMuted: string;
  /** White surface with stronger shadow — mini player, bottom nav */
  surfaceStrong: string;

  // ── Brand purples ───────────────────────────────────────────────────
  /** Primary accent — active states, play button, brand */
  primary: string;
  /** Softer primary — gradients, secondary brand */
  primarySoft: string;
  /** Mid-tone lavender — inactive accents, illustrations */
  lavender: string;
  /** Very light lavender — gentle backgrounds, hover states */
  lavenderSoft: string;

  /** Accent gradient used for premium card & play-button glow */
  accentGradient: AccentGradient;

  // ── Text ────────────────────────────────────────────────────────────
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnPrimary: string;

  // ── Borders ─────────────────────────────────────────────────────────
  border: string;
  borderStrong: string;

  // ── Semantic ────────────────────────────────────────────────────────
  danger: string;
  success: string;

  // ── Shadows ─────────────────────────────────────────────────────────
  shadow: string;
  shadowStrong: string;
}

const accentGradient: AccentGradient = {
  from: '#A78BFA',
  via: '#C4B5FD',
  to: '#E9D5FF',
};

export const palette: Palette = {
  mode: 'light',

  // Page — off-white with the faintest lavender warmth
  bgPage:       '#FFFFFF',
  bgPageSoft:   '#FAF8FF',
  bgPageTint:   '#F3E8FF',

  // Surfaces
  surface:       '#FFFFFF',
  surfaceMuted:  '#F3E8FF',
  surfaceStrong: '#FFFFFF',

  // Brand
  primary:      '#7C3AED',
  primarySoft:  '#A78BFA',
  lavender:     '#E9D5FF',
  lavenderSoft: '#F3E8FF',

  accentGradient,

  // Text
  textPrimary:   '#17131F',
  textSecondary: '#777080',
  textMuted:     '#A099B0',
  textInverse:   '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Borders
  border:       '#EEEAF5',
  borderStrong: '#E0D9F0',

  // Semantic
  danger:  '#DC2626',
  success: '#16A34A',

  // Soft purple-tinted shadows
  shadow:       'rgba(124, 58, 237, 0.06)',
  shadowStrong: 'rgba(124, 58, 237, 0.12)',
};

/**
 * Re-exported as a single object so the rest of the codebase can
 * still import the same names. `darkPalette` is intentionally gone.
 */
export { palette as lightPalette };
