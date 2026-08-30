/**
 * Theme barrel + useColors hook.
 *
 * The app is light-only. `useColors()` always returns the single
 * lavender palette. We keep the hook signature so existing call
 * sites don't need to change.
 */
import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { palette, Palette } from './colors';
import { makeShadows, ShadowToken } from './shadows';

export { radii } from './radii';
export type { RadiiToken } from './radii';
export { spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { typography, textStyle, fontFamily } from './typography';
export type { TypographyToken } from './typography';
export { isWeb, isIOS, isAndroid, isNative } from './platform';
export type { Palette, AccentGradient } from './colors';

export function useColors(): Palette {
  return palette;
}

export function useShadows(): Record<ShadowToken, ViewStyle> {
  return useMemo(
    () => makeShadows(palette.shadow, palette.shadowStrong),
    [],
  );
}
