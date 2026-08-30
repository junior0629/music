/**
 * Wraps an async function so that any thrown error is logged with a
 * stable label and rethrown. Prevents the "swallowed promise rejection"
 * class of bugs.
 *
 * AbortError is treated as expected control flow (not a real error):
 *   - the request was cancelled by an AbortController
 *   - logging it as ERROR floods the dev log on every cancelled
 *     debounce/retry
 *   - callers still see the throw so they can ignore it
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
      // AbortError is the expected outcome of an AbortController.abort().
      // Don't log it as an error — it's how we cancel in-flight requests
      // on user input (search debounce, lyrics retry, etc.).
      if (isAbortError(err)) {
        logger.debug(`${label} aborted`, { label, args: safeArgs(args) });
        throw err;
      }
      logger.error(
        `${label} failed`,
        { label, args: safeArgs(args) },
        err instanceof Error ? err : new Error(String(err)),
      );
      throw err;
    }
  };
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: unknown; code?: unknown; message?: unknown };
  return (
    e.name === 'AbortError' ||
    e.code === 'ABORT_ERR' ||
    e.code === 20 || // DOMException.ABORT_ERR
    (typeof e.message === 'string' && /aborted/i.test(e.message) && (e.name === 'Error' || e.name === undefined))
  );
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
