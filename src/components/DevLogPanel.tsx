/**
 * DevLogSection — an inline dev log viewer embedded in the Settings tab.
 *
 * Dev-only (gated on __DEV__). In production builds this component
 * returns null and contributes no layout.
 *
 * Why a section, not a floating panel: a floating overlay gets in the
 * way of normal UI, fights for tap targets, and has to hardcode text
 * colors that look bad on light themes. An inline section in Settings
 * uses the active palette naturally and gets all the screen real estate
 * it needs.
 *
 * Reads from the same logger ring buffer as everything else.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { logger, LogEntry, LogLevel } from '@/utils/logger';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

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
      warn: colors.accent,
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
  const levelColors = useLevelColors();
  const [entries, setEntries] = useState<LogEntry[]>(() => logger.getEntries());
  const [filter, setFilter] = useState<LevelFilter>('all');

  useEffect(() => {
    if (!isDev) return;
    return logger.subscribe((next) => setEntries(next));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.level === filter);
  }, [entries, filter]);

  if (!isDev) return null;

  const errorCount = entries.filter((e) => e.level === 'error').length;
  const warnCount = entries.filter((e) => e.level === 'warn').length;

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
      <GlassCard padding={0} radius="lg">
        <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
          <View>
            <Text style={[textStyle('heading'), { color: colors.textPrimary }]}>
              Dev log
            </Text>
            <Text style={[textStyle('caption'), { color: colors.textMuted, marginTop: 2 }]}>
              {entries.length} entries
              {errorCount > 0 ? ` · ${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}
              {warnCount > 0 ? ` · ${warnCount} warning${warnCount === 1 ? '' : 's'}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => logger.clearContext()}
            hitSlop={8}
            accessibilityLabel="Clear log context"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
          >
            <Text style={[textStyle('label'), { color: colors.accent }]}>CLEAR</Text>
          </Pressable>
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
                    backgroundColor: active ? colors.accentSoft : colors.glassSurfaceSubtle,
                    borderColor: active ? colors.glassBorderStrong : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel={`Filter by ${f}`}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    textStyle('label'),
                    { color: active ? colors.accent : colors.textSecondary },
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
      </GlassCard>
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
  return (
    <View style={[styles.row, { borderBottomColor: colors.glassBorder }]}>
      <Text style={[styles.rowTime, { color: colors.textMuted }]}>{ts}</Text>
      <Text style={[styles.rowLevel, { color: c }]}>{LEVEL_DOT[entry.level]}</Text>
      <View style={{ flex: 1 }}>
        {entry.source ? (
          <Text style={[styles.rowSource, { color: colors.textMuted }]}>
            {entry.source}
          </Text>
        ) : null}
        <Text style={[styles.rowMsg, { color: colors.textPrimary }]}>{entry.message}</Text>
        {entry.error?.message ? (
          <Text style={[styles.rowErr, { color: colors.danger }]}>
            {entry.error.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  rowErr: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
