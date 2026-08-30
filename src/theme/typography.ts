import { Platform, TextStyle } from 'react-native';

/**
 * Typography scale — iOS-like hierarchy.
 *
 *   display  : screen titles ("Discover", "Your Library")
 *   title    : section headings ("Jump Back In", "Made For Alex")
 *   heading  : card titles, song names
 *   body     : subtitles, supporting text
 *   caption  : metadata, timestamps
 *   label    : small uppercase labels
 *
 * We use the system font on iOS and Android (no Oswald) so the
 * text matches the platform's native feel. The system font is
 * also what the reference design implies.
 */
const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const systemFontMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const systemFontSemibold = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const systemFontBold = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const fontFamily = {
  regular: systemFont as string,
  medium: systemFontMedium as string,
  semibold: systemFontSemibold as string,
  bold: systemFontBold as string,
};

interface TypeStyle {
  size: number;
  weight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
  letterSpacing?: number;
}

export const typography: Record<string, TypeStyle> = {
  // Screen titles — "Discover", "Your Library", "Profile"
  display: { size: 28, weight: '700', lineHeight: 34, letterSpacing: -0.4 },
  // Section headings — "Jump Back In", "Made For Alex"
  title:   { size: 20, weight: '700', lineHeight: 26, letterSpacing: -0.2 },
  // Card titles, song names
  heading: { size: 16, weight: '600', lineHeight: 22, letterSpacing: -0.1 },
  // Subtitles, supporting text
  body:    { size: 15, weight: '400', lineHeight: 20, letterSpacing: 0 },
  // Metadata, timestamps
  caption: { size: 13, weight: '500', lineHeight: 18, letterSpacing: 0 },
  // Small uppercase labels
  label:   { size: 11, weight: '600', lineHeight: 14, letterSpacing: 1.2 },
  // Smallest, for stat labels
  micro:   { size: 11, weight: '600', lineHeight: 14, letterSpacing: 0.6 },
};

export type TypographyToken = keyof typeof typography;

/**
 * Helper to turn a typography token into a TextStyle.
 * Color is applied at the component level — never here.
 */
export function textStyle(token: TypographyToken): TextStyle {
  const t = typography[token];
  return {
    fontFamily: systemFont,
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontWeight: t.weight,
    letterSpacing: t.letterSpacing ?? 0,
  };
}
