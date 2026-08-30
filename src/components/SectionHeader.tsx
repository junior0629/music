/**
 * SectionHeader — "Jump Back In", "Made For Alex", etc.
 *
 * Optional `action` slot on the right ("See All", "Manage").
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors, textStyle, spacing } from '@/theme';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: Props): React.ReactElement {
  const colors = useColors();

  return (
    <View style={styles.row}>
      <Text style={[textStyle('title'), { color: colors.textPrimary }]}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8} accessibilityLabel={action.label}>
          <Text style={[textStyle('body'), { color: colors.primary, fontWeight: '600' }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
