import { Platform, ViewStyle } from 'react-native';

/**
 * Soft shadow presets.
 *
 * The new aesthetic is subtle elevation. On Android we use `elevation`
 * (which is the only shadow the platform renders); on iOS and web we
 * use the spread style with a low-opacity purple tint that matches
 * the brand. Numbers are tuned for cards floating just above a
 * white page.
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
    sm:   makeShadow(shadowColor, 2, 8, 0.6, 2),
    /** Medium — for floating elements (mini player, modals) */
    md:   makeShadow(shadowColor, 4, 16, 0.8, 6),
    /** Strong — for the Now Playing screen + player overlay */
    lg:   makeShadow(shadowColorStrong, 8, 24, 1, 12),
    /** Soft glow — for the play button */
    glow: makeShadow(shadowColorStrong, 4, 20, 0.9, 8),
  };
}

export type ShadowToken = 'sm' | 'md' | 'lg' | 'glow';
