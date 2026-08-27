/**
 * GlassCard — the workhorse glass surface.
 *
 * Renders a translucent surface with a subtle border, a top inner
 * highlight, and a soft shadow. Use for cards in lists, panels, etc.
 *
 * On web and iOS we layer a BlurView behind the surface for a real
 * frosted-glass look. On Android, BlurView is heavier — we use a
 * subtle gradient overlay instead (visually almost identical, much
 * cheaper to render). See: performance note in README.
 *
 * Most cards don't need blur. The default is `blur={false}` and the
 * surface reads as glass via rgba + border + highlight alone.
 * Enable blur when there's actually content behind it that should
 * appear blurred (e.g., the floating nav over a busy screen).
 */
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors, useShadows, radii, spacing, RadiiToken } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Card padding (spacing token or number) */
  padding?: keyof typeof spacing | number;
  /** Border radius (radii token or number) */
  radius?: RadiiToken | number;
  /** When true, uses heavier glass tint suitable for floating UI */
  strong?: boolean;
  /** When true, applies a backdrop blur (iOS/web only, cheap gradient on Android) */
  blur?: boolean;
  /** Shadow size token */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function GlassCard({
  children,
  style,
  padding = 'md',
  radius = 'lg',
  strong = false,
  blur = false,
  shadow = 'sm',
}: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  const padVal = typeof padding === 'number' ? padding : spacing[padding];
  const radVal = typeof radius === 'number' ? radius : radii[radius];

  const surface = strong ? colors.glassSurfaceStrong : colors.glassSurface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surface,
          borderColor: colors.glassBorder,
          borderRadius: radVal,
          padding: padVal,
        },
        shadow !== 'none' ? shadows[shadow] : null,
        style,
      ]}
    >
      {blur ? <CardBlur /> : null}
      {/* Top inner highlight — gives the glass a "lit from above" feel */}
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          { borderColor: colors.glassHighlight, borderRadius: radVal },
        ]}
      />
      <View style={{ position: 'relative' }}>{children}</View>
    </View>
  );
}

function CardBlur(): React.ReactElement | null {
  if (Platform.OS === 'android') {
    // Skip — performance. The glassSurface rgba is enough.
    return null;
  }
  return (
    <BlurView
      intensity={20}
      tint="dark"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  card: {
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
    // The bottom and sides of the highlight are 0 — only the top edge shows
  },
});
