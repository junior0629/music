/**
 * Audio service abstraction.
 *
 * Phase 1: stub only. The player store has the shape; the actual audio
 * engine lives behind this interface.
 * Phase 2: real impl using expo-av on native, HTML5 <audio> on web.
 *
 * Callers (the player store actions, the player UI) never call the
 * audio engine directly. They go through this interface, which
 * picks the right backend for the platform.
 */
import { Track, StreamInfo } from '@/types/player';
import { logger } from '@/utils/logger';

export interface AudioService {
  /** Load a track and prepare it for playback (does not start). */
  load(track: Track, stream: StreamInfo): Promise<void>;
  /** Start or resume playback. */
  play(): Promise<void>;
  /** Pause playback. */
  pause(): Promise<void>;
  /** Stop and unload. */
  unload(): Promise<void>;
  /** Seek to a position in seconds. */
  seek(positionSec: number): Promise<void>;
  /** Set volume 0..1. */
  setVolume(volume: number): Promise<void>;
  /** Subscribe to position updates. Returns an unsubscribe fn. */
  onPosition(listener: (positionSec: number) => void): () => void;
  /** Subscribe to end-of-track events. */
  onEnded(listener: () => void): () => void;
  /** Subscribe to errors. */
  onError(listener: (message: string) => void): () => void;
  /** Subscribe to buffering state. */
  onBuffering(listener: (isBuffering: boolean) => void): () => void;
}

class NoopAudioService implements AudioService {
  async load(): Promise<void> {
    logger.debug('audio.load (noop)');
  }
  async play(): Promise<void> {
    logger.debug('audio.play (noop)');
  }
  async pause(): Promise<void> {
    logger.debug('audio.pause (noop)');
  }
  async unload(): Promise<void> {
    logger.debug('audio.unload (noop)');
  }
  async seek(): Promise<void> {
    /* noop */
  }
  async setVolume(): Promise<void> {
    /* noop */
  }
  onPosition(): () => void {
    return () => undefined;
  }
  onEnded(): () => void {
    return () => undefined;
  }
  onError(): () => void {
    return () => undefined;
  }
  onBuffering(): () => void {
    return () => undefined;
  }
}

/**
 * Phase 1 ships a no-op audio service. Phase 2 will replace this
 * with a platform-detecting implementation.
 */
export const audio: AudioService = new NoopAudioService();
