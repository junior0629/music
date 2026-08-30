/**
 * Now Playing — full-screen player.
 *
 * Layout (top to bottom):
 *   - Top bar: back chevron + more
 *   - Large album artwork
 *   - Title + artist
 *   - Progress bar (tap to seek)
 *   - 3 main controls: previous, play/pause (large purple disc), next
 *   - Secondary controls: shuffle, repeat, favorite
 *
 * Lyrics: a karaoke-style sliding stack of 7 lines, driven by a
 * shared `window` value synced to the playback position. The
 * visible style matches the new light aesthetic (dark text on the
 * soft lavender background, not white-on-dark like the old
 * artwork-blur background).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';
import { usePlayerPlaybackStore, usePlayerMetaStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { lyricsService, LyricsResult } from '@/services/lyrics/lyrics';
import { getProvider } from '@/services/music';
import { logger } from '@/utils/logger';
import { selection, toggle } from '@/utils/haptics';

const PLACEHOLDER_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="%23A78BFA"/><stop offset="0.5" stop-color="%23C4B5FD"/><stop offset="1" stop-color="%23E9D5FF"/></linearGradient></defs><rect width="400" height="400" fill="url(%23g)"/></svg>',
  );

const LYRIC_ROW_HEIGHT = 56;
const LYRIC_WINDOW = 3;

function LyricLine({
  line,
  lineIndex,
  window,
  isActive,
  onPress,
}: {
  line: { text: string; startSec?: number } | undefined;
  lineIndex: number;
  window: Animated.SharedValue<number>;
  isActive: boolean;
  onPress: (startSec: number | undefined) => void;
}): React.ReactElement {
  const colors = useColors();
  const animatedStyle = useAnimatedStyle(() => {
    const slot = lineIndex - Math.round(window.value);
    const translateY = slot * LYRIC_ROW_HEIGHT;
    const dist = Math.abs(slot);
    let opacity: number;
    if (dist > LYRIC_WINDOW) opacity = 0;
    else if (dist === 0) opacity = 1;
    else if (dist === 1) opacity = 0.7;
    else if (dist === 2) opacity = 0.4;
    else opacity = 0.2;
    return { transform: [{ translateY }], opacity };
  });

  return (
    <Animated.View style={[styles.lyricRowSlot, animatedStyle]}>
      <Pressable
        onPress={() => onPress(line?.startSec)}
        disabled={!line?.startSec}
        accessibilityLabel={line?.text ? `Seek to "${line.text}"` : 'Lyric line'}
        style={({ pressed }) => [styles.lyricRow, pressed && { opacity: 0.6 }]}
      >
        <Text
          numberOfLines={isActive ? 3 : 2}
          style={[
            textStyle(isActive ? 'heading' : 'caption'),
            {
              color: isActive ? colors.textPrimary : colors.textMuted,
              fontSize: isActive ? 18 : 14,
              lineHeight: isActive ? 24 : 19,
              fontWeight: isActive ? '700' : '500',
              textAlign: 'center',
            },
          ]}
        >
          {line?.text ?? ' '}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function NowPlayingScreen() {
  const colors = useColors();
  const shadows = useShadows();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const currentTrack = usePlayerMetaStore((s) => s.currentTrack);
  const togglePlay = usePlayerMetaStore((s) => s.togglePlay);
  const seek = usePlayerMetaStore((s) => s.seek);
  const next = usePlayerMetaStore((s) => s.next);
  const prev = usePlayerMetaStore((s) => s.prev);
  const toggleShuffle = usePlayerMetaStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerMetaStore((s) => s.cycleRepeat);
  const isShuffled = usePlayerMetaStore((s) => s.isShuffled);
  const repeat = usePlayerMetaStore((s) => s.repeat);
  const lastError = usePlayerMetaStore((s) => s.lastError);
  const isPlaying = usePlayerPlaybackStore((s) => s.isPlaying);
  const position = usePlayerPlaybackStore((s) => s.position);
  const duration = usePlayerPlaybackStore((s) => s.duration);
  const isBuffering = usePlayerPlaybackStore((s) => s.isBuffering);

  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [lyrics, setLyrics] = useState<LyricsResult>({ kind: 'none' });
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsRetryNonce, setLyricsRetryNonce] = useState(0);

  useEffect(() => {
    logger.setContext('NowPlayingScreen');
    logger.info('Opened', { trackId: id, hasTrack: Boolean(currentTrack) });
    return () => logger.clearContext();
  }, [id, currentTrack]);

  // Deep-link safety net
  useEffect(() => {
    if (!id) return;
    if (currentTrack && currentTrack.id === id) return;
    let cancelled = false;
    (async () => {
      try {
        logger.info('NowPlaying: deep-link load', { trackId: id });
        const track = await getProvider().getTrack(id);
        if (cancelled) return;
        await usePlayerMetaStore.getState().loadTrack(track);
      } catch (err) {
        const e = err as Error;
        logger.error('NowPlaying: deep-link load failed', { trackId: id, err: e?.message ?? String(err) }, e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, currentTrack]);

  // Subtle artwork rotation while playing. Faster than the vinyl-record
  // spin of the old design; here it just feels alive.
  const spin = useSharedValue(0);
  useEffect(() => {
    if (isPlaying) {
      spin.value = withRepeat(
        withTiming(360, { duration: 24_000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(spin);
    }
  }, [isPlaying, spin]);
  const artSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const track = currentTrack;
  const displayDuration = track?.durationSec ?? duration ?? 0;

  const retryLyrics = useCallback(() => {
    logger.info('Lyrics: user tapped RETRY', { trackId: track?.id });
    setLyricsRetryNonce((n) => n + 1);
  }, [track?.id]);

  const seekBarWidthRef = useRef(0);

  useEffect(() => {
    if (!track) {
      setLyrics({ kind: 'none' });
      setLyricsLoading(false);
      return;
    }
    const ac = new AbortController();
    setLyricsLoading(true);
    setLyrics({ kind: 'none' });
    logger.info('Lyrics: fetch start', { trackId: track.id });
    let autoRetryTimer: ReturnType<typeof setTimeout> | null = null;
    lyricsService
      .getLyrics(track, ac.signal)
      .then((r) => {
        if (ac.signal.aborted) return;
        setLyrics(r);
        if (r.kind === 'unavailable') {
          logger.info('Lyrics: auto-retry in 8s', { trackId: track.id });
          autoRetryTimer = setTimeout(() => {
            if (ac.signal.aborted) return;
            logger.info('Lyrics: auto-retry firing', { trackId: track.id });
            setLyricsRetryNonce((n) => n + 1);
          }, 8000);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setLyrics({ kind: 'none' });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLyricsLoading(false);
      });
    return () => {
      ac.abort();
      if (autoRetryTimer) clearTimeout(autoRetryTimer);
    };
  }, [track?.id, lyricsRetryNonce]);

  const LOOKAHEAD_SEC = 0.3;
  const { activeLineIdx, preVocal } = useMemo(() => {
    if (lyrics.kind === 'synced' && lyrics.lines.length > 0) {
      const firstStart = lyrics.lines[0]?.startSec ?? 0;
      if (position + LOOKAHEAD_SEC < firstStart) {
        return { activeLineIdx: -1, preVocal: true };
      }
      const target = position + LOOKAHEAD_SEC;
      let i = 0;
      for (let k = 0; k < lyrics.lines.length; k++) {
        if ((lyrics.lines[k].startSec ?? 0) <= target) i = k;
        else break;
      }
      return { activeLineIdx: i, preVocal: false };
    }
    if (lyrics.kind === 'plain' && lyrics.lines.length > 0 && displayDuration > 0) {
      return {
        activeLineIdx: Math.min(
          lyrics.lines.length - 1,
          Math.floor(position / (displayDuration / lyrics.lines.length)),
        ),
        preVocal: false,
      };
    }
    return { activeLineIdx: 0, preVocal: false };
  }, [lyrics, position, displayDuration]);

  const lyricWindow = useSharedValue(0);
  useEffect(() => {
    const target = activeLineIdx < 0 ? 0 : activeLineIdx;
    lyricWindow.value = withTiming(target, {
      duration: 420,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [activeLineIdx, lyricWindow]);

  const seekToLine = (startSec: number | undefined) => {
    if (typeof startSec !== 'number') return;
    void seek(startSec);
  };

  const favorited = track ? favorites.some((t) => t.id === track.id) : false;
  const artUri = track?.thumbnail ?? PLACEHOLDER_THUMB;

  const seekGesture = useMemo(() => {
    const seekToX = (x: number) => {
      if (!track || displayDuration <= 0) return;
      const width = seekBarWidthRef.current || 300;
      const ratio = Math.max(0, Math.min(1, x / Math.max(1, width)));
      void seek(ratio * displayDuration);
    };
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => runOnJS(seekToX)(e.x))
      .onUpdate((e) => runOnJS(seekToX)(e.x));
  }, [track, displayDuration, seek]);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.bgPageSoft }]}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Top bar: back chevron + more */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityLabel="Close player"
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => logger.info('NowPlaying: more menu tapped')}
            hitSlop={10}
            accessibilityLabel="More options"
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Artwork */}
        <View style={styles.artWrap}>
          <Animated.View style={[styles.artDisc, shadows.lg, artSpinStyle]}>
            <Image source={{ uri: artUri }} style={styles.artImage} resizeMode="cover" />
          </Animated.View>
        </View>

        {/* Title + artist */}
        <View style={styles.meta}>
          <Text
            numberOfLines={1}
            style={[textStyle('title'), { color: colors.textPrimary, textAlign: 'center' }]}
          >
            {track?.title ?? 'Nothing playing'}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              textStyle('body'),
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs },
            ]}
          >
            {track?.artist ?? 'Pick a song to start'}
          </Text>
        </View>

        {/* Lyrics (compact, below meta) */}
        <View style={styles.lyricsWrap}>
          {lyrics.kind === 'instrumental' ? (
            <Text
              style={[
                textStyle('body'),
                { color: colors.textMuted, textAlign: 'center' },
              ]}
            >
              ♪ Instrumental
            </Text>
          ) : lyrics.kind === 'unavailable' ? (
            <View style={{ alignItems: 'center' }}>
              <Text
                style={[
                  textStyle('caption'),
                  { color: colors.textMuted, textAlign: 'center' },
                ]}
              >
                Lyrics service unreachable
              </Text>
              <Pressable
                onPress={() => {
                  selection();
                  retryLyrics();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Retry lyrics"
                style={({ pressed }) => [
                  styles.retryPill,
                  { borderColor: colors.borderStrong, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[textStyle('micro'), { color: colors.textPrimary }]}>
                  RETRY
                </Text>
              </Pressable>
            </View>
          ) : lyrics.kind === 'none' && lyricsLoading ? (
            <Text style={[textStyle('caption'), { color: colors.textMuted, textAlign: 'center' }]}>
              …
            </Text>
          ) : lyrics.kind === 'none' ? (
            <Text style={[textStyle('caption'), { color: colors.textMuted, textAlign: 'center' }]}>
              Lyrics not available
            </Text>
          ) : (
            <View style={styles.lyricCarousel}>
              {(() => {
                const total = lyrics.lines.length;
                const center = activeLineIdx < 0 ? 0 : activeLineIdx;
                const indices: number[] = [];
                for (let k = center - LYRIC_WINDOW; k <= center + LYRIC_WINDOW; k++) {
                  indices.push(k);
                }
                return indices.map((i) => (
                  <LyricLine
                    key={i}
                    line={i >= 0 && i < total ? lyrics.lines[i] : undefined}
                    lineIndex={i}
                    window={lyricWindow}
                    isActive={i === activeLineIdx}
                    onPress={seekToLine}
                  />
                ));
              })()}
            </View>
          )}
        </View>

        {/* Progress + seek */}
        <GestureDetector gesture={seekGesture}>
          <View
            onLayout={(e) => {
              seekBarWidthRef.current = e.nativeEvent.layout.width;
            }}
            style={styles.progressHitArea}
            accessibilityLabel="Seek"
          >
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${displayDuration > 0 ? Math.min(100, (position / displayDuration) * 100) : 0}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </GestureDetector>
        <View style={styles.timeRow}>
          <Text style={[textStyle('micro'), { color: colors.textMuted }]}>
            {formatTime(position)}
          </Text>
          <Text style={[textStyle('micro'), { color: colors.textMuted }]}>
            {formatTime(displayDuration)}
          </Text>
        </View>

        {lastError ? (
          <Text style={[textStyle('caption'), { color: colors.danger, textAlign: 'center' }]}>
            {lastError}
          </Text>
        ) : null}

        {/* Transport controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={() => {
              toggle();
              void toggleShuffle();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Shuffle ${isShuffled ? 'on' : 'off'}`}
            accessibilityState={{ selected: isShuffled }}
            style={({ pressed }) => [styles.transportHit, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffled ? colors.primary : colors.textMuted}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              if (isBuffering) return;
              selection();
              void prev();
            }}
            disabled={isBuffering}
            accessibilityRole="button"
            accessibilityLabel="Previous"
            style={({ pressed }) => [
              styles.transportHit,
              pressed && !isBuffering && { opacity: 0.6 },
              isBuffering && { opacity: 0.3 },
            ]}
          >
            <Ionicons
              name="play-skip-back"
              size={28}
              color={isBuffering ? colors.textMuted : colors.textPrimary}
            />
          </Pressable>

          {/* Play button — large purple disc */}
          <View style={[styles.playDisc, { backgroundColor: colors.primary }, shadows.glow]}>
            <Pressable
              onPress={() => {
                if (isBuffering) return;
                toggle();
                void togglePlay();
              }}
              disabled={!track || isBuffering}
              accessibilityRole="button"
              accessibilityLabel={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
              style={({ pressed }) => [
                styles.playButtonPressable,
                { opacity: pressed && !isBuffering ? 0.85 : 1 },
              ]}
            >
              {isBuffering ? (
                <ActivityIndicator size="large" color={colors.textOnPrimary} />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={colors.textOnPrimary}
                />
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              if (isBuffering) return;
              selection();
              void next();
            }}
            disabled={isBuffering}
            accessibilityRole="button"
            accessibilityLabel="Next"
            style={({ pressed }) => [
              styles.transportHit,
              pressed && !isBuffering && { opacity: 0.6 },
              isBuffering && { opacity: 0.3 },
            ]}
          >
            <Ionicons
              name="play-skip-forward"
              size={28}
              color={isBuffering ? colors.textMuted : colors.textPrimary}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              toggle();
              void cycleRepeat();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Repeat ${repeat}`}
            accessibilityState={{ selected: repeat !== 'off' }}
            style={({ pressed }) => [styles.transportHit, pressed && { opacity: 0.6 }]}
          >
            <View>
              <Ionicons
                name="repeat"
                size={22}
                color={repeat !== 'off' ? colors.primary : colors.textMuted}
              />
              {repeat === 'one' ? (
                <Text style={[styles.repeatOneBadge, { color: colors.primary }]}>1</Text>
              ) : null}
            </View>
          </Pressable>
        </View>

        {/* Favorite row */}
        <Pressable
          onPress={() => track && toggleFavorite(track)}
          hitSlop={10}
          disabled={!track}
          accessibilityLabel={favorited ? 'Unfavorite' : 'Favorite'}
          style={({ pressed }) => [styles.favoriteRow, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={22}
            color={favorited ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              textStyle('caption'),
              { color: favorited ? colors.primary : colors.textSecondary, marginLeft: 6 },
            ]}
          >
            {favorited ? 'In your library' : 'Add to library'}
          </Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  artWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  artDisc: {
    width: 280,
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E9D5FF',
  },
  artImage: {
    width: '100%',
    height: '100%',
  },

  meta: {
    marginTop: spacing.lg,
  },

  lyricsWrap: {
    marginTop: spacing.md,
    minHeight: LYRIC_ROW_HEIGHT,
    justifyContent: 'center',
  },
  lyricCarousel: {
    height: LYRIC_ROW_HEIGHT * (LYRIC_WINDOW * 2 + 1),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  lyricRowSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricRow: {
    width: '100%',
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  retryPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },

  progressHitArea: {
    paddingVertical: 10,
    marginTop: spacing.md,
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
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  transportHit: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDisc: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    paddingHorizontal: 3,
    lineHeight: 12,
    overflow: 'hidden',
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
});
