/**
 * GradientBackground — the page-level atmospheric gradient.
 *
 * Phase 2: gradient stops are derived from the currently playing
 * album artwork's dominant colors (extracted by `extractPalette`).
 * Falls back to the theme's static gradient when no track is loaded
 * or palette extraction isn't supported (e.g., on native for now).
 *
 * Subtle transition: the gradient shifts smoothly when a new track
 * plays. Implementation note: react-native-reanimated could give
 * us GPU-accelerated transitions, but LinearGradient doesn't
 * animate its `colors` prop. For now, we just re-render on palette
 * change. The "transition" is the React reconciliation, which is
 * fast enough for ~3-color gradients.
 *
 * Lives behind everything. Renders once at the root.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/theme';
import { usePaletteStore } from '@/store/paletteStore';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props): React.ReactElement {
  const colors = useColors();
  const palette = usePaletteStore((s) => s.palette);

  // Blend the theme base with the extracted palette. We never
  // *replace* the theme — the palette only nudges the gradient
  // stops, so the app keeps its light/dark character.
  const stops = useMemo<[string, string, string]>(() => {
    if (!palette) {
      return [colors.bgBase, colors.bgBaseAlt, colors.bgBase];
    }
    return [colors.bgBase, palette.primary, palette.secondary];
  }, [palette, colors.bgBase, colors.bgBaseAlt]);

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle accent bloom in the top-right to give the page a sense of life */}
      <LinearGradient
        colors={[colors.accentSoft, 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
