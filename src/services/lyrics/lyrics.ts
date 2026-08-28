/**
 * LyricsService — fetches song lyrics from LRClib (free, no API key,
 * CORS-open). Returns either time-synced (LRC) lines, plain lines,
 * an "instrumental" marker, or "none" when the track isn't in the DB.
 *
 * LRClib endpoint:
 *   GET https://lrclib.net/api/get
 *     ?artist_name=…&track_name=…&duration=…  (duration in seconds, optional)
 *
 * Response (when found):
 *   { id, trackName, artistName, albumName, duration, instrumental,
 *     plainLyrics, syncedLyrics, lyricsfile }
 * Both `plainLyrics` and `syncedLyrics` may be null. We prefer
 * `syncedLyrics` (LRC: `[mm:ss.xx]line`) so we can highlight the
 * active line by `position`; fall back to `plainLyrics` split on
 * newlines, distributed evenly across the song duration.
 *
 * 404 (not in DB) → `{ kind: 'none' }`. UI shows a quiet fallback.
 */
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';
import { withErrorLogging } from '@/utils/withErrorLogging';

const BASE = 'https://lrclib.net/api/get';
const TIMEOUT_MS = 10_000;

export interface LyricLine {
  text: string;
  /** Seconds (only set for synced LRC lines). */
  startSec?: number;
}

export type LyricsResult =
  | { kind: 'synced'; lines: LyricLine[] }
  | { kind: 'plain'; lines: LyricLine[] }
  | { kind: 'instrumental' }
  | { kind: 'none' };

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

class LyricsService {
  private cache = new Map<string, LyricsResult>();

  /** Clear in-memory cache. (Phase 3 will swap this for SQLite.) */
  clearCache(): void {
    this.cache.clear();
  }

  getLyrics = withErrorLogging(
    'LyricsService.getLyrics',
    async (track: Track, signal?: AbortSignal): Promise<LyricsResult> => {
      const key = track.id;
      const cached = this.cache.get(key);
      if (cached) {
        logger.debug('LyricsService cache hit', { key });
        return cached;
      }

      const result = await this.fetchFromLrclib(track, signal);
      this.cache.set(key, result);
      return result;
    },
  );

  private async fetchFromLrclib(
    track: Track,
    signal?: AbortSignal,
  ): Promise<LyricsResult> {
    const params = new URLSearchParams({
      artist_name: track.artist,
      track_name: track.title,
    });
    if (track.durationSec > 0) {
      params.set('duration', String(Math.round(track.durationSec)));
    }
    const url = `${BASE}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    // Chain the caller's signal (so React can cancel on unmount/track change)
    if (signal) {
      if (signal.aborted) controller.abort();
      signal.addEventListener('abort', () => controller.abort());
    }
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (res.status === 404) {
        logger.info('LyricsService: not found', { title: track.title, artist: track.artist });
        return { kind: 'none' };
      }
      if (!res.ok) {
        logger.warn('LyricsService: HTTP error', { status: res.status, title: track.title });
        return { kind: 'none' };
      }
      const data = (await res.json()) as LrclibResponse;
      if (data.instrumental) {
        logger.info('LyricsService: instrumental', { title: track.title });
        return { kind: 'instrumental' };
      }
      if (data.syncedLyrics && data.syncedLyrics.trim().length > 0) {
        const lines = parseLrc(data.syncedLyrics);
        if (lines.length > 0) {
          logger.info('LyricsService: synced', { title: track.title, count: lines.length });
          return { kind: 'synced', lines };
        }
      }
      if (data.plainLyrics && data.plainLyrics.trim().length > 0) {
        const lines = parsePlain(data.plainLyrics);
        if (lines.length > 0) {
          logger.info('LyricsService: plain', { title: track.title, count: lines.length });
          return { kind: 'plain', lines };
        }
      }
      logger.info('LyricsService: empty response', { title: track.title });
      return { kind: 'none' };
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        return { kind: 'none' };
      }
      logger.warn('LyricsService: fetch failed', { err: String(err), title: track.title });
      return { kind: 'none' };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Parse LRC into ordered LyricLine[]. Each line may have one or more
 * timestamps (e.g. `[00:12.00][00:45.00]chorus line`); we emit one
 * entry per timestamp so the same lyric can appear at multiple points.
 * Lines without a timestamp are dropped here (they belong to the
 * plain-lyrics fallback path).
 */
function parseLrc(lrc: string): LyricLine[] {
  const out: LyricLine[] = [];
  const lines = lrc.split(/\r?\n/);
  const tagRe = /\[(\d+):(\d+(?:[.:]\d+)?)\]/g;
  for (const raw of lines) {
    const text = raw.replace(tagRe, '').trim();
    if (!text) continue;
    const stamps: number[] = [];
    let m: RegExpExecArray | null;
    tagRe.lastIndex = 0;
    while ((m = tagRe.exec(raw)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseFloat(m[2].replace(',', '.'));
      if (!isNaN(min) && !isNaN(sec)) stamps.push(min * 60 + sec);
    }
    if (stamps.length === 0) continue;
    for (const startSec of stamps) {
      out.push({ text, startSec });
    }
  }
  out.sort((a, b) => (a.startSec ?? 0) - (b.startSec ?? 0));
  return out;
}

/** Split plain lyrics on newlines; drop empty / whitespace-only lines. */
function parsePlain(text: string): LyricLine[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => ({ text: l }));
}

export const lyricsService = new LyricsService();
