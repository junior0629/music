/**
 * PlaylistCard — large square artwork + title + subtitle.
 *
 * Used in Home "Made For Alex" and similar horizontal rails.
 * Optional progress strip renders a thin bar at the bottom of
 * the artwork for "partially listened" affordance.
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
  progress?: number; // 0..1
  onPress?: () => void;
}

export function PlaylistCard({
  title,
  subtitle,
  gradient,
  icon,
  progress,
  onPress,
}: Props): React.ReactElement {
  const colors = useColors();
  const shadows = useShadows();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, width: 200 }]}
    >
      <View style={[styles.card, shadows.sm]}>
        <LinearGradient
          colors={gradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.artwork}
        >
          <Ionicons name={icon} size={48} color="rgba(255,255,255,0.85)" />
          {typeof progress === 'number' ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              />
            </View>
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
        numberOfLines={2}
        style={[
          textStyle('caption'),
          { color: colors.textSecondary, marginTop: 2 },
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
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
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: '100%',
  },
});
