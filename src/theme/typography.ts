import { Platform, TextStyle } from 'react-native';

/**
 * Typography scale. Uses the Oswald display face for that condensed,
 * modern, premium feel. Weights 200–700 are available on web via
 * Google Fonts (loaded from src/theme/global.css.ts). On native,
 * the system font applies as a fallback until the .ttf files are
 * shipped in assets/fonts/ and loaded via expo-font.
 */
const oswald = 'Oswald';

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'Oswald',
});

const systemFontMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'Oswald',
});

export const fontFamily = {
  regular: systemFont as string,
  medium: systemFontMedium as string,
  // Exposed for any component that wants to use Oswald directly
  oswald,
};

export const fontWeight: Pick<TextStyle, 'fontWeight'> = {
  fontWeight: '400',
};

interface TypeStyle {
  size: number;
  weight: '200' | '300' | '400' | '500' | '600' | '700';
  lineHeight: number;
  letterSpacing?: number;
}

export const typography: Record<string, TypeStyle> = {
  // Major headings, screen titles
  display: { size: 32, weight: '600', lineHeight: 38, letterSpacing: 0 },
  // Section headings
  title: { size: 22, weight: '600', lineHeight: 28, letterSpacing: 0 },
  // Card titles, song names
  heading: { size: 17, weight: '500', lineHeight: 22, letterSpacing: 0.2 },
  // Body, artist names
  body: { size: 15, weight: '400', lineHeight: 20, letterSpacing: 0.2 },
  // Secondary
  bodyRegular: { size: 15, weight: '300', lineHeight: 20, letterSpacing: 0.2 },
  // Captions, timestamps
  caption: { size: 13, weight: '400', lineHeight: 16, letterSpacing: 0.3 },
  // Small labels
  label: { size: 11, weight: '500', lineHeight: 14, letterSpacing: 0.8 },
};

export type TypographyToken = keyof typeof typography;

/**
 * Helper to turn a typography token into a TextStyle.
 * We don't import useColors here — color is applied at the component level.
 *
 * We use the same font family for all weights because Oswald is a
 * variable font on web (the weight is controlled by `fontWeight`).
 * On native without the font file installed, the system font handles it.
 */
export function textStyle(token: TypographyToken): TextStyle {
  const t = typography[token];
  return {
    fontFamily: oswald,
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontWeight: t.weight,
    letterSpacing: t.letterSpacing ?? 0,
  };
}
