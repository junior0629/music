/**
 * Music provider factory.
 *
 * Phase 2: returns YouTubeProvider (official YouTube Data API v3
 * + IFrame player for playback). Mock and Piped are kept around
 * for offline dev but are no longer the default.
 *
 * All app code calls `getProvider()` and never the concrete class.
 * Swapping is a one-line change here.
 */
import { MusicProvider } from './provider';
import { YouTubeProvider } from './YouTubeProvider';

let cached: MusicProvider | null = null;

export function getProvider(): MusicProvider {
  if (cached) return cached;
  cached = new YouTubeProvider();
  return cached;
}

/** For tests / offline dev: use the mock instead. */
export function useMockProvider(): MusicProvider {
  // Lazy import so we don't pull mock into the prod bundle unnecessarily
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MockProvider } = require('./mockProvider') as typeof import('./mockProvider');
  return new MockProvider();
}

export type { MusicProvider } from './provider';
