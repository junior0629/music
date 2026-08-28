/**
 * Audio service — platform-aware audio playback.
 *
 * Web: YouTube IFrame Player API. The official YouTube player is
 *   loaded as an iframe, controlled via postMessage. Handles
 *   streaming, seeking, volume, end-of-track events for free.
 *
 * Native: expo-audio (fallback for when IFrame isn't available).
 *   Will only be used in practice if the IFrame also can't be
 *   shown (background playback, etc. — Phase 4 territory).
 *
 * Both implementations expose the same AudioService interface, so
 * the player store doesn't care which runtime it's on.
 */
import { Platform } from 'react-native';
import { Track, StreamInfo } from '@/types/player';
import { logger } from '@/utils/logger';
import { isWeb } from '@/theme';

export interface AudioService {
  load(track: Track, stream: StreamInfo): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  unload(): Promise<void>;
  seek(positionSec: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  onPosition(listener: (positionSec: number) => void): () => void;
  onEnded(listener: () => void): () => void;
  onError(listener: (message: string) => void): () => void;
  onBuffering(listener: (isBuffering: boolean) => void): () => void;
}

// ============================================================
// Web implementation: YouTube IFrame Player API
// ============================================================

/**
 * Minimal shape of the YT.Player we use. We type as `any` to
 * avoid pulling in the full @types/youtube (which is huge and
 * not necessary for the surface we use).
 */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId?: string;
          playerVars?: Record<string, number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
            onError?: (e: { data: number; target: YTPlayer }) => void;
            onPlaybackQualityChange?: (e: { data: string }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_API_SRC = 'https://www.youtube.com/iframe_api';
let _apiReady: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (_apiReady) return _apiReady;
  _apiReady = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('YouTube IFrame API requires window'));
      return;
    }
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${YT_API_SRC}"]`);
    if (existing) {
      // API script tag exists but hasn't called onYouTubeIframeAPIReady yet
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      return;
    }
    const script = document.createElement('script');
    script.src = YT_API_SRC;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    document.head.appendChild(script);
  });
  return _apiReady;
}

class YouTubeIFrameAudioService implements AudioService {
  private player: YTPlayer | null = null;
  private container: HTMLDivElement | null = null;
  private currentTrack: Track | null = null;
  private currentStream: StreamInfo | null = null;
  private positionListeners = new Set<(p: number) => void>();
  private endedListeners = new Set<() => void>();
  private errorListeners = new Set<(m: string) => void>();
  private bufferingListeners = new Set<(b: boolean) => void>();
  private positionPollHandle: ReturnType<typeof setInterval> | null = null;
  private lastKnownState = -1;
  private destroyed = false;

  async load(track: Track, stream: StreamInfo): Promise<void> {
    this.currentTrack = track;
    this.currentStream = stream;
    // Stop any prior polling before tearing down the old player
    this.stopPositionPolling();
    // Mark the old player as torn down so any in-flight state events are ignored
    this.destroyed = true;
    await loadYouTubeAPI();
    if (!window.YT?.Player) throw new Error('YouTube IFrame API not available');

    // Extract videoId from the stream URL
    const videoId = extractYouTubeId(stream.url);
    if (!videoId) throw new Error(`Invalid YouTube URL: ${stream.url}`);

    // Tear down any existing player
    if (this.player) {
      try { this.player.destroy(); } catch {}
      this.player = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    // Reset destroyed flag for the new player
    this.destroyed = false;

    // Create container — sized 0×0 but visible so playback works
    // (offscreen iframes may not play in some browsers)
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.right = '0';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.id = `yt-player-${Math.random().toString(36).slice(2, 8)}`;
    document.body.appendChild(container);
    this.container = container;

    return new Promise<void>((resolve, reject) => {
      try {
        this.player = new window.YT!.Player(container, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: (e) => {
              if (this.destroyed) return;
              try {
                e.target.setVolume(80);
              } catch {}
              logger.info('YT player ready', { videoId, title: track.title });
              resolve();
            },
            onStateChange: (e) => this.handleStateChange(e.data),
            onError: (e) => {
              if (this.destroyed) return;
              const msg = ytErrorMessage(e.data);
              logger.error('YT player error', { code: e.data, msg });
              this.errorListeners.forEach((l) => l(msg));
            },
          },
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async play(): Promise<void> {
    if (!this.player) {
      logger.warn('YT play: no player loaded');
      return;
    }
    try {
      this.player.playVideo();
    } catch (err) {
      logger.error('YT play failed', { err: String(err) });
    }
  }

  async pause(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pauseVideo();
    } catch {}
  }

  async unload(): Promise<void> {
    this.stopPositionPolling();
    this.destroyed = true;
    if (this.player) {
      try { this.player.destroy(); } catch {}
      this.player = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.currentTrack = null;
    this.currentStream = null;
  }

  async seek(positionSec: number): Promise<void> {
    if (!this.player) return;
    try {
      this.player.seekTo(Math.max(0, positionSec), true);
    } catch (err) {
      logger.warn('YT seek failed', { err: String(err) });
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.player) return;
    try {
      this.player.setVolume(Math.max(0, Math.min(100, volume * 100)));
    } catch {}
  }

  onPosition(listener: (positionSec: number) => void): () => void {
    this.positionListeners.add(listener);
    return () => this.positionListeners.delete(listener);
  }

  onEnded(listener: () => void): () => void {
    this.endedListeners.add(listener);
    return () => this.endedListeners.delete(listener);
  }

  onError(listener: (message: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  onBuffering(listener: (isBuffering: boolean) => void): () => void {
    this.bufferingListeners.add(listener);
    return () => this.bufferingListeners.delete(listener);
  }

  private handleStateChange(state: number): void {
    // Ignore state events after the player has been torn down
    if (this.destroyed) return;
    this.lastKnownState = state;
    // PlayerState constants (we don't import the YT type)
    const ENDED = 0;
    const PLAYING = 1;
    const PAUSED = 2;
    const BUFFERING = 3;
    const CUED = 5;

    if (state === BUFFERING) {
      this.bufferingListeners.forEach((l) => l(true));
    } else {
      // Anything else means we have data
      this.bufferingListeners.forEach((l) => l(false));
    }

    if (state === PLAYING) {
      this.startPositionPolling();
    } else {
      this.stopPositionPolling();
    }

    if (state === ENDED) {
      this.endedListeners.forEach((l) => l());
    }
  }

  private startPositionPolling(): void {
    this.stopPositionPolling();
    this.positionPollHandle = setInterval(() => {
      if (this.player) {
        try {
          const t = this.player.getCurrentTime();
          this.positionListeners.forEach((l) => l(t));
        } catch {}
      }
    }, 250);
  }

  private stopPositionPolling(): void {
    if (this.positionPollHandle) {
      clearInterval(this.positionPollHandle);
      this.positionPollHandle = null;
    }
  }
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // watch?v=ID, youtu.be/ID, /embed/ID
  const m1 = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (m2) return m2[1];
  const m3 = url.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
  if (m3) return m3[1];
  return null;
}

function ytErrorMessage(code: number): string {
  // https://developers.google.com/youtube/iframe_api_reference#onError
  switch (code) {
    case 2: return 'Invalid video ID';
    case 5: return 'HTML5 player error';
    case 100: return 'Video not found or private';
    case 101:
    case 150: return 'Video cannot be played in embedded players (owner restriction)';
    default: return `YouTube player error (code ${code})`;
  }
}

// ============================================================
// Native implementation: expo-audio
// ============================================================

async function createNativeAudioService(): Promise<AudioService> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoAudio = require('expo-audio') as typeof import('expo-audio');
  return new NativeAudioService(expoAudio.createAudioPlayer);
}

class NativeAudioService implements AudioService {
  private player: any | null = null;
  private currentTrack: Track | null = null;
  private currentStream: StreamInfo | null = null;
  private positionListeners = new Set<(p: number) => void>();
  private endedListeners = new Set<() => void>();
  private errorListeners = new Set<(m: string) => void>();
  private bufferingListeners = new Set<(b: boolean) => void>();
  private positionPollHandle: ReturnType<typeof setInterval> | null = null;
  private createPlayer: any;

  constructor(createPlayer: any) {
    this.createPlayer = createPlayer;
  }

  async load(track: Track, stream: StreamInfo): Promise<void> {
    this.currentTrack = track;
    this.currentStream = stream;
    if (this.player) {
      try { this.player.pause(); } catch {}
    }
    this.player = this.createPlayer({ uri: stream.url });
    this.wirePlayerEvents(this.player);
    logger.info('audio.loaded (native)', { title: track.title });
  }

  async play(): Promise<void> {
    if (!this.player) return;
    this.player.play();
    this.startPositionPolling();
  }

  async pause(): Promise<void> {
    if (!this.player) return;
    this.player.pause();
    this.stopPositionPolling();
  }

  async unload(): Promise<void> {
    if (this.player) {
      try { this.player.pause(); } catch {}
      try { this.player.release(); } catch {}
      this.player = null;
    }
    this.stopPositionPolling();
    this.currentTrack = null;
    this.currentStream = null;
  }

  async seek(positionSec: number): Promise<void> {
    if (!this.player) return;
    try {
      this.player.seekTo(Math.max(0, positionSec));
    } catch (err) {
      logger.warn('audio.seek failed', { err: String(err) });
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.player) return;
    try {
      this.player.volume = Math.max(0, Math.min(1, volume));
    } catch {}
  }

  onPosition(listener: (positionSec: number) => void): () => void {
    this.positionListeners.add(listener);
    return () => this.positionListeners.delete(listener);
  }

  onEnded(listener: () => void): () => void {
    this.endedListeners.add(listener);
    return () => this.endedListeners.delete(listener);
  }

  onError(listener: (message: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  onBuffering(listener: (isBuffering: boolean) => void): () => void {
    this.bufferingListeners.add(listener);
    return () => this.bufferingListeners.delete(listener);
  }

  private wirePlayerEvents(p: any): void {
    if (typeof p.addListener === 'function') {
      try {
        p.addListener('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish) {
            this.stopPositionPolling();
            this.endedListeners.forEach((l) => l());
          }
          if (status?.isLoaded === false && status?.error) {
            this.errorListeners.forEach((l) => l(String(status.error)));
          }
        });
      } catch {}
    }
  }

  private startPositionPolling(): void {
    this.stopPositionPolling();
    this.positionPollHandle = setInterval(() => {
      if (this.player?.currentTime != null) {
        const t = typeof this.player.currentTime === 'function'
          ? this.player.currentTime()
          : this.player.currentTime;
        this.positionListeners.forEach((l) => l(t));
      }
    }, 250);
  }

  private stopPositionPolling(): void {
    if (this.positionPollHandle) {
      clearInterval(this.positionPollHandle);
      this.positionPollHandle = null;
    }
  }
}

// ============================================================
// Module-level singleton
// ============================================================

class NoopAudioService implements AudioService {
  async load(): Promise<void> { logger.debug('audio.load (noop)'); }
  async play(): Promise<void> { logger.debug('audio.play (noop)'); }
  async pause(): Promise<void> {}
  async unload(): Promise<void> {}
  async seek(): Promise<void> {}
  async setVolume(): Promise<void> {}
  onPosition(): () => void { return () => undefined; }
  onEnded(): () => void { return () => undefined; }
  onError(): () => void { return () => undefined; }
  onBuffering(): () => void { return () => undefined; }
}

let _instance: AudioService | null = null;
let _initPromise: Promise<AudioService> | null = null;

export function getAudio(): AudioService {
  if (_instance) return _instance;
  if (!_initPromise) {
    _initPromise = (async () => {
      if (isWeb) {
        _instance = new YouTubeIFrameAudioService();
      } else {
        try {
          _instance = await createNativeAudioService();
        } catch (err) {
          logger.error('Failed to init native audio, falling back to noop', { err: String(err) });
          _instance = new NoopAudioService();
        }
      }
      return _instance!;
    })();
    return new NoopAudioService();
  }
  return new NoopAudioService();
}

export const audio: AudioService = new Proxy({} as AudioService, {
  get(_target, prop) {
    return (getAudio() as any)[prop];
  },
});

// Re-export Platform for callers that need it
export { Platform };
