/**
 * GradientBackground — the page-level atmospheric gradient.
 *
 * Phase 1: simple diagonal gradient between two palette stops.
 * Phase 2: the stops will be derived from the currently playing
 *          album artwork's dominant colors.
 *
 * Lives behind everything. Renders once at the root.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props): React.ReactElement {
  const colors = useColors();

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[colors.bgBase, colors.bgBaseAlt]}
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
