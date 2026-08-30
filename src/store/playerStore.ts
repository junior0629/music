/**
 * Player store — global playback state.
 *
 * Phase 2: store actions call into the AudioService. The store is
 * the only place in the app that talks to the audio engine. UI
 * components read state from the store and call mutator functions.
 *
 * Phase 2c (this rewrite): split into two stores to avoid the
 * "every IFrame position tick re-renders the whole app" problem.
 *
 *   - usePlayerPlaybackStore: HIGH-FREQUENCY state that changes
 *     4×/sec (position) and on play/pause (isPlaying, isBuffering,
 *     duration). Components that only need the current track / queue
 *     / shuffle / repeat should NOT subscribe here.
 *
 *   - usePlayerMetaStore: LOW-FREQUENCY state that changes on user
 *     intent (load track, next/prev, toggle shuffle, etc.). Most
 *     screens (Home, Search, Library, Settings, MiniPlayer's track
 *     title/artist) only need this slice.
 *
 * The actions live on the meta store and forward to the audio
 * service; when an action also needs to update playback state, it
 * touches the playback store via `usePlayerPlaybackStore.getState()`.
 *
 * Both stores share the same `init()` wiring, called once at app
 * boot from app/_layout.tsx.
 */
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';
import { getAudio } from '@/services/player/audio';
import { getProvider } from '@/services/music';

export type RepeatMode = 'off' | 'one' | 'all';

// ============================================================================
// Playback store (HIGH frequency — only subscribe when you render the bar)
// ============================================================================

interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;

  // Internal setters used by the audio service event subscriptions.
  // Marked private by convention — only the audio wiring touches these.
  _setPlaying: (isPlaying: boolean) => void;
  _setPosition: (position: number) => void;
  _setDuration: (duration: number) => void;
  _setBuffering: (b: boolean) => void;
}

export const usePlayerPlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  position: 0,
  duration: 0,
  isBuffering: false,
  _setPlaying: (isPlaying) => set({ isPlaying }),
  _setPosition: (position) => set({ position }),
  _setDuration: (duration) => set({ duration }),
  _setBuffering: (isBuffering) => set({ isBuffering }),
}));

// ============================================================================
// Meta store (LOW frequency — track/queue/shuffle/repeat/volume)
// ============================================================================

interface MetaState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeat: RepeatMode;
  lastError: string | null;

  /** Load a track into the player (fetches stream URL, calls audio.load). */
  loadTrack: (track: Track, queue?: Track[]) => Promise<void>;
  /** Play the currently loaded track. */
  play: () => Promise<void>;
  /** Pause the currently playing track. */
  pause: () => Promise<void>;
  /** Toggle play/pause. */
  togglePlay: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (positionSec: number) => Promise<void>;
  clearError: () => void;
  /** Wire up event listeners from the audio service. Call once at app boot. */
  init: () => () => void;
}

const initialMeta = {
  currentTrack: null as Track | null,
  queue: [] as Track[],
  queueIndex: -1,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeat: 'off' as RepeatMode,
  lastError: null as string | null,
};

export const usePlayerMetaStore = create<MetaState>((set, get) => {
  // Wire audio service events to store updates (set up once on first use).
  // Both stores get the same wiring — the playback store updates the
  // 4×/sec fields, the meta store updates the low-frequency fields.
  let unsubscribers: Array<() => void> = [];
  let initialized = false;

  function wireAudioEvents() {
    if (initialized) return;
    initialized = true;
    const audio = getAudio();
    const playback = usePlayerPlaybackStore.getState();
    unsubscribers.push(
      audio.onPosition((p) => playback._setPosition(p)),
    );
    unsubscribers.push(
      audio.onBuffering((b) => playback._setBuffering(b)),
    );
    unsubscribers.push(
      audio.onPlayingChange((p) => {
        // Authoritative source: the IFrame tells us when it's actually
        // playing. This handles the auto-play-in-onReady case where the
        // store never called play() but the IFrame started anyway.
        playback._setPlaying(p);
      }),
    );
    unsubscribers.push(
      audio.onEnded(() => {
        logger.info('audio.ended');
        playback._setPlaying(false);
        // Auto-advance to next track
        get().next().catch((e) => logger.error('next() failed', { err: String(e) }));
      }),
    );
    unsubscribers.push(
      audio.onError((msg) => {
        logger.error('audio error', { msg });
        playback._setPlaying(false);
        set({ lastError: msg });
      }),
    );
  }

  return {
    ...initialMeta,

    init: () => {
      wireAudioEvents();
      return () => {
        unsubscribers.forEach((u) => u());
        unsubscribers = [];
        initialized = false;
      };
    },

    loadTrack: async (track, queue) => {
      const q = queue && queue.length > 0 ? queue : [track];
      const idx = q.findIndex((t) => t.id === track.id);
      wireAudioEvents();
      const audio = getAudio();
      const playback = usePlayerPlaybackStore.getState();
      set({
        currentTrack: track,
        queue: q,
        queueIndex: idx >= 0 ? idx : 0,
        lastError: null,
      });
      // Reset the high-frequency fields synchronously so the UI
      // immediately reflects "new track, no progress, not playing yet".
      playback._setPosition(0);
      playback._setDuration(track.durationSec);
      playback._setPlaying(false);
      playback._setBuffering(true);
      logger.info('Player: loaded track', { id: track.id, title: track.title, queueLen: q.length });
      try {
        const stream = await getProvider().getStreamUrl(track.id);
        logger.debug('Player: stream URL fetched', { mime: stream.mimeType, hasUrl: Boolean(stream.url) });
        await audio.load(track, stream);
        playback._setBuffering(false);
        playback._setDuration(stream.durationSec ?? track.durationSec);
      } catch (err) {
        const e = err as Error;
        const msg = e?.message ?? String(err);
        logger.error('Player: loadTrack failed', { id: track.id, title: track.title, err: msg }, e);
        playback._setBuffering(false);
        set({ lastError: msg });
        throw err;
      }
    },

    play: async () => {
      const audio = getAudio();
      const playback = usePlayerPlaybackStore.getState();
      try {
        await audio.play();
        playback._setPlaying(true);
      } catch (err) {
        const e = err as Error;
        const msg = e?.message ?? String(err);
        logger.error('Player: play failed', { err: msg }, e);
        set({ lastError: msg });
      }
    },

    pause: async () => {
      const audio = getAudio();
      const playback = usePlayerPlaybackStore.getState();
      try {
        await audio.pause();
        playback._setPlaying(false);
      } catch (err) {
        logger.warn('Player: pause failed', { err: String(err) });
      }
    },

    togglePlay: async () => {
      const playback = usePlayerPlaybackStore.getState();
      const { currentTrack } = get();
      if (!currentTrack) {
        logger.debug('togglePlay: no track loaded, no-op');
        return;
      }
      if (playback.isPlaying) {
        await get().pause();
      } else {
        // If at end, restart from beginning
        if (playback.duration > 0 && playback.position >= playback.duration - 0.5) {
          await get().seek(0);
        }
        await get().play();
      }
    },

    setVolume: async (volume) => {
      const v = Math.max(0, Math.min(1, volume));
      set({ volume: v });
      const audio = getAudio();
      await audio.setVolume(v);
    },

    toggleMute: async () => {
      const { isMuted } = get();
      set({ isMuted: !isMuted });
      const audio = getAudio();
      await audio.setVolume(!isMuted ? 0 : get().volume);
    },

    toggleShuffle: () => {
      set((s) => ({ isShuffled: !s.isShuffled }));
      logger.debug('Player: shuffle toggled', { on: get().isShuffled });
    },

    cycleRepeat: () => {
      set((s) => ({
        repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
      }));
      logger.debug('Player: repeat cycled', { now: get().repeat });
    },

    next: async () => {
      const { queue, queueIndex, repeat } = get();
      if (queue.length === 0) return;
      let nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeat === 'all') nextIdx = 0;
        else {
          usePlayerPlaybackStore.getState()._setPlaying(false);
          return;
        }
      }
      const t = queue[nextIdx];
      if (!t) return;
      try {
        await get().loadTrack(t, queue);
        await get().play();
      } catch (err) {
        logger.error('Player: next failed', { err: String(err) });
      }
    },

    prev: async () => {
      const { queue, queueIndex } = get();
      const { position } = usePlayerPlaybackStore.getState();
      if (position > 3 && queueIndex >= 0) {
        await get().seek(0);
        return;
      }
      if (queue.length === 0) return;
      const prevIdx = Math.max(0, queueIndex - 1);
      const t = queue[prevIdx];
      if (!t) return;
      try {
        await get().loadTrack(t, queue);
        await get().play();
      } catch (err) {
        logger.error('Player: prev failed', { err: String(err) });
      }
    },

    seek: async (positionSec) => {
      const audio = getAudio();
      await audio.seek(positionSec);
      usePlayerPlaybackStore.getState()._setPosition(positionSec);
    },

    clearError: () => set({ lastError: null }),
  };
});

// ============================================================================
// Convenience hook: components that only need meta state
// ============================================================================
//
// Use this instead of `usePlayerStore` in Home, Search, Library,
// Settings, MiniPlayer — those screens don't render the position
// bar and shouldn't re-render 4×/sec when the IFrame ticks.

export function usePlayerMeta() {
  return usePlayerMetaStore(
    useShallow((s) => ({
      currentTrack: s.currentTrack,
      queue: s.queue,
      queueIndex: s.queueIndex,
      isShuffled: s.isShuffled,
      repeat: s.repeat,
      volume: s.volume,
      isMuted: s.isMuted,
      lastError: s.lastError,
    })),
  );
}
