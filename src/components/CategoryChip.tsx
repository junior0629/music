/**
 * CategoryChip — horizontal-scroll filter pill.
 *
 * Active: solid purple with white text.
 * Inactive: lavender surface with dark text.
 */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useColors, textStyle, spacing, radii } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, active = false, onPress }: Props): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surfaceMuted,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          textStyle('caption'),
          { color: active ? colors.textOnPrimary : colors.textPrimary, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
});
