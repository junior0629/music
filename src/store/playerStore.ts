/**
 * Player store — global playback state.
 *
 * Phase 1: shape + UI-read fields. No actual playback yet.
 * Phase 2: services/player/ drives these fields via expo-av (native)
 *          or HTML5 <audio> (web).
 *
 * Components read from this store and call mutator functions to
 * change state. They never talk to the audio engine directly.
 */
import { create } from 'zustand';
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';

export type RepeatMode = 'off' | 'one' | 'all';

interface PlayerState {
  /** Current track, or null if nothing loaded */
  currentTrack: Track | null;
  /** Up next */
  queue: Track[];
  /** Index into queue of the currently playing track (or -1) */
  queueIndex: number;
  isPlaying: boolean;
  /** Position in seconds */
  position: number;
  /** Track duration in seconds */
  duration: number;
  /** 0..1 */
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeat: RepeatMode;
  /** True when the player is buffering */
  isBuffering: boolean;
  /** Last error from the audio engine, if any */
  lastError: string | null;

  // Mutators
  loadTrack: (track: Track, queue?: Track[]) => void;
  setPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  next: () => void;
  prev: () => void;
  clearError: () => void;
}

const initial: Pick<
  PlayerState,
  'currentTrack' | 'queue' | 'queueIndex' | 'isPlaying' | 'position' | 'duration' | 'volume' | 'isMuted' | 'isShuffled' | 'repeat' | 'isBuffering' | 'lastError'
> = {
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeat: 'off',
  isBuffering: false,
  lastError: null,
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initial,

  loadTrack: (track, queue) => {
    const q = queue && queue.length > 0 ? queue : [track];
    const idx = q.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      queue: q,
      queueIndex: idx >= 0 ? idx : 0,
      position: 0,
      duration: track.durationSec,
      isPlaying: false,
      lastError: null,
    });
    logger.info('Player: loaded track', { id: track.id, title: track.title, queueLen: q.length });
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

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

  next: () => {
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
    set({ currentTrack: t, queueIndex: nextIdx, position: 0, duration: t.durationSec });
    logger.info('Player: next', { id: t.id, title: t.title });
  },

  prev: () => {
    const { queue, queueIndex, position } = get();
    if (position > 3 && queueIndex >= 0) {
      set({ position: 0 });
      return;
    }
    if (queue.length === 0) return;
    const prevIdx = Math.max(0, queueIndex - 1);
    const t = queue[prevIdx];
    if (!t) return;
    set({ currentTrack: t, queueIndex: prevIdx, position: 0, duration: t.durationSec });
    logger.info('Player: prev', { id: t.id, title: t.title });
  },

  clearError: () => set({ lastError: null }),
}));
