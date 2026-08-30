/**
 * SettingRow — large rounded setting list item.
 *
 * Lavender circular icon container, title, chevron right.
 * Used in Profile's Account Settings section.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';
import { IconName } from '@/data/mockData';

interface Props {
  title: string;
  icon: IconName;
  tint: string;
  onPress?: () => void;
}

export function SettingRow({ title, icon, tint, onPress }: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.85 : 1, backgroundColor: colors.surface },
        shadows.sm,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text
        numberOfLines={1}
        style={[textStyle('heading'), { color: colors.textPrimary, flex: 1 }]}
      >
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
