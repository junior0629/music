/**
 * Install process-level unhandled error handlers.
 * On React Native: hooks ErrorUtils.setGlobalHandler.
 * On web: hooks window.onerror + unhandledrejection.
 *
 * Called once from the root layout. Idempotent.
 */
import { logger } from './logger';
import { isWeb } from '@/theme';

let installed = false;

export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  if (isWeb) {
    // Web
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const previousOnError = w.onerror;
      w.onerror = (message: string, source?: string, lineno?: number, colno?: number, error?: Error) => {
        logger.error(
          'Unhandled error',
          { source, lineno, colno, message: String(message) },
          error ?? new Error(String(message)),
        );
        if (previousOnError) {
          return previousOnError(message, source, lineno, colno, error);
        }
        return false;
      };

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const err = reason instanceof Error ? reason : new Error(String(reason));
        logger.error('Unhandled promise rejection', { reason: String(reason) }, err);
      });
    }
    return;
  }

  // React Native
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ErrorUtils } = require('react-native') as {
      ErrorUtils?: {
        getGlobalHandler?: () => (e: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (h: (e: Error, isFatal?: boolean) => void) => void;
      };
    };
    if (ErrorUtils?.setGlobalHandler) {
      const previous = ErrorUtils.getGlobalHandler?.();
      ErrorUtils.setGlobalHandler((err, isFatal) => {
        logger.error('Unhandled error (fatal=' + Boolean(isFatal) + ')', { fatal: isFatal }, err);
        if (previous) previous(err, isFatal);
      });
    }
  } catch (e) {
    // ErrorUtils not available — fine, ErrorBoundary still catches render errors.
  }
}
