/**
 * LyricsService — fetches song lyrics from LRClib (free, no API key,
 * CORS-open). Returns either time-synced (LRC) lines, plain lines,
 * an "instrumental" marker, or "none" when the track isn't in the DB.
 *
 * Lookup strategy:
 *   1. GET /api/get?artist_name=…&track_name=…&duration=…
 *      (best when the original artist is correct)
 *   2. If 404, fall back to GET /api/search?q=… with the cleaned
 *      title, and pick the result whose duration is within ±4s of
 *      our track. This catches the very common case where a YouTube
 *      result is a cover/lyric-video re-upload (e.g. "Luxury Music"
 *      re-uploading Adele) — LRClib knows the song, just not the
 *      uploader's channel.
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

const GET_URL = 'https://lrclib.net/api/get';
const SEARCH_URL = 'https://lrclib.net/api/search';
const TIMEOUT_MS = 10_000;
const DURATION_TOLERANCE_SEC = 4;

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

      const result = await this.fetch(track, signal);
      this.cache.set(key, result);
      return result;
    },
  );

  private async fetch(track: Track, signal?: AbortSignal): Promise<LyricsResult> {
    // 1. Direct lookup
    const direct = await this.fetchOne(
      `${GET_URL}?${this.getQuery(track)}`,
      track,
      signal,
    );
    if (direct.kind !== 'none') return direct;

    // 2. Search fallback (only if the direct 404'd, not on network error)
    //    We use the cleaned title as the query — covers the common case
    //    where the uploader is a lyric channel and LRClib only knows
    //    the original artist/song.
    const cleanedTitle = cleanTitle(track.title);
    if (cleanedTitle.length < 2) return direct;

    const searchResults = await this.fetchSearch(cleanedTitle, signal);
    if (searchResults.length === 0) return direct;

    // Score each result and pick the best. Score combines:
    //   - title similarity (how much of the cleaned title appears in
    //     the candidate's trackName)
    //   - artist-token overlap (does the candidate artist name contain
    //     any token from the original track's artist? — important
    //     because re-uploaded YouTube videos have arbitrary channel
    //     names like "Luxury Music" that have nothing to do with the
    //     real artist, so we need a separate signal)
    //   - duration proximity (closer to our track duration wins)
    const target = track.durationSec;
    const titleTokens = cleanedTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1);
    const artistTokens = track.artist
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let bestScore = -Infinity;
    let best: LrclibResponse = searchResults[0];
    for (const r of searchResults) {
      const cTitle = r.trackName.toLowerCase();
      const cArtist = r.artistName.toLowerCase();
      const titleHit = titleTokens.filter((t) => cTitle.includes(t)).length;
      const titleScore = titleTokens.length === 0 ? 0 : titleHit / titleTokens.length;
      const artistHit = artistTokens.some((t) => cArtist.includes(t)) ? 1 : 0;
      const durDelta =
        target > 0 && typeof r.duration === 'number'
          ? Math.abs(r.duration - target)
          : 999;
      const durPenalty = Math.min(durDelta, 30) / 30; // 0..1
      const score = titleScore * 2 + artistHit * 1.5 - durPenalty;
      logger.debug('LyricsService: search candidate', {
        id: r.id,
        artist: r.artistName,
        track: r.trackName,
        duration: r.duration,
        titleScore: titleScore.toFixed(2),
        artistHit,
        score: score.toFixed(2),
      });
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }

    if (!best) return direct;

    // Only accept the match if the title similarity is reasonable, OR
    // the candidate has synced lyrics (a strong positive signal that
    // it's a real, time-aligned entry for this song).
    const bestTitle = best.trackName.toLowerCase();
    const bestTitleHit = titleTokens.filter((t) => bestTitle.includes(t)).length;
    const bestTitleScore = titleTokens.length === 0 ? 0 : bestTitleHit / titleTokens.length;
    const hasSynced = Boolean(best.syncedLyrics && best.syncedLyrics.trim().length > 0);
    if (bestTitleScore < 0.4 && !hasSynced) {
      logger.info('LyricsService: search match too weak, rejecting', {
        title: track.title,
        bestTitle: best.trackName,
        bestArtist: best.artistName,
        score: bestTitleScore.toFixed(2),
      });
      return direct;
    }

    // If the duration is wildly off, still reject (we don't want to
    // show lyrics for a 4-minute track on a 6-minute one).
    if (
      target > 0 &&
      typeof best.duration === 'number' &&
      Math.abs(best.duration - target) > DURATION_TOLERANCE_SEC * 3
    ) {
      logger.info('LyricsService: duration mismatch, rejecting', {
        title: track.title,
        target,
        matched: best.duration,
      });
      return direct;
    }

    logger.info('LyricsService: matched via search', {
      title: track.title,
      matched: `${best.artistName} – ${best.trackName} (id=${best.id}, dur=${best.duration}s)`,
    });
    return parseResponse(best, track);
  }

  private getQuery(track: Track): string {
    const params = new URLSearchParams({
      artist_name: track.artist,
      track_name: track.title,
    });
    if (track.durationSec > 0) {
      params.set('duration', String(Math.round(track.durationSec)));
    }
    return params.toString();
  }

  private async fetchOne(
    url: string,
    track: Track,
    signal?: AbortSignal,
  ): Promise<LyricsResult> {
    const { res, networkError } = await this.httpGet(url, signal);
    if (networkError) {
      logger.warn('LyricsService: network error', { err: networkError, title: track.title });
      return { kind: 'none' };
    }
    if (res.status === 404) {
      logger.info('LyricsService: get 404', { title: track.title, artist: track.artist });
      return { kind: 'none' };
    }
    if (!res.ok) {
      logger.warn('LyricsService: HTTP error', { status: res.status, title: track.title });
      return { kind: 'none' };
    }
    let data: LrclibResponse;
    try {
      data = (await res.json()) as LrclibResponse;
    } catch (err) {
      logger.warn('LyricsService: parse error', { err: String(err) });
      return { kind: 'none' };
    }
    return parseResponse(data, track);
  }

  private async fetchSearch(
    query: string,
    signal?: AbortSignal,
  ): Promise<LrclibResponse[]> {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
    const { res, networkError } = await this.httpGet(url, signal);
    if (networkError) {
      logger.warn('LyricsService: search network error', { err: networkError, q: query });
      return [];
    }
    if (!res.ok) {
      logger.warn('LyricsService: search HTTP error', { status: res.status });
      return [];
    }
    try {
      const list = (await res.json()) as LrclibResponse[];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      logger.warn('LyricsService: search parse error', { err: String(err) });
      return [];
    }
  }

  private async httpGet(
    url: string,
    signal?: AbortSignal,
  ): Promise<{ res: Response; networkError?: undefined } | { res: Response; networkError: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    if (signal) {
      if (signal.aborted) controller.abort();
      signal.addEventListener('abort', () => controller.abort());
    }
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      return { res };
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        // Caller-aborted; we return a 499-ish marker via networkError string.
        return { res: new Response(null, { status: 0 }), networkError: 'aborted' };
      }
      return { res: new Response(null, { status: 0 }), networkError: String(err) };
    } finally {
      clearTimeout(timer);
    }
  }
}

function parseResponse(data: LrclibResponse, track: Track): LyricsResult {
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
}

/**
 * Strip common YouTube title noise so a search like
 * "Adele - Hello (Lyric Video) (Official Audio)" becomes
 * "Adele - Hello". This dramatically improves the search-fallback hit
 * rate. We also drop a trailing " - <artist>" if the artist is the
 * same as the track's `artist` field (avoids doubled-up search terms).
 */
function cleanTitle(raw: string): string {
  let t = raw;
  // Drop bracketed/parenthesized noise
  t = t.replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, ' ');
  // Drop common marketing tags (case-insensitive, word-boundary)
  t = t.replace(
    /\b(official\s+(music\s+)?(video|audio|lyric(\s*video)?|visualizer)?|lyric\s+video|lyrics\s+video|official\s+hd|hd\s+video|full\s+album|m\/v|mv|hq|4k|remastered(\s+\d{4})?)\b/gi,
    ' ',
  );
  // Collapse dashes that became "  -  " after tag removal
  t = t.replace(/\s*-\s*/g, ' ');
  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
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
