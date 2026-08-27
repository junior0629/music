import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';
import { GlassPanel } from '@/components/GlassPanel';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { usePlayerStore } from '@/store/playerStore';
import { logger } from '@/utils/logger';

const PLACEHOLDER_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="%237C3AED"/><stop offset="0.5" stop-color="%23EC4899"/><stop offset="1" stop-color="%233B82F6"/></linearGradient></defs><rect width="400" height="400" fill="url(%23g)"/></svg>',
  );

export default function NowPlayingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeat = usePlayerStore((s) => s.repeat);
  const isBuffering = usePlayerStore((s) => s.isBuffering);

  useEffect(() => {
    logger.setContext('NowPlayingScreen');
    logger.info('Opened', { trackId: id, hasTrack: Boolean(currentTrack) });
    return () => logger.clearContext();
  }, [id, currentTrack]);

  const track = currentTrack;
  const displayDuration = track?.durationSec ?? duration ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgBase }]}>
      <LinearGradient
        colors={[colors.accentGradient.from, colors.accentGradient.via, colors.accentGradient.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.header}>
          <Text style={[textStyle('label'), { color: colors.textMuted }]}>
            {track ? 'NOW PLAYING' : 'NO TRACK'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close player">
            <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>←</Text>
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.duration(500)} style={styles.artWrap}>
          <Image
            source={{ uri: track?.thumbnail ?? PLACEHOLDER_THUMB }}
            style={[
              styles.art,
              {
                backgroundColor: colors.glassSurfaceSubtle,
                shadowColor: colors.shadowStrong,
              },
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.meta}>
          <Text
            numberOfLines={1}
            style={[textStyle('title'), { color: colors.textPrimary, textAlign: 'center' }]}
          >
            {track?.title ?? 'Nothing playing'}
          </Text>
          <Text
            numberOfLines={1}
            style={[textStyle('body'), { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}
          >
            {track?.artist ?? 'Pick a song from Search'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.progress}>
          <View style={[styles.progressTrack, { backgroundColor: colors.glassSurfaceStrong }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accent,
                  width: `${displayDuration > 0 ? Math.min(100, (position / displayDuration) * 100) : 0}%`,
                },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={[textStyle('caption'), { color: colors.textMuted }]}>{formatTime(position)}</Text>
            <Text style={[textStyle('caption'), { color: colors.textMuted }]}>{formatTime(displayDuration)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.controls}>
          <Pressable
            onPress={toggleShuffle}
            hitSlop={8}
            accessibilityLabel={`Shuffle ${isShuffled ? 'on' : 'off'}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text
              style={{
                color: isShuffled ? colors.accent : colors.textMuted,
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              ⇄
            </Text>
          </Pressable>

          <Pressable
            onPress={prev}
            hitSlop={8}
            accessibilityLabel="Previous"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text style={[styles.controlGlyph, { color: colors.textPrimary }]}>⏮</Text>
          </Pressable>

          <Pressable
            onPress={() => setPlaying(!isPlaying)}
            hitSlop={8}
            disabled={!track}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            style={({ pressed }) => [
              styles.playButton,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.glassBorderStrong,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.playGlyph, { color: colors.accent }]}>
              {isBuffering ? '◌' : isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>

          <Pressable
            onPress={next}
            hitSlop={8}
            accessibilityLabel="Next"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text style={[styles.controlGlyph, { color: colors.textPrimary }]}>⏭</Text>
          </Pressable>

          <Pressable
            onPress={cycleRepeat}
            hitSlop={8}
            accessibilityLabel={`Repeat ${repeat}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text
              style={{
                color: repeat !== 'off' ? colors.accent : colors.textMuted,
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              {repeat === 'one' ? '↻¹' : '↻'}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).duration(500)}>
          <GlassPanel padding={spacing.sm} radius={radii.lg}>
            <View style={styles.bottomRow}>
              <BottomAction label="Queue" sublabel="Empty" />
              <BottomAction label="Lyrics" sublabel="Phase 5" />
              <BottomAction label="Favorite" sublabel={track ? 'Tap' : '—'} />
            </View>
          </GlassPanel>
        </Animated.View>
      </View>
    </View>
  );
}

function BottomAction({ label, sublabel }: { label: string; sublabel: string }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [styles.bottomAction, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityLabel={label}
    >
      <Text style={[textStyle('caption'), { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[textStyle('label'), { color: colors.textMuted, marginTop: 2 }]}>
        {sublabel.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  artWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 360,
  },
  art: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: radii.xl,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
  },
  meta: {
    marginVertical: spacing.lg,
  },
  progress: {
    marginBottom: spacing.lg,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  playGlyph: {
    fontSize: 28,
    fontWeight: '700',
  },
  controlGlyph: {
    fontSize: 26,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomAction: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
