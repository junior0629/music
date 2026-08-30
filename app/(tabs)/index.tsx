/**
 * Home screen — the new minimalist lavender layout.
 *
 * Layout (top to bottom):
 *   - Header: greeting + name, avatar left, history/settings right
 *   - Horizontal scrollable category chips
 *   - "Jump Back In" horizontal rail of recent items
 *   - "Made For Alex" horizontal rail of large playlist cards
 *   - Mini player overlays the bottom (rendered by the tabs layout)
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { CategoryChip } from '@/components/CategoryChip';
import { SectionHeader } from '@/components/SectionHeader';
import { RecentlyPlayedCard } from '@/components/RecentlyPlayedCard';
import { PlaylistCard } from '@/components/PlaylistCard';
import {
  HOME_CATEGORIES,
  HomeCategory,
  MOCK_DAILY_MIXES,
  MOCK_RECENT,
  MOCK_USER,
} from '@/data/mockData';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerMetaStore } from '@/store/playerStore';
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';

const SVG_GRADIENT =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="%237C3AED"/><stop offset="0.5" stop-color="%23EC4899"/><stop offset="1" stop-color="%233B82F6"/></linearGradient></defs><rect width="80" height="80" rx="14" fill="url(%23g)"/></svg>',
  );

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const loadTrack = usePlayerMetaStore((s) => s.loadTrack);

  const [category, setCategory] = useState<HomeCategory>('All');

  useEffect(() => {
    logger.setContext('HomeScreen');
    logger.debug('HomeScreen mounted');
    return () => logger.clearContext();
  }, []);

  // Build a Track stub from a mock for the player. We don't have real
  // streams for the mock data, so we pass a tiny track that the
  // existing player code accepts (it'll show in the now-playing UI
  // and the mini player; playback itself requires real data).
  const playMock = (id: string, title: string, artist: string) => {
    const track: Track = {
      id,
      title,
      artist,
      durationSec: 200,
      thumbnail: SVG_GRADIENT,
      sourceProvider: 'mock',
    };
    void loadTrack(track, [track]);
    router.push(`/player/${id}`);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  // Map real store items to a stable shape. If empty, fall back to mocks.
  const recentItems = recentlyPlayed.length > 0
    ? recentlyPlayed.slice(0, 6).map((t, i) => ({
        id: t.id,
        title: t.title,
        subtitle: t.artist,
        gradient: MOCK_RECENT[i % MOCK_RECENT.length]!.gradient,
        icon: MOCK_RECENT[i % MOCK_RECENT.length]!.icon,
      }))
    : MOCK_RECENT;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — greeting + name, avatar, history & settings */}
      <View style={styles.header}>
        <Avatar size={44} initials={MOCK_USER.initials} />
        <View style={styles.headerText}>
          <Text
            style={[
              textStyle('micro'),
              { color: colors.textSecondary, textTransform: 'uppercase' },
            ]}
          >
            {greeting}
          </Text>
          <Text style={[textStyle('title'), { color: colors.textPrimary }]}>
            {MOCK_USER.name}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            hitSlop={8}
            accessibilityLabel="History"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
          >
            <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            hitSlop={8}
            accessibilityLabel="Settings"
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Category chips — horizontally scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {HOME_CATEGORIES.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            active={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>

      {/* Jump Back In */}
      <SectionHeader title="Jump Back In" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {recentItems.map((r) => (
          <RecentlyPlayedCard
            key={r.id}
            title={r.title}
            subtitle={r.subtitle}
            gradient={r.gradient}
            icon={r.icon}
            onPress={() => playMock(r.id, r.title, r.subtitle)}
          />
        ))}
      </ScrollView>

      {/* Made For Alex */}
      <SectionHeader
        title="Made For Alex"
        action={{ label: 'See All', onPress: () => router.push('/(tabs)/discover') }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {MOCK_DAILY_MIXES.map((m) => (
          <PlaylistCard
            key={m.id}
            title={m.title}
            subtitle={m.subtitle}
            gradient={m.gradient}
            icon="musical-note"
            progress={m.progress}
            onPress={() => playMock(m.id, m.title, m.subtitle)}
          />
        ))}
      </ScrollView>

      {/* Bottom spacer so the mini player + nav don't cover content */}
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
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chips: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  rail: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
});
