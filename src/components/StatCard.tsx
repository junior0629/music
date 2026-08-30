/**
 * StatCard — large purple number with a small muted label.
 *
 * Used in a 3-column row on Profile (1.2k MINUTES, 42 ARTISTS, etc).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';

interface Props {
  value: string;
  label: string;
}

export function StatCard({ value, label }: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
      <Text
        style={[
          textStyle('display'),
          { color: colors.primary, fontSize: 26, lineHeight: 32 },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          textStyle('micro'),
          { color: colors.textMuted, marginTop: spacing.xxs, textTransform: 'uppercase' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
});
