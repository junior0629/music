/**
 * Wraps an async function so that any thrown error is logged with a
 * stable label and rethrown. Prevents the "swallowed promise rejection"
 * class of bugs.
 *
 * Usage:
 *   export const safeSearch = withErrorLogging('PipedProvider.search', search);
 *   const r = await safeSearch('taylor swift');
 *
 * Or to wrap inline:
 *   const data = await withErrorLogging('loadPlaylist', () => db.getPlaylist(id))();
 */
import { logger } from './logger';

export function withErrorLogging<TArgs extends unknown[], TResult>(
  label: string,
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (err) {
      logger.error(
        `${label} failed`,
        { label, args: safeArgs(args) },
        err instanceof Error ? err : new Error(String(err)),
      );
      throw err;
    }
  };
}

function safeArgs(args: unknown[]): unknown {
  try {
    // Don't try to serialize potentially huge objects into the log
    return args.map((a) => {
      if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') {
        return a;
      }
      if (a === null || a === undefined) return a;
      return '[object]';
    });
  } catch {
    return '[unserializable]';
  }
}
