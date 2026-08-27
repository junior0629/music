/**
 * Music provider factory.
 *
 * Phase 1: returns the MockProvider.
 * Phase 2: returns a PipedProvider.
 *
 * All app code calls `getProvider()` and never the concrete class.
 * Swapping is a one-line change here.
 */
import { MusicProvider } from './provider';
import { MockProvider } from './mockProvider';

let cached: MusicProvider | null = null;

export function getProvider(): MusicProvider {
  if (cached) return cached;
  // Phase 1: mock. Phase 2 will replace with `new PipedProvider(...)`.
  cached = new MockProvider();
  return cached;
}

export type { MusicProvider } from './provider';
