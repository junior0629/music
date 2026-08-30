/**
 * MoodCard — large pastel gradient card with a subtle icon.
 *
 * Used in Discover's "Mood Playlists" 2-column grid.
 * The artwork is the entire card (no separate meta below).
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
  onPress?: () => void;
}

export function MoodCard({ title, subtitle, gradient, icon, onPress }: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, flex: 1 }]}
    >
      <LinearGradient
        colors={gradient as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, shadows.sm]}
      >
        <View style={styles.text}>
          <Text
            numberOfLines={1}
            style={[textStyle('heading'), { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              textStyle('caption'),
              { color: colors.textSecondary, marginTop: 2 },
            ]}
          >
            {subtitle}
          </Text>
        </View>
        <Ionicons
          name={icon}
          size={48}
          color="rgba(255,255,255,0.55)"
          style={styles.icon}
        />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1.1,
    borderRadius: radii.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  text: {
    // top-left
  },
  icon: {
    alignSelf: 'flex-end',
  },
});
