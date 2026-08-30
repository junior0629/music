/**
 * MiniPlayer — the persistent strip above the bottom navigation.
 *
 * Solid white pill with a soft purple shadow. Artwork + title +
 * artist on the left, heart + play/pause on the right. Tapping
 * anywhere opens the full Now Playing screen.
 */
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';
import { usePlayerPlaybackStore, usePlayerMetaStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useRouter } from 'expo-router';
import { selection, toggle } from '@/utils/haptics';

const BOTTOM_OFFSET = 76; // sits just above the bottom nav

export function MiniPlayer(): React.ReactElement | null {
  const colors = useColors();
  const shadows = useShadows();
  const router = useRouter();
  const currentTrack = usePlayerMetaStore((s) => s.currentTrack);
  const isPlaying = usePlayerPlaybackStore((s) => s.isPlaying);
  const togglePlay = usePlayerMetaStore((s) => s.togglePlay);
  const isFavorite = useLibraryStore((s) => s.isFavorite);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (currentTrack) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      opacity.value = withSpring(1, { damping: 18, stiffness: 180 });
    } else {
      translateY.value = withSpring(100, { damping: 18, stiffness: 180 });
      opacity.value = withSpring(0, { damping: 18, stiffness: 180 });
    }
  }, [currentTrack, translateY, opacity]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const openPlayer = (): void => {
    if (!currentTrack) return;
    selection();
    router.push(`/player/${currentTrack.id}`);
  };

  const onTogglePlay = (): void => {
    toggle();
    void togglePlay();
  };

  const onToggleFavorite = (): void => {
    if (!currentTrack) return;
    toggle();
    toggleFavorite(currentTrack);
  };

  // When there's no current track, render a plain off-screen View
  // instead of an Animated.View. Reanimated 3 fires an initial
  // UI-thread update on mount which can race against the React tree
  // and throw `ViewManager for tag N could not be found` on
  // cold-start. Skipping the animated wrapper in the hidden case
  // sidesteps that without changing the visible behavior.
  if (!currentTrack) {
    return (
      <View
        pointerEvents="none"
        style={[styles.outer, styles.hidden, { bottom: BOTTOM_OFFSET }]}
      />
    );
  }

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.outer, { bottom: BOTTOM_OFFSET }, animated]}
    >
      <View style={[styles.pill, { backgroundColor: colors.surface }, shadows.lg]}>
        <View style={styles.row}>
          <Pressable
            onPress={openPlayer}
            accessibilityLabel="Open now playing"
            hitSlop={4}
          >
            <Image
              source={{ uri: currentTrack.thumbnail }}
              style={[styles.thumb, { backgroundColor: colors.lavender }]}
            />
          </Pressable>
          <Pressable
            onPress={openPlayer}
            accessibilityLabel={`Open ${currentTrack.title} by ${currentTrack.artist}`}
            style={styles.meta}
          >
            <Text
              numberOfLines={1}
              style={[textStyle('caption'), { color: colors.textPrimary, fontWeight: '600' }]}
            >
              {currentTrack.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[textStyle('micro'), { color: colors.textSecondary, marginTop: 2, textTransform: 'none', letterSpacing: 0 }]}
            >
              {currentTrack.artist}
            </Text>
          </Pressable>
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            accessibilityLabel={isFavorite(currentTrack.id) ? 'Unfavorite' : 'Favorite'}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
          >
            <Ionicons
              name={isFavorite(currentTrack.id) ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite(currentTrack.id) ? colors.primary : colors.textMuted}
            />
          </Pressable>
          <Pressable
            onPress={onTogglePlay}
            hitSlop={10}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            style={({ pressed }) => [
              styles.playButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={colors.textOnPrimary}
            />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  hidden: {
    // Pushed well off-screen so it never receives touches; the
    // wrapper is also pointer-events="none" but this guarantees the
    // pill can't accidentally intercept input.
    transform: [{ translateY: 200 }],
    opacity: 0,
  },
  pill: {
    width: '100%',
    borderRadius: radii.xl,
    padding: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
  },
  meta: {
    flex: 1,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
