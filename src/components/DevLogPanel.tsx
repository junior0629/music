/**
 * DevLogSection — an inline dev log viewer embedded in the Settings tab.
 *
 * Always shown — including in release APKs. The original __DEV__ gate
 * hid the diagnostic panel exactly when a user running the shipping
 * APK would need it most.
 *
 * Why a section, not a floating panel: a floating overlay gets in the
 * way of normal UI, fights for tap targets, and has to hardcode text
 * colors that look bad on light themes. An inline section in Settings
 * uses the active palette naturally and gets all the screen real estate
 * it needs.
 *
 * Reads from the same logger ring buffer as everything else.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors, useShadows, textStyle, spacing, radii } from '@/theme';
import { logger, LogEntry, LogLevel } from '@/utils/logger';
import { copyToClipboard, formatLogEntries } from '@/utils/clipboard';

type LevelFilter = 'all' | LogLevel;

/**
 * Level color tokens. The dot, message, and source text all use these.
 * The error/danger color is pulled from the active palette so it
 * stays consistent with the rest of the UI in both dark and light modes.
 */
function useLevelColors() {
  const colors = useColors();
  return useMemo<Record<LogLevel, string>>(
    () => ({
      debug: colors.textMuted,
      info: colors.textSecondary,
      warn: colors.primary,
      error: colors.danger,
    }),
    [colors],
  );
}

const LEVEL_DOT: Record<LogLevel, string> = {
  debug: '·',
  info: 'i',
  warn: '!',
  error: '✕',
};

export function DevLogSection(): React.ReactElement | null {
  const colors = useColors();
  const shadows = useShadows();
  const levelColors = useLevelColors();
  const [entries, setEntries] = useState<LogEntry[]>(() => logger.getEntries());
  const [filter, setFilter] = useState<LevelFilter>('all');

  useEffect(() => {
    return logger.subscribe((next) => setEntries(next));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.level === filter);
  }, [entries, filter]);

  // Note: the dev log is shown in both debug and release APKs. The
  // gate used to be `__DEV__` (which is false in release builds), but
  // that hid the diagnostic panel exactly when a user running the
  // shipping APK would need it. Now it always renders.

  const errorCount = entries.filter((e) => e.level === 'error').length;
  const warnCount = entries.filter((e) => e.level === 'warn').length;

  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  // Hold the "copied" reset timer in a ref so we can clear it on
  // unmount. Without this, a tap-then-navigate-away fires the
  // setState on an unmounted component (React warning) and leaks
  // a timer.
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const scheduleCopyReset = (): void => {
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    copyResetTimerRef.current = setTimeout(() => {
      setCopyState('idle');
      copyResetTimerRef.current = null;
    }, 1500);
  };

  const handleCopyAll = async () => {
    const dump = formatLogEntries(filtered);
    const ok = await copyToClipboard(dump);
    if (ok) {
      setCopyState('copied');
      logger.info(`Copied ${filtered.length} log entries to clipboard`, { source: 'devlog' });
      scheduleCopyReset();
    }
  };

  const handleCopyLastError = async () => {
    const lastError = [...entries].reverse().find((e) => e.level === 'error');
    if (!lastError) return;
    const dump = formatLogEntries([lastError]);
    const ok = await copyToClipboard(dump);
    if (ok) {
      setCopyState('copied');
      logger.info('Copied last error to clipboard', { source: 'devlog' });
      scheduleCopyReset();
    }
  };

  return (
    <View>
      <Text
        style={[
          textStyle('label'),
          { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm },
        ]}
      >
        DEVELOPER
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[textStyle('heading'), { color: colors.textPrimary }]}>
              Dev log
            </Text>
            <Text style={[textStyle('caption'), { color: colors.textMuted, marginTop: 2 }]}>
              {entries.length} entries
              {errorCount > 0 ? ` · ${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}
              {warnCount > 0 ? ` · ${warnCount} warning${warnCount === 1 ? '' : 's'}` : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <HeaderAction
              label={copyState === 'copied' ? 'COPIED' : 'COPY'}
              onPress={handleCopyAll}
              disabled={filtered.length === 0}
              accent={colors.primary}
              muted={colors.textMuted}
            />
            <HeaderAction
              label="LAST ERR"
              onPress={handleCopyLastError}
              disabled={errorCount === 0}
              accent={colors.danger}
              muted={colors.textMuted}
            />
            <Pressable
              onPress={() => logger.clearContext()}
              hitSlop={8}
              accessibilityLabel="Clear log context"
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
            >
              <Text style={[textStyle('label'), { color: colors.primary }]}>CLEAR</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.filters}>
          {(['all', 'error', 'warn', 'info', 'debug'] as LevelFilter[]).map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.lavenderSoft : colors.surfaceMuted,
                    borderColor: active ? colors.borderStrong : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel={`Filter by ${f}`}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    textStyle('label'),
                    { color: active ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {f.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        >
          {filtered.length === 0 ? (
            <Text style={[textStyle('caption'), { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg }]}>
              No log entries yet
            </Text>
          ) : (
            filtered
              .slice()
              .reverse()
              .map((e) => <LogRow key={e.id} entry={e} levelColors={levelColors} />)
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function LogRow({
  entry,
  levelColors,
}: {
  entry: LogEntry;
  levelColors: Record<LogLevel, string>;
}) {
  const colors = useColors();
  const ts = new Date(entry.ts).toISOString().split('T')[1]?.slice(0, 12) ?? '';
  const c = levelColors[entry.level];
  // Compact the context into a single string so the inline view stays
  // scannable. Skip noisy keys (we already show the error message below).
  const ctxStr = entry.context && Object.keys(entry.context).length > 0
    ? Object.entries(entry.context)
        .filter(([k]) => k !== 'err' && k !== 'error')
        .map(([k, v]) => {
          if (v === null || v === undefined) return `${k}=`;
          if (typeof v === 'string') return `${k}=${v}`;
          if (typeof v === 'number' || typeof v === 'boolean') return `${k}=${v}`;
          return `${k}=${JSON.stringify(v)}`;
        })
        .join(' · ')
    : null;
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowTime, { color: colors.textMuted }]}>{ts}</Text>
      <Text style={[styles.rowLevel, { color: c }]}>{LEVEL_DOT[entry.level]}</Text>
      <View style={{ flex: 1 }}>
        {entry.source ? (
          <Text style={[styles.rowSource, { color: colors.textMuted }]}>
            {entry.source}
          </Text>
        ) : null}
        <Text style={[styles.rowMsg, { color: colors.textPrimary }]}>{entry.message}</Text>
        {ctxStr ? (
          <Text style={[styles.rowCtx, { color: colors.textMuted }]}>{ctxStr}</Text>
        ) : null}
        {entry.error?.message ? (
          <Text style={[styles.rowErr, { color: colors.danger }]}>
            {entry.error.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function HeaderAction({
  label,
  onPress,
  disabled,
  accent,
  muted,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent: string;
  muted: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.headerAction,
        {
          opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[textStyle('label'), { color: disabled ? muted : accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerAction: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  filters: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  scroll: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 8,
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTime: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  rowLevel: {
    width: 12,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
  rowSource: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowMsg: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  rowCtx: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  rowErr: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
