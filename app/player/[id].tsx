import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  LinearTransition,
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
import { BlurView } from 'expo-blur';
import { useColors, spacing, radii, fontFamily } from '@/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { lyricsService, LyricsResult } from '@/services/lyrics/lyrics';
import { logger } from '@/utils/logger';

const PLACEHOLDER_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="%237C3AED"/><stop offset="0.5" stop-color="%23EC4899"/><stop offset="1" stop-color="%233B82F6"/></linearGradient></defs><rect width="400" height="400" fill="url(%23g)"/></svg>',
  );

const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.78)';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';

/** One lyric line in the 3-row stack. Tappable to seek. */
function LyricRow({
  line,
  variant,
  onPress,
}: {
  line: { text: string; startSec?: number } | undefined;
  variant: 'past' | 'active' | 'future';
  onPress: (startSec: number | undefined) => void;
}): React.ReactElement {
  const text = line?.text ?? ' ';
  const style =
    variant === 'active' ? styles.lyricTextActive
    : variant === 'past' ? styles.lyricTextPast
    : styles.lyricTextFuture;
  const label =
    variant === 'active' ? 'Current lyric' :
    variant === 'past' ? 'Previous lyric' : 'Next lyric';
  return (
    <Pressable
      onPress={() => onPress(line?.startSec)}
      disabled={!line?.startSec}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.lyricRow,
        pressed && styles.lyricPressed,
      ]}
    >
      <Text
        numberOfLines={variant === 'active' ? 3 : 2}
        style={[styles.lyricText, style]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

export default function NowPlayingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const seek = usePlayerStore((s) => s.seek);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeat = usePlayerStore((s) => s.repeat);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const lastError = usePlayerStore((s) => s.lastError);

  const isFavorite = useLibraryStore((s) => s.isFavorite);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [lyrics, setLyrics] = useState<LyricsResult>({ kind: 'none' });
  const [lyricsLoading, setLyricsLoading] = useState(false);

  useEffect(() => {
    logger.setContext('NowPlayingScreen');
    logger.info('Opened', { trackId: id, hasTrack: Boolean(currentTrack) });
    return () => logger.clearContext();
  }, [id, currentTrack]);

  // Spinning artwork: only spin while playing. Pause → freeze the
  // rotation where it is; play → resume from current angle.
  const spin = useSharedValue(0);
  useEffect(() => {
    if (isPlaying) {
      spin.value = withRepeat(
        withTiming(360, { duration: 18_000, easing: Easing.linear }),
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

  // Real width of the seek bar's Pressable. Measured on layout. We use
  // this instead of `window.innerWidth` for the seek math because the
  // bar is inset from the screen edge by `paddingHorizontal: spacing.lg`
  // and a fixed 4px track — using the window width would skew the
  // ratio heavily. Without measuring, taps near the start of the bar
  // land at ~0% (correct) but taps past the end get clamped to 100%,
  // and on web, the previous implementation sometimes wrapped to 0.
  const seekBarWidthRef = useRef(0);

  // Fetch real lyrics whenever the track changes. The previous in-flight
  // request is aborted (via AbortController) when the user skips to
  // another track, so we don't show stale text from the old song.
  useEffect(() => {
    if (!track) {
      setLyrics({ kind: 'none' });
      setLyricsLoading(false);
      return;
    }
    const ac = new AbortController();
    setLyricsLoading(true);
    setLyrics({ kind: 'none' });
    lyricsService
      .getLyrics(track, ac.signal)
      .then((r) => {
        if (!ac.signal.aborted) setLyrics(r);
      })
      .catch(() => {
        if (!ac.signal.aborted) setLyrics({ kind: 'none' });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLyricsLoading(false);
      });
    return () => ac.abort();
  }, [track?.id]);

  // Active lyric line: synced → by timestamp with a tiny lookahead so
  // the line is highlighted right as the singer starts (the lookahead
  // mostly compensates for the IFrame position-polling lag of ~250ms).
  // A larger lookahead used to be applied here, but it caused fast
  // rap tracks to advance lines too early. With a small lookahead the
  // cadence is correct for both slow songs and rap, and the user can
  // tap a line to seek forward if it ever lands late.
  const LOOKAHEAD_SEC = 0.3;
  const { activeLineIdx, preVocal } = useMemo(() => {
    if (lyrics.kind === 'synced' && lyrics.lines.length > 0) {
      // Detect "artist hasn't started yet" — the first LRC line's
      // startSec is often a few seconds in. Before the singer is
      // actually audible, don't highlight any line; just let the user
      // see the upcoming lyrics as placeholders. We use the FIRST
      // LRC line's startSec (not the active one) as the threshold.
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

  // Tap a lyric line → seek to that line's timestamp. Only meaningful
  // for synced LRC lines (those have a startSec). For plain lyrics
  // there are no timestamps to seek to, so the press is a no-op.
  const seekToLine = (startSec: number | undefined) => {
    if (typeof startSec !== 'number') return;
    void seek(startSec);
  };

  const favorited = track ? isFavorite(track.id) : false;
  const artUri = track?.thumbnail ?? PLACEHOLDER_THUMB;

  // Draggable seek: tap or drag anywhere on the bar to seek. The
  // gesture runs on the UI thread (worklet) and only jumps back to
  // JS to call seek() — so the bar updates smoothly even mid-drag.
  // We use the pressable's measured width as the denominator (not
  // window.innerWidth) so the math is correct on every screen size.
  const seekGesture = useMemo(() => {
    const seekToX = (x: number) => {
      if (!track || displayDuration <= 0) return;
      const width = seekBarWidthRef.current || 300;
      const ratio = Math.max(0, Math.min(1, x / Math.max(1, width)));
      void seek(ratio * displayDuration);
    };
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => {
        runOnJS(seekToX)(e.x);
      })
      .onUpdate((e) => {
        runOnJS(seekToX)(e.x);
      });
  }, [track, displayDuration, seek]);

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Blurred album-artwork background. Web uses CSS `filter: blur`
          on a 1.2×-scaled image wrapped in overflow:hidden. Native
          layers a BlurView on top of the image for OS-level blur.
          A dark scrim sits on top so white text stays readable. */}
      {Platform.OS === 'web' ? (
        <>
          <View style={[StyleSheet.absoluteFill, styles.artBgWrap]} pointerEvents="none">
            <Image source={{ uri: artUri }} style={styles.artBg} blurRadius={40} />
          </View>
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            pointerEvents="none"
          />
        </>
      ) : (
        <>
          <Image
            source={{ uri: artUri }}
            style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
            blurRadius={40}
          />
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      )}

      <View style={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        {/* Header: 'NOW PLAYING' label + close (←) — both white */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>
            {track ? 'NOW PLAYING' : 'NO TRACK'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close player">
            <Text style={styles.closeIcon}>←</Text>
          </Pressable>
        </View>

        {/* Middle: artwork on the left, lyrics on the right */}
        <View style={styles.middle}>
          <View style={styles.artColumn}>
            <Animated.View style={[styles.artDisc, artSpinStyle]}>
              {/* Outer ring (slight dark frame around the artwork) */}
              <View style={styles.artRing}>
                <Image source={{ uri: artUri }} style={styles.artImage} />
              </View>
              {/* Center spindle hole — the small dark circle at the
                  center of a vinyl record / CD */}
              <View style={styles.artSpindle} />
            </Animated.View>
            <Text numberOfLines={1} style={styles.titleText}>
              {track?.title ?? 'Nothing playing'}
            </Text>
            <Text numberOfLines={1} style={styles.artistText}>
              {track?.artist ?? 'Pick a song from Search'}
            </Text>
          </View>

          <View style={styles.lyricsColumn}>
            {lyrics.kind === 'instrumental' ? (
              <Text style={[styles.lyricText, styles.lyricTextActive]}>♪ Instrumental</Text>
            ) : lyrics.kind === 'none' && lyricsLoading ? (
              <Text style={[styles.lyricText, styles.lyricTextFuture]}>…</Text>
            ) : lyrics.kind === 'none' ? (
              <Text style={[styles.lyricText, styles.lyricTextFuture]}>Lyrics not available</Text>
            ) : (
              // 3-row lyric view: prev / active / next. The column
              // uses LinearTransition so when activeLineIdx changes
              // and the rows' content changes, reanimated animates
              // the layout shift (slide up) automatically.
              <Animated.View
                layout={LinearTransition.duration(320)}
                style={styles.lyricColumnInner}
              >
                <LyricRow
                  line={lyrics.lines[activeLineIdx - 1]}
                  variant="past"
                  onPress={seekToLine}
                />
                <LyricRow
                  line={lyrics.lines[activeLineIdx]}
                  variant="active"
                  onPress={seekToLine}
                />
                <LyricRow
                  line={lyrics.lines[activeLineIdx + 1]}
                  variant="future"
                  onPress={seekToLine}
                />
              </Animated.View>
            )}
          </View>
        </View>

        {/* Progress + favorite heart (right-aligned, above controls) */}
        <View style={styles.progressRow}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => track && toggleFavorite(track)}
            hitSlop={10}
            disabled={!track}
            accessibilityLabel={favorited ? 'Unfavorite' : 'Favorite'}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.heart, favorited ? styles.heartOn : null]}>
              {favorited ? '♥' : '♡'}
            </Text>
          </Pressable>
        </View>
        <GestureDetector gesture={seekGesture}>
          <View
            onLayout={(e) => {
              seekBarWidthRef.current = e.nativeEvent.layout.width;
            }}
            style={styles.progressHitArea}
            accessibilityLabel="Seek"
          >
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${displayDuration > 0 ? Math.min(100, (position / displayDuration) * 100) : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        </GestureDetector>
        <View style={styles.timeRow}>
          <Pressable
            onPress={() => {
              if (!track) return;
              void seek(0);
            }}
            hitSlop={8}
            disabled={!track}
            accessibilityLabel="Restart from beginning"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.timeTextSmall}>{formatTime(position)}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!track || displayDuration <= 0) return;
              // Seek to 10s before end (lets the user "skip to near the end")
              void seek(Math.max(0, displayDuration - 10));
            }}
            hitSlop={8}
            disabled={!track || displayDuration <= 0}
            accessibilityLabel="Skip near end"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.timeTextSmall}>{formatTime(displayDuration)}</Text>
          </Pressable>
        </View>

        {lastError ? (
          <Text style={styles.errorText}>{lastError}</Text>
        ) : null}

        {/* Transport controls */}
        <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.controls}>
          <Pressable
            onPress={toggleShuffle}
            hitSlop={8}
            accessibilityLabel={`Shuffle ${isShuffled ? 'on' : 'off'}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text
              style={[
                styles.iconText,
                { color: isShuffled ? TEXT_PRIMARY : TEXT_MUTED, fontSize: 20 },
              ]}
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
            <Text style={[styles.iconText, { color: TEXT_PRIMARY, fontSize: 28 }]}>⏮</Text>
          </Pressable>

          <Pressable
            onPress={() => togglePlay()}
            hitSlop={8}
            disabled={!track}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            style={({ pressed }) => [
              styles.playButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.playGlyph}>
              {isBuffering ? '◌' : isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>

          <Pressable
            onPress={next}
            hitSlop={8}
            accessibilityLabel="Next"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text style={[styles.iconText, { color: TEXT_PRIMARY, fontSize: 28 }]}>⏭</Text>
          </Pressable>

          <Pressable
            onPress={cycleRepeat}
            hitSlop={8}
            accessibilityLabel={`Repeat ${repeat}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
          >
            <Text
              style={[
                styles.iconText,
                {
                  color: repeat !== 'off' ? TEXT_PRIMARY : TEXT_MUTED,
                  fontSize: 20,
                },
              ]}
            >
              {repeat === 'one' ? '↻¹' : '↻'}
            </Text>
          </Pressable>
        </Animated.View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  closeIcon: {
    color: TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: '300',
  },

  // Middle row: artwork (left) + lyrics (right)
  middle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    minHeight: 220,
  },
  artColumn: {
    width: '45%',
    alignItems: 'center',
  },
  // Vinyl-record style artwork. The outer ring + spindle give the
  // "spinning disc" feel from the reference.
  artDisc: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  artImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  artSpindle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  titleText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  artistText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },

  // Lyrics column on the right. Three rows stacked vertically:
  // prev / active / next. The active line is the middle row. The
  // parent column uses LinearTransition so when activeLineIdx
  // changes, the rows' text changes and reanimated animates the
  // height shift (slide up) automatically.
  lyricsColumn: {
    flex: 1,
    paddingLeft: spacing.lg,
    justifyContent: 'center',
  },
  lyricColumnInner: {
    width: '100%',
  },
  lyricRow: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  lyricText: {
    textAlign: 'center',
    fontFamily: fontFamily.oswald,
    letterSpacing: 0.3,
  },
  lyricTextActive: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  lyricTextPast: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  lyricTextFuture: {
    color: TEXT_MUTED,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  lyricPressed: {
    opacity: 0.6,
  },

  // Progress bar
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timeText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  timeTextSmall: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '500',
  },
  heart: {
    color: TEXT_PRIMARY,
    fontSize: 24,
    lineHeight: 28,
  },
  heartOn: {
    color: '#FF4D6D',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
  },
  progressHitArea: {
    paddingVertical: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: TEXT_PRIMARY,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEXT_PRIMARY,
  },
  playGlyph: {
    color: '#0A0A14',
    fontSize: 30,
    fontWeight: '800',
  },
  iconText: {
    fontWeight: '700',
  },

  // Web background overflow guard
  artBgWrap: { overflow: 'hidden' },
  artBg: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.2 }],
  },
});
