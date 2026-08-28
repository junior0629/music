/**
 * Player types — independent of any specific provider.
 * Phase 1: shape only. Phase 2: this is what YouTubeProvider returns.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  durationSec: number;
  thumbnail: string;
  sourceProvider: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnail: string;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
}

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  /** Source the results came from (e.g., 'piped', 'mock') */
  source: string;
}

export interface StreamInfo {
  url: string;
  /** mime type if known, e.g. 'audio/mp4' */
  mimeType?: string;
  /** Duration in seconds if known */
  durationSec?: number;
  /** Suggested expiry — Piped URLs are signed and time-limited */
  expiresAt?: number;
}
