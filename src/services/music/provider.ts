/**
 * MusicProvider interface.
 *
 * Phase 1: type definition only. A mock implementation is provided so
 * the UI can be developed without any network calls.
 * Phase 2: a real PipedProvider (calls public Piped REST instances
 * for YouTube-sourced tracks) replaces the mock. The interface stays
 * exactly the same.
 *
 * Swapping providers later is a one-line change in index.ts.
 */
import { Track, Album, Artist, SearchResults, StreamInfo } from '@/types/player';

export interface MusicProvider {
  /** Human-readable name shown in Settings. */
  readonly name: string;

  search(query: string, opts?: { signal?: AbortSignal }): Promise<SearchResults>;
  getTrack(id: string): Promise<Track>;
  getAlbum(id: string): Promise<Album>;
  getArtist(id: string): Promise<Artist>;
  getStreamUrl(trackId: string): Promise<StreamInfo>;
}
