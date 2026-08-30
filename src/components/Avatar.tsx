/**
 * Avatar — circular profile image with a soft gradient fallback.
 *
 * Renders either a real image (uri) or a gradient + initials
 * placeholder so the UI is never broken on slow networks.
 */
import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, textStyle, spacing } from '@/theme';

interface Props {
  size?: number;
  uri?: string;
  initials?: string;
  style?: StyleProp<ImageStyle | ViewStyle>;
}

export function Avatar({ size = 44, uri, initials = 'AR', style }: Props): React.ReactElement {
  const colors = useColors();
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size, borderRadius: radius, backgroundColor: colors.lavender },
          style as StyleProp<ImageStyle>,
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={['#A78BFA', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={[
          textStyle('heading'),
          { color: colors.textOnPrimary, fontSize: size * 0.4 },
        ]}
      >
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}
