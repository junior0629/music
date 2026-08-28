/**
 * API key configuration.
 *
 * Reads from EXPO_PUBLIC_YOUTUBE_API_KEY. On web (via Metro), the
 * env var is read at build time. On native, it's read at runtime
 * from the bundled env.
 *
 * The key lives in .env.local (gitignored) and is never committed.
 * If the key is missing, search shows a clear error rather than
 * silently failing.
 */
const YOUTUBE_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

export const config = {
  youtubeApiKey: YOUTUBE_KEY,
} as const;

export function hasYouTubeKey(): boolean {
  return Boolean(YOUTUBE_KEY) && YOUTUBE_KEY !== 'your_key_here';
}
