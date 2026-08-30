/**
 * SongRow — list item for the Library.
 *
 * Artwork (gradient + icon) on the left, title + subtitle, chevron right.
 * Used for playlists, songs, artists, albums, podcasts.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';
import { Gradient, IconName } from '@/data/mockData';

interface Props {
  title: string;
  subtitle: string;
  gradient: Gradient;
  icon: IconName;
  showChevron?: boolean;
  onPress?: () => void;
}

export function SongRow({
  title,
  subtitle,
  gradient,
  icon,
  showChevron = true,
  onPress,
}: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface },
        shadows.sm,
      ]}
    >
      <LinearGradient
        colors={gradient as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.art}
      >
        <Ionicons name={icon} size={22} color="rgba(255,255,255,0.85)" />
      </LinearGradient>
      <View style={styles.meta}>
        <Text
          numberOfLines={1}
          style={[textStyle('heading'), { color: colors.textPrimary }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={[textStyle('caption'), { color: colors.textSecondary, marginTop: 2 }]}
        >
          {subtitle}
        </Text>
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  art: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
});
