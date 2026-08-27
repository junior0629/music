/**
 * GlassPanel — heavier glass surface for floating UI (nav, mini-player, modals).
 * Real backdrop blur enabled, stronger surface tint, larger radius.
 */
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors, useShadows, isWeb, radii, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
  /** Blur intensity, 0-100. Defaults are tuned for "frosted". */
  blurIntensity?: number;
}

export function GlassPanel({
  children,
  style,
  padding = spacing.md,
  radius = radii.xl,
  blurIntensity = isWeb ? 30 : 40,
}: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.glassSurfaceStrong,
          borderColor: colors.glassBorderStrong,
          borderRadius: radius,
          padding,
        },
        shadows.lg,
        style,
      ]}
    >
      {Platform.OS !== 'android' ? (
        <BlurView
          intensity={blurIntensity}
          tint={colors.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          { borderColor: colors.glassHighlight, borderRadius: radius },
        ]}
      />
      <View style={{ position: 'relative' }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
});
