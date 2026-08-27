import { Platform, ViewStyle } from 'react-native';

/**
 * Soft shadow presets.
 * On Android we use `elevation`; on iOS and web we use the spread style.
 */
function makeShadow(
  color: string,
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number,
): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
}

export function makeShadows(shadowColor: string, shadowColorStrong: string) {
  return {
    /** Subtle — for cards in lists */
    sm: makeShadow(shadowColor, 4, 12, 0.25, 2),
    /** Medium — for floating panels */
    md: makeShadow(shadowColor, 8, 24, 0.35, 6),
    /** Strong — for the player screen, modals */
    lg: makeShadow(shadowColorStrong, 12, 32, 0.45, 12),
    /** Glow — for accent halo around the play button */
    glow: {
      ...makeShadow(shadowColorStrong, 0, 24, 0.6, 8),
    },
  };
}

export type ShadowToken = 'sm' | 'md' | 'lg' | 'glow';
