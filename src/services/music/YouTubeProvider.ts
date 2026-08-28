/**
 * YouTubeProvider — MusicProvider implementation backed by the
 * official YouTube Data API v3.
 *
 * Search uses /search with `type=video&videoCategoryId=10` (Music
 * category) so results are restricted to music videos. Thumbnail
 * and duration come back in two calls (search + videos.list).
 * For a 2-user personal app, 1 call per search is fine; we batch
 * the videos.list call to fetch durations for all results in a
 * single request.
 *
 * Playback: this provider does NOT return a stream URL. The
 * `getStreamUrl` method returns a special "embed" StreamInfo that
 * tells the AudioService to use the YouTube IFrame Player. The
 * actual playback happens via the official IFrame Player API.
 *
 * Why IFrame over direct stream: the YouTube Data API doesn't
 * expose direct audio stream URLs (those require the inner
 * /get_video_info endpoint which needs special auth). The IFrame
 * player is the official, legal, supported path.
 */
import { MusicProvider } from './provider';
import { Track, Album, Artist, SearchResults, StreamInfo } from '@/types/player';
import { logger } from '@/utils/logger';
import { config, hasYouTubeKey } from '@/config/keys';
import {
  YouTubeSearchItem,
  YouTubeSearchResponse,
  YouTubeVideoListResponse,
} from './youtubeTypes';

const SOURCE_NAME = 'youtube';
const MAX_RESULTS = 25;
const BASE = 'https://www.googleapis.com/youtube/v3';
const MUSIC_CATEGORY_ID = '10'; // YouTube category for Music

export class YouTubeProvider implements MusicProvider {
  readonly name = 'YouTube (official)';

  async search(query: string, opts?: { signal?: AbortSignal }): Promise<SearchResults> {
    if (!hasYouTubeKey()) {
      throw new Error(
        'YouTube API key missing. Add EXPO_PUBLIC_YOUTUBE_API_KEY to .env.local. ' +
          'See .env.example for setup instructions.',
      );
    }
    const q = (query ?? '').trim();
    if (!q) {
      return { tracks: [], albums: [], artists: [], source: SOURCE_NAME };
    }

    const url =
      `${BASE}/search?key=${encodeURIComponent(config.youtubeApiKey)}` +
      `&part=snippet&type=video&videoCategoryId=${MUSIC_CATEGORY_ID}` +
      `&maxResults=${MAX_RESULTS}&q=${encodeURIComponent(q)}`;

    const data = await this.fetchJson<YouTubeSearchResponse>(url, 10_000, opts?.signal);
    if (!data?.items) {
      return { tracks: [], albums: [], artists: [], source: SOURCE_NAME };
    }

    // Filter out live broadcasts and channel results
    const videoItems = data.items.filter(
      (i) => i.id.kind === 'youtube#video' && i.snippet.liveBroadcastContent === 'none',
    );

    // Fetch durations AND embeddable status in a single batched call
    // (1 quota unit vs 100 per search). We filter out non-embeddable
    // videos because the YT IFrame Player silently fails to play them
    // (the video owner has "Allow embedding" disabled).
    const videoIds = videoItems.map((i) => i.id.videoId);
    const meta = await this.fetchVideoMeta(videoIds);
    const playableItems = videoItems.filter((i) => {
      const m = meta.get(i.id.videoId);
      // If we couldn't fetch status (rare), include the video and
      // let the user discover it's unplayable.
      return m?.embeddable !== false;
    });
    if (videoItems.length > 0 && playableItems.length < videoItems.length) {
      logger.info('Filtered non-embeddable results', {
        total: videoItems.length,
        playable: playableItems.length,
      });
    }

    return {
      tracks: playableItems.map((i) =>
        searchItemToTrack(i, meta.get(i.id.videoId)?.durationSec ?? 0),
      ),
      albums: [],
      artists: [],
      source: SOURCE_NAME,
    };
  }

  async getTrack(id: string): Promise<Track> {
    if (!hasYouTubeKey()) {
      throw new Error('YouTube API key missing. See .env.example for setup.');
    }
    const url =
      `${BASE}/videos?key=${encodeURIComponent(config.youtubeApiKey)}` +
      `&id=${encodeURIComponent(id)}&part=snippet,contentDetails,status`;
    const data = await this.fetchJson<YouTubeVideoListResponse>(url, 10_000);
    const v = data?.items?.[0];
    if (!v) throw new Error(`Video not found: ${id}`);
    if (v.status?.embeddable === false) {
      throw new Error(`Video not embeddable: ${v.snippet.title}`);
    }
    return {
      id: v.id,
      title: v.snippet.title,
      artist: v.snippet.channelTitle,
      durationSec: iso8601DurationToSeconds(v.contentDetails.duration),
      thumbnail: pickBestThumbnail(v.snippet.thumbnails),
      sourceProvider: SOURCE_NAME,
    };
  }

  async getAlbum(_id: string): Promise<Album> {
    throw new Error('YouTubeProvider.getAlbum not implemented (YouTube has no album concept)');
  }

  async getArtist(_id: string): Promise<Artist> {
    throw new Error('YouTubeProvider.getArtist not implemented');
  }

  async getStreamUrl(trackId: string): Promise<StreamInfo> {
    // Playback is via the YouTube IFrame Player. We return a
    // StreamInfo whose `url` is the YouTube watch URL; the
    // AudioService inspects the sourceProvider and routes to the
    // IFrame player instead of the HTML5 <audio> element.
    return {
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(trackId)}`,
      mimeType: 'youtube/iframe',
    };
  }

  // ---- internal helpers ----

  private async fetchVideoMeta(
    videoIds: ReadonlyArray<string>,
  ): Promise<Map<string, { durationSec: number; embeddable: boolean }>> {
    if (videoIds.length === 0) return new Map();
    try {
      const url =
        `${BASE}/videos?key=${encodeURIComponent(config.youtubeApiKey)}` +
        `&id=${videoIds.map(encodeURIComponent).join(',')}` +
        `&part=contentDetails,status`;
      const data = await this.fetchJson<YouTubeVideoListResponse>(url, 10_000);
      const map = new Map<string, { durationSec: number; embeddable: boolean }>();
      for (const v of data?.items ?? []) {
        map.set(v.id, {
          durationSec: iso8601DurationToSeconds(v.contentDetails.duration),
          // status.embeddable defaults to true if not present (older
          // videos), so we treat undefined as "embeddable".
          embeddable: v.status?.embeddable !== false,
        });
      }
      return map;
    } catch (err) {
      logger.warn('YouTubeProvider.fetchVideoMeta failed', { err: String(err) });
      return new Map();
    }
  }

  private async fetchJson<T>(
    url: string,
    timeoutMs: number,
    abortSignal?: AbortSignal,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    if (abortSignal) {
      if (abortSignal.aborted) controller.abort();
      abortSignal.addEventListener('abort', () => controller.abort());
    }
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`YouTube API HTTP ${res.status}: ${body.slice(0, 200)} [${url.slice(0, 80)}…]`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ---- response normalization helpers ----

function searchItemToTrack(item: YouTubeSearchItem, durationSec: number): Track {
  return {
    id: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    artistId: item.snippet.channelId,
    durationSec,
    thumbnail: pickBestThumbnail(item.snippet.thumbnails),
    sourceProvider: SOURCE_NAME,
  };
}

function pickBestThumbnail(
  thumbs: YouTubeSearchItem['snippet']['thumbnails'],
): string {
  return (
    thumbs.maxres?.url ??
    thumbs.standard?.url ??
    thumbs.high?.url ??
    thumbs.medium?.url ??
    thumbs.default?.url ??
    ''
  );
}

/**
 * Convert ISO 8601 duration (PT#H#M#S) to seconds.
 * Examples:
 *   PT4M13S -> 253
 *   PT1H2M3S -> 3723
 *   PT15S    -> 15
 */
function iso8601DurationToSeconds(iso: string): number {
  if (!iso) return 0;
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const min = parseInt(m[2] ?? '0', 10);
  const s = parseInt(m[3] ?? '0', 10);
  return h * 3600 + min * 60 + s;
}
