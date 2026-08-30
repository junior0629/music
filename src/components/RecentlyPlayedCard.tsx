/**
 * RecentlyPlayedCard — compact horizontal-rail card.
 *
 * Smaller than PlaylistCard: 140-wide artwork + title + subtitle.
 * Optional play button overlay on the artwork.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';
import { Gradient, IconName } from '@/data/mockData';

interface Props {
  title: string;
  subtitle: string;
  gradient: Gradient;
  icon: IconName;
  showPlayButton?: boolean;
  onPress?: () => void;
}

export function RecentlyPlayedCard({
  title,
  subtitle,
  gradient,
  icon,
  showPlayButton = true,
  onPress,
}: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, width: 150 }]}
    >
      <View style={[styles.card, shadows.sm]}>
        <LinearGradient
          colors={gradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.artwork}
        >
          <Ionicons name={icon} size={36} color="rgba(255,255,255,0.85)" />
          {showPlayButton ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPress?.();
              }}
              hitSlop={8}
              accessibilityLabel={`Play ${title}`}
              style={({ pressed }) => [
                styles.playButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </LinearGradient>
      </View>
      <Text
        numberOfLines={1}
        style={[textStyle('heading'), { color: colors.textPrimary, marginTop: spacing.sm }]}
      >
        {title}
      </Text>
      <Text
        numberOfLines={1}
        style={[textStyle('caption'), { color: colors.textSecondary, marginTop: 2 }]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
