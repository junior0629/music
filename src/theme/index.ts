/**
 * Theme barrel + useColors hook.
 *
 * Reads the current theme mode from the Zustand store and returns the
 * active palette. Components consume this via:
 *
 *   const colors = useColors();
 *   const { sm } = useShadows();
 *
 * The store-driven hook means theme changes re-render consumers
 * automatically. No React Context needed.
 */
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, Palette } from './colors';
import { makeShadows, ShadowToken } from './shadows';
import { ViewStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

export { radii } from './radii';
export type { RadiiToken } from './radii';
export { spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { typography, textStyle, fontFamily } from './typography';
export type { TypographyToken } from './typography';
export { isWeb, isIOS, isAndroid, isNative } from './platform';
export type { Palette, ThemeMode, AccentGradient } from './colors';

export function useColors(): Palette {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  const effective = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;
  return effective === 'light' ? lightPalette : darkPalette;
}

export function useShadows(): Record<ShadowToken, ViewStyle> {
  const colors = useColors();
  return useMemo(() => makeShadows(colors.shadow, colors.shadowStrong), [colors]);
}
