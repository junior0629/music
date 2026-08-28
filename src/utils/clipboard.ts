/**
 * Clipboard helper — cross-platform copy to system clipboard.
 *
 * Uses `expo-clipboard` on both web and native. Falls back to a
 * no-op + log warning if anything goes wrong, so callers don't
 * have to handle the error case themselves.
 */
import * as Clipboard from 'expo-clipboard';
import { logger } from './logger';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (err) {
    logger.warn('copyToClipboard failed', { source: 'clipboard' }, err as Error);
    return false;
  }
}

/**
 * Format log entries as a plain-text dump suitable for pasting
 * into a chat, bug report, or GitHub issue.
 */
export function formatLogEntries(
  entries: ReadonlyArray<{
    ts: number;
    level: string;
    source?: string;
    message: string;
    error?: { message?: string; stack?: string };
  }>,
): string {
  const lines: string[] = [
    `# Dev log · ${entries.length} entries · ${new Date().toISOString()}`,
    '',
  ];
  for (const e of entries) {
    const t = new Date(e.ts).toISOString();
    const head = `[${t}] ${e.level.toUpperCase().padEnd(5)} ${e.source ?? 'app'}`;
    lines.push(head);
    lines.push(`  ${e.message}`);
    if (e.error?.message) {
      lines.push(`  Error: ${e.error.message}`);
    }
    if (e.error?.stack) {
      lines.push(e.error.stack.split('\n').map((l) => '    ' + l).join('\n'));
    }
    lines.push('');
  }
  return lines.join('\n');
}
