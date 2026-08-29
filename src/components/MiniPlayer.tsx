/**
 * MiniPlayer — the persistent strip above the FloatingNav.
 *
 * Phase 1: placeholder. Shows a small glass strip indicating
 *          "No track playing" until a track is loaded.
 * Phase 2: wires to playerStore. Tap to open the full Now Playing screen.
 *
 * The mini-player animates in when a track loads (slide up from
 * below the nav) and animates out when there's nothing playing.
 */
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GlassPanel } from './GlassPanel';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { isNative } from '@/theme';

const BOTTOM_OFFSET = 84; // sits above the floating nav + a little gap

export function MiniPlayer(): React.ReactElement | null {
  const colors = useColors();
  const router = useRouter();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

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

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const openPlayer = (): void => {
    if (!currentTrack) return;
    if (isNative) {
      Haptics.selectionAsync().catch(() => undefined);
    }
    router.push(`/player/${currentTrack.id}`);
  };

  const onTogglePlay = (): void => {
    if (isNative) {
      Haptics.selectionAsync().catch(() => undefined);
    }
    void togglePlay();
  };

  return (
    <Animated.View
      pointerEvents={currentTrack ? 'auto' : 'none'}
      style={[styles.outer, { bottom: BOTTOM_OFFSET }, style]}
    >
      <GlassPanel
        style={styles.panel}
        padding={spacing.sm}
        radius={radii.xl}
      >
        {currentTrack ? (
          <View style={styles.row}>
            <Pressable
              onPress={openPlayer}
              accessibilityLabel="Open now playing"
              hitSlop={4}
              style={styles.thumbHit}
            >
              <Image
                source={{ uri: currentTrack.thumbnail }}
                style={[
                  styles.thumb,
                  { backgroundColor: colors.glassSurfaceSubtle },
                ]}
              />
            </Pressable>
            <Pressable
              onPress={openPlayer}
              accessibilityLabel={`Open ${currentTrack.title} by ${currentTrack.artist}`}
              style={styles.meta}
            >
              <Text
                numberOfLines={1}
                style={[textStyle('body'), { color: colors.textPrimary }]}
              >
                {currentTrack.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[textStyle('caption'), { color: colors.textSecondary }]}
              >
                {currentTrack.artist}
              </Text>
            </Pressable>
            <Pressable
              onPress={onTogglePlay}
              hitSlop={10}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              style={({ pressed }) => [
                styles.playPauseButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.playPauseGlyph,
                  { color: colors.textPrimary },
                ]}
              >
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.row}>
            <View
              style={[styles.thumb, { backgroundColor: colors.glassSurfaceSubtle }]}
            />
            <Text
              style={[textStyle('body'), { color: colors.textMuted }]}
            >
              No track playing
            </Text>
          </View>
        )}
      </GlassPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  panel: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
  },
  thumbHit: {
    width: 44,
    height: 44,
  },
  meta: {
    flex: 1,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // Pure flat white. The wrapping mini-player is glass, so the
    // button must be solid white to read as a separate, opaque
    // disc — not a translucent surface. Solid black border so the
    // shape stays clean on any background.
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  playPauseGlyph: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
});
