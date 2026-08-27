/**
 * Logger module.
 *
 * A small wrapper around `console` with:
 *  - 4 levels: debug, info, warn, error
 *  - per-call context (screen, feature, anything)
 *  - dev/prod gating: prod only shows warn+error
 *  - in-memory ring buffer that DevLogPanel reads from
 *  - color-coded output in browser (CSS) and React Native (chalk-style prefixes)
 *  - measure() helper for timing async operations
 *  - a tiny subscriber API so panels can re-render when new logs arrive
 *
 * The wrapper exists so:
 *  1. We never silently lose an error
 *  2. We can globally filter or forward logs later (Sentry, etc.) without
 *     touching every callsite
 *  3. We have a single place to add the dev-mode banner
 */

import { APP_VERSION, APP_PHASE, APP_NAME } from '@/constants/app';
import { isWeb } from '@/theme';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  ts: number;            // ms since epoch
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  /** Where this log came from — usually set by setContext() */
  source?: string;
}

const isDev =
  typeof __DEV__ !== 'undefined'
    ? __DEV__
    : process.env.NODE_ENV !== 'production';

const RING_SIZE = 200;

class Logger {
  private ring: LogEntry[] = [];
  private nextId = 1;
  private source: string | undefined;
  private listeners = new Set<(entries: LogEntry[]) => void>();
  private inDev = isDev;

  /** Active in-memory ring buffer. Read by DevLogPanel. */
  getEntries(): LogEntry[] {
    return [...this.ring];
  }

  /** Subscribe to new logs. Returns an unsubscribe fn. */
  subscribe(listener: (entries: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Set a contextual source (e.g., 'SearchScreen', 'PipedProvider'). */
  setContext(source: string): void {
    this.source = source;
  }

  /** Clear contextual source. */
  clearContext(): void {
    this.source = undefined;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    this.push('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    this.push('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog('warn')) return;
    this.push('warn', message, context, error);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog('error')) return;
    this.push('error', message, context, error);
  }

  /**
   * Time an async operation. Logs the duration on success or failure.
   * Usage:
   *   const result = await logger.measure('search', () => provider.search(q));
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const start = Date.now();
    this.debug(`${label}: start`, context);
    try {
      const result = await fn();
      const ms = Date.now() - start;
      this.debug(`${label}: ok (${ms}ms)`, { ...context, ms });
      return result;
    } catch (err) {
      const ms = Date.now() - start;
      this.error(
        `${label}: failed (${ms}ms)`,
        { ...context, ms },
        err instanceof Error ? err : new Error(String(err)),
      );
      throw err;
    }
  }

  /**
   * Print a startup banner. Called once from the root layout.
   */
  banner(extra?: Record<string, unknown>): void {
    this.info(`▷ ${APP_NAME} v${APP_VERSION} · ${APP_PHASE}`, {
      platform: isWeb ? 'web' : 'native',
      dev: this.inDev,
      ...extra,
    });
  }

  // -- internals --

  private shouldLog(level: LogLevel): boolean {
    if (this.inDev) return true;
    return level === 'warn' || level === 'error';
  }

  private push(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    const entry: LogEntry = {
      id: this.nextId++,
      ts: Date.now(),
      level,
      message,
      context,
      error,
      source: this.source,
    };
    this.ring.push(entry);
    if (this.ring.length > RING_SIZE) {
      this.ring.splice(0, this.ring.length - RING_SIZE);
    }
    this.writeToConsole(entry);
    this.listeners.forEach((l) => l(this.getEntries()));
  }

  private writeToConsole(entry: LogEntry): void {
    const ts = new Date(entry.ts).toISOString().split('T')[1]?.slice(0, 8) ?? '';
    const src = entry.source ? `[${entry.source}]` : '';
    const tag = `${ts} ${src} ${entry.message}`;
    const ctx = entry.context && Object.keys(entry.context).length > 0 ? entry.context : undefined;

    switch (entry.level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(tag, ctx ?? '');
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(tag, ctx ?? '');
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(tag, ctx ?? '');
        if (entry.error) console.warn(entry.error);
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(tag, ctx ?? '');
        if (entry.error) console.error(entry.error);
        break;
    }
  }
}

export const logger = new Logger();
