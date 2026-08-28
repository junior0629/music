/**
 * Player store — global playback state.
 *
 * Phase 2: store actions call into the AudioService. The store is
 * the only place in the app that talks to the audio engine. UI
 * components read state from the store and call mutator functions.
 */
import { create } from 'zustand';
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';
import { getAudio } from '@/services/player/audio';
import { getProvider } from '@/services/music';
import { extractPalette } from '@/utils/dominantColor';
import { usePaletteStore } from './paletteStore';

export type RepeatMode = 'off' | 'one' | 'all';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeat: RepeatMode;
  isBuffering: boolean;
  lastError: string | null;

  // Mutators
  /** Load a track into the player (fetches stream URL, calls audio.load). */
  loadTrack: (track: Track, queue?: Track[]) => Promise<void>;
  /** Play the currently loaded track. */
  play: () => Promise<void>;
  /** Pause the currently playing track. */
  pause: () => Promise<void>;
  /** Toggle play/pause. */
  togglePlay: () => Promise<void>;
  /** Internal setter used by the audio service event subscriptions. */
  setPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
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

const initial = {
  currentTrack: null as Track | null,
  queue: [] as Track[],
  queueIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeat: 'off' as RepeatMode,
  isBuffering: false,
  lastError: null as string | null,
};

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Wire audio service events to store updates (set up once on first use)
  let unsubscribers: Array<() => void> = [];
  let initialized = false;

  function wireAudioEvents() {
    if (initialized) return;
    initialized = true;
    const audio = getAudio();
    unsubscribers.push(
      audio.onPosition((p) => set({ position: p })),
    );
    unsubscribers.push(
      audio.onBuffering((b) => set({ isBuffering: b })),
    );
    unsubscribers.push(
      audio.onPlayingChange((p) => {
        // Authoritative source: the IFrame tells us when it's actually
        // playing. This handles the auto-play-in-onReady case where the
        // store never called play() but the IFrame started anyway.
        set({ isPlaying: p });
      }),
    );
    unsubscribers.push(
      audio.onEnded(() => {
        logger.info('audio.ended');
        set({ isPlaying: false });
        // Auto-advance to next track
        get().next().catch((e) => logger.error('next() failed', { err: String(e) }));
      }),
    );
    unsubscribers.push(
      audio.onError((msg) => {
        logger.error('audio error', { msg });
        set({ isPlaying: false, lastError: msg });
      }),
    );
  }

  return {
    ...initial,

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
      set({
        currentTrack: track,
        queue: q,
        queueIndex: idx >= 0 ? idx : 0,
        position: 0,
        duration: track.durationSec,
        isPlaying: false,
        isBuffering: true,
        lastError: null,
      });
      logger.info('Player: loaded track', { id: track.id, title: track.title, queueLen: q.length });
      // Fire-and-forget palette extraction (web only; non-blocking)
      if (track.thumbnail) {
        extractPalette(track.thumbnail)
          .then((p) => {
            if (p) usePaletteStore.getState().setPalette(p);
          })
          .catch(() => undefined);
      }
      try {
        const stream = await getProvider().getStreamUrl(track.id);
        logger.debug('Player: stream URL fetched', { mime: stream.mimeType, hasUrl: Boolean(stream.url) });
        await audio.load(track, stream);
        set({ isBuffering: false, duration: stream.durationSec ?? track.durationSec });
      } catch (err) {
        const e = err as Error;
        const msg = e?.message ?? String(err);
        logger.error('Player: loadTrack failed', { id: track.id, title: track.title, err: msg }, e);
        set({ isBuffering: false, lastError: msg });
        throw err;
      }
    },

    play: async () => {
      const audio = getAudio();
      try {
        await audio.play();
        set({ isPlaying: true });
      } catch (err) {
        const e = err as Error;
        const msg = e?.message ?? String(err);
        logger.error('Player: play failed', { err: msg }, e);
        set({ lastError: msg });
      }
    },

    pause: async () => {
      const audio = getAudio();
      try {
        await audio.pause();
        set({ isPlaying: false });
      } catch (err) {
        logger.warn('Player: pause failed', { err: String(err) });
      }
    },

    togglePlay: async () => {
      const { isPlaying, currentTrack, position, duration } = get();
      if (!currentTrack) {
        logger.debug('togglePlay: no track loaded, no-op');
        return;
      }
      if (isPlaying) {
        await get().pause();
      } else {
        // If at end, restart from beginning
        if (duration > 0 && position >= duration - 0.5) {
          await get().seek(0);
        }
        await get().play();
      }
    },

    setPlaying: (isPlaying) => set({ isPlaying }),
    setPosition: (position) => set({ position }),
    setDuration: (duration) => set({ duration }),

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
          set({ isPlaying: false });
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
      const { queue, queueIndex, position } = get();
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
      set({ position: positionSec });
    },

    clearError: () => set({ lastError: null }),
  };
});
