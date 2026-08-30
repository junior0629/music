/**
 * Library screen.
 *
 * Layout:
 *   - Header: "Your Library" + search & add icons
 *   - Horizontal tab strip: Playlists / Songs / Artists / Albums / Podcasts
 *   - Filter chips: Recently Added / Downloaded
 *   - Vertical list of SongRow items
 *   - "+ New playlist" tile at the bottom (Playlists tab only)
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { CategoryChip } from '@/components/CategoryChip';
import { SongRow } from '@/components/SongRow';
import { useLibraryStore } from '@/store/libraryStore';
import { logger } from '@/utils/logger';
import {
  LIBRARY_FILTERS,
  LIBRARY_TABS,
  LibraryFilter,
  LibraryTab,
  MOCK_DOWNLOADED,
  MOCK_LIBRARY_ROWS,
} from '@/data/mockData';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const addPlaylist = useLibraryStore((s) => s.addPlaylist);

  const [tab, setTab] = useState<LibraryTab>('Playlists');
  const [filter, setFilter] = useState<LibraryFilter>('Recently Added');

  useEffect(() => {
    logger.setContext('LibraryScreen');
    return () => logger.clearContext();
  }, []);

  const showDownloaded = filter === 'Downloaded';

  const rows = showDownloaded ? MOCK_DOWNLOADED : MOCK_LIBRARY_ROWS;
  const isEmpty = rows.length === 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[textStyle('display'), { color: colors.textPrimary, flex: 1 }]}>
          Your Library
        </Text>
        <Pressable
          hitSlop={8}
          accessibilityLabel="Search library"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
        >
          <Ionicons name="search" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          hitSlop={8}
          accessibilityLabel="Add to library"
          onPress={() => {
            const id = addPlaylist('New Playlist');
            logger.info('Created playlist', { id });
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6, marginLeft: 4 }]}
        >
          <View style={[styles.addIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={16} color={colors.textOnPrimary} />
          </View>
        </Pressable>
      </View>

      {/* Tabs (horizontally scrollable) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {LIBRARY_TABS.map((t) => {
          const active = t === tab;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t}
              hitSlop={6}
              style={({ pressed }) => [styles.tabBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text
                style={[
                  textStyle('heading'),
                  {
                    color: active ? colors.primary : colors.textSecondary,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {t}
              </Text>
              <View
                style={[
                  styles.tabUnderline,
                  {
                    backgroundColor: active ? colors.primary : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filters — only meaningful on the Playlists tab */}
      {tab === 'Playlists' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {LIBRARY_FILTERS.map((f) => (
            <CategoryChip
              key={f}
              label={f}
              active={f === filter}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      ) : null}

      {/* Body */}
      {tab === 'Playlists' ? (
        <>
          {isEmpty ? (
            <View style={styles.empty}>
              <Text style={[textStyle('body'), { color: colors.textMuted }]}>
                No items yet.
              </Text>
            </View>
          ) : (
            rows.map((r) => (
              <SongRow
                key={r.id}
                title={r.title}
                subtitle={r.subtitle}
                gradient={r.gradient}
                icon={r.icon}
                onPress={() => logger.info('Tapped library row', { id: r.id, title: r.title })}
              />
            ))
          )}

          {filter === 'Recently Added' ? (
            <Pressable
              onPress={() => {
                const id = addPlaylist('New Playlist');
                logger.info('Created playlist', { id });
              }}
              accessibilityLabel="Create playlist"
              style={({ pressed }) => [
                styles.newTile,
                {
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[textStyle('heading'), { color: colors.textPrimary }]}>
                +  New playlist
              </Text>
              <Text
                style={[textStyle('caption'), { color: colors.textMuted, marginTop: 2 }]}
              >
                Tap to create
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={[textStyle('body'), { color: colors.textMuted }]}>
            {tab} will appear here once you add some.
          </Text>
        </View>
      )}

      <View style={{ height: 200 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    paddingVertical: spacing.xs,
    gap: spacing.lg,
  },
  tabBtn: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  tabUnderline: {
    marginTop: spacing.xs,
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  filters: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  newTile: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
});
