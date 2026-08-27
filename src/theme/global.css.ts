/**
 * Web-only global stylesheet. Imported once from the root layout.
 *
 * On web, this injects a <style> block via React Native Web that
 * imports the Oswald font from Google Fonts. On native, this file
 * is unused — the system font applies. When you want Oswald on
 * native too, download the .ttf files, drop them in assets/fonts/,
 * and use `useFonts` from expo-font to load them at startup.
 */
import { Platform } from 'react-native';

export const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap');

* {
  font-family: 'Oswald', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

/**
 * Apply global web styles. No-op on native.
 * Imported by the root layout.
 */
export function applyGlobalWebStyles(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  const id = 'music-global-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = GLOBAL_STYLES;
  document.head.appendChild(style);
}
