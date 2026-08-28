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

/** PlayerState constants (we don't import the YT type). */
const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;
const STATE_BUFFERING = 3;
const STATE_CUED = 5;

/**
 * If the player sits in BUFFERING for longer than this, the video
 * is almost certainly region-blocked, age-restricted, or has
 * embedding disabled. We surface a clear error instead of letting
 * the UI show a perpetual spinner.
 */
const BUFFERING_WATCHDOG_MS = 8_000;

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
  private bufferingWatchdog: ReturnType<typeof setTimeout> | null = null;
  private lastKnownState = -1;
  private destroyed = false;
  // True once the user has interacted with the player at least once.
  // After that, subsequent loads auto-play (the iframe is "trusted"
  // by the browser). Before that, the play button on the NowPlaying
  // screen provides the user gesture that unlocks playback.
  private hasPlayedOnce = false;
  // True while a track is loading and the IFrame has not yet fired
  // onReady. play() polls this and queues the play call to fire
  // immediately after onReady, so a user tap on play during load
  // doesn't get silently dropped.
  private loading = false;

  async load(track: Track, stream: StreamInfo): Promise<void> {
    this.currentTrack = track;
    this.currentStream = stream;
    this.loading = true;
    this.stopPositionPolling();
    this.clearBufferingWatchdog();
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
    this.destroyed = false;

    // Create container. The trick: Chrome's autoplay policy treats
    // iframes with very low opacity or 0×0 size as not visible, and
    // refuses to play audio. We give it a real size and full
    // opacity, then push it off-screen via translateY so the user
    // can't see it but the browser still considers it visible.
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.right = '0';
    container.style.width = '480px';
    container.style.height = '270px';
    container.style.opacity = '1';
    container.style.pointerEvents = 'none';
    container.style.transform = 'translateY(120%)';
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
              this.loading = false;
              // If the user has interacted before, kick off playback
              // automatically. (First-load auto-play is blocked by
              // Chrome's autoplay policy; the play button on the
              // NowPlaying screen provides the gesture for that.)
              if (this.hasPlayedOnce) {
                try {
                  e.target.playVideo();
                } catch {}
              }
              resolve();
            },
            onStateChange: (e) => this.handleStateChange(e.data),
            onError: (e) => {
              if (this.destroyed) return;
              const msg = ytErrorMessage(e.data);
              this.errorListeners.forEach((l) => l(msg));
            },
          },
        });
      } catch (err) {
        this.loading = false;
        reject(err);
      }
    });
  }

  async play(): Promise<void> {
    if (!this.player) return;

    const doPlay = () => {
      try {
        this.player!.playVideo();
        this.hasPlayedOnce = true;
      } catch (err) {
        logger.warn('YT play failed', { err: String(err) });
      }
    };

    // If the iframe isn't ready yet, wait for it. playVideo() called
    // before onReady is silently dropped by the YT IFrame API.
    if (this.loading) {
      const waitForReady = () => {
        if (this.destroyed) return;
        if (!this.loading) {
          doPlay();
        } else {
          setTimeout(waitForReady, 50);
        }
      };
      waitForReady();
      return;
    }
    doPlay();
  }

  async pause(): Promise<void> {
    if (!this.player) return;
    try { this.player.pauseVideo(); } catch {}
  }

  async unload(): Promise<void> {
    this.stopPositionPolling();
    this.clearBufferingWatchdog();
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
    } catch {}
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
    if (this.destroyed) return;
    this.lastKnownState = state;

    if (state === STATE_BUFFERING) {
      this.bufferingListeners.forEach((l) => l(true));
      this.armBufferingWatchdog();
    } else {
      this.bufferingListeners.forEach((l) => l(false));
      this.clearBufferingWatchdog();
    }

    if (state === STATE_PLAYING) {
      this.startPositionPolling();
    } else {
      this.stopPositionPolling();
    }

    if (state === STATE_ENDED) {
      this.endedListeners.forEach((l) => l());
    }
  }

  private armBufferingWatchdog(): void {
    this.clearBufferingWatchdog();
    this.bufferingWatchdog = setTimeout(() => {
      if (
        !this.destroyed &&
        this.player &&
        this.lastKnownState === STATE_BUFFERING
      ) {
        this.errorListeners.forEach((l) =>
          l('Video stuck buffering (region/age/embed block?)'),
        );
      }
    }, BUFFERING_WATCHDOG_MS);
  }

  private clearBufferingWatchdog(): void {
    if (this.bufferingWatchdog) {
      clearTimeout(this.bufferingWatchdog);
      this.bufferingWatchdog = null;
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
  async load(): Promise<void> {}
  async play(): Promise<void> {}
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
