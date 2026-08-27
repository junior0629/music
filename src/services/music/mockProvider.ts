/**
 * MockProvider — Phase 1 only.
 *
 * Returns a fixed set of fake tracks for any search query. Clearly
 * labeled as mock in the response so the UI can show a "mock data"
 * banner in dev. This will be deleted in Phase 2 when PipedProvider
 * is implemented. No real network calls happen here.
 */
import { MusicProvider } from './provider';
import { Track, Album, Artist, SearchResults, StreamInfo } from '@/types/player';
import { logger } from '@/utils/logger';

const MOCK_THUMBNAIL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="%237C3AED"/><stop offset="0.5" stop-color="%23EC4899"/><stop offset="1" stop-color="%233B82F6"/></linearGradient></defs><rect width="80" height="80" rx="14" fill="url(%23g)"/><text x="50%" y="55%" font-family="sans-serif" font-size="28" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">♪</text></svg>',
  );

const MOCK_TRACKS: Track[] = [
  {
    id: 'mock_1',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    durationSec: 251,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_2',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: "Short n' Sweet",
    durationSec: 175,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_3',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    album: 'rosie',
    durationSec: 170,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_4',
    title: 'Salamin, Salamin',
    artist: 'BINI',
    album: 'Born to Win',
    durationSec: 215,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_5',
    title: 'Pantropiko',
    artist: 'BINI',
    album: 'Born to Win',
    durationSec: 200,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_6',
    title: 'Golden',
    artist: 'HUNTR/X',
    album: 'K-Pop Demon Hunters',
    durationSec: 192,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_7',
    title: 'Supernova',
    artist: 'aespa',
    album: 'Armageddon',
    durationSec: 178,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
  {
    id: 'mock_8',
    title: 'Raining in Manila',
    artist: 'Lola Amour',
    album: 'Raining in Manila',
    durationSec: 233,
    thumbnail: MOCK_THUMBNAIL,
    sourceProvider: 'mock',
  },
];

export class MockProvider implements MusicProvider {
  readonly name = 'Mock (Phase 1 — not real)';

  async search(query: string): Promise<SearchResults> {
    const q = query.trim().toLowerCase();
    const tracks = q
      ? MOCK_TRACKS.filter(
          (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
        )
      : MOCK_TRACKS;
    logger.debug('MockProvider.search', { query, hits: tracks.length });
    return { tracks, albums: [], artists: [], source: 'mock' };
  }

  async getTrack(id: string): Promise<Track> {
    const t = MOCK_TRACKS.find((m) => m.id === id);
    if (!t) throw new Error(`Mock track not found: ${id}`);
    return t;
  }

  async getAlbum(_id: string): Promise<Album> {
    throw new Error('MockProvider.getAlbum not implemented');
  }

  async getArtist(_id: string): Promise<Artist> {
    throw new Error('MockProvider.getArtist not implemented');
  }

  async getStreamUrl(_trackId: string): Promise<StreamInfo> {
    throw new Error('MockProvider.getStreamUrl not implemented (Phase 1 — no playback)');
  }
}
