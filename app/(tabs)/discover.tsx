/**
 * Discover screen.
 *
 * Layout:
 *   - Header: "Explore Music" caption, "Discover" title, bell icon
 *   - Search bar (functional — debounced, calls the YouTube provider)
 *   - "Browse by Genre" 2-column grid
 *   - "Mood Playlists" 2-column grid
 *   - Optional search results when the user types
 */
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { GenreCard } from '@/components/GenreCard';
import { MoodCard } from '@/components/MoodCard';
import { MOCK_GENRES, MOCK_MOODS } from '@/data/mockData';
import { usePlayerMetaStore } from '@/store/playerStore';
import { getProvider } from '@/services/music';
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';
import { withErrorLogging } from '@/utils/withErrorLogging';
import { useRouter } from 'expo-router';
import { selection } from '@/utils/haptics';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const loadTrack = usePlayerMetaStore((s) => s.loadTrack);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    logger.setContext('DiscoverScreen');
    return () => logger.clearContext();
  }, []);

  // Debounced search — same pattern as the old SearchScreen.
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setLoading(false);
      setSearchError(null);
      return;
    }
    const ac = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      setSearchError(null);
      runSearch(query, ac.signal).catch((err) => {
        if (!ac.signal.aborted) {
          setSearchError(formatSearchError(err));
        }
      });
    }, 350);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const runSearch = withErrorLogging(
    'DiscoverScreen.search',
    async (q: string, signal?: AbortSignal) => {
      try {
        const r = await getProvider().search(q, { signal });
        if (signal?.aborted) return;
        setResults(r.tracks);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
  );

  const play = async (track: Track) => {
    selection();
    try {
      await loadTrack(track, results);
    } catch (err) {
      const e = err as Error;
      logger.error(
        'DiscoverScreen.play failed',
        { id: track.id, title: track.title, err: e?.message ?? String(err) },
        e,
      );
    }
    router.push(`/player/${track.id}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[
                textStyle('micro'),
                { color: colors.textSecondary, textTransform: 'uppercase' },
              ]}
            >
              Explore Music
            </Text>
            <Text style={[textStyle('display'), { color: colors.textPrimary }]}>
              Discover
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.bell,
              { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Search */}
        <SearchBar value={query} onChangeText={setQuery} />

        {/* Search results, if any */}
        {query.trim().length > 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={[
                textStyle('caption'),
                { color: colors.textMuted, marginBottom: spacing.sm },
              ]}
            >
              {loading
                ? 'Searching…'
                : searchError
                ? 'Search failed'
                : results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length === 1 ? '' : 's'}`}
            </Text>
            {searchError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Ionicons name="cloud-offline-outline" size={20} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      textStyle('body'),
                      { color: colors.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {searchError}
                  </Text>
                  <Text
                    style={[
                      textStyle('caption'),
                      { color: colors.textSecondary, marginTop: 4 },
                    ]}
                  >
                    Check the dev log on the Profile tab for the full error.
                  </Text>
                </View>
              </View>
            ) : null}
            {results.map((t, idx) => (
              <Animated.View
                key={t.id}
                entering={FadeInDown.delay(idx * 40).duration(300)}
                layout={Layout.springify()}
              >
                <Pressable
                  onPress={() => play(t)}
                  accessibilityLabel={`Play ${t.title} by ${t.artist}`}
                  style={({ pressed }) => [
                    styles.resultRow,
                    { opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface },
                  ]}
                >
                  <Image
                    source={{ uri: t.thumbnail }}
                    style={[styles.thumb, { backgroundColor: colors.lavender }]}
                  />
                  <View style={styles.resultMeta}>
                    <Text
                      numberOfLines={1}
                      style={[textStyle('heading'), { color: colors.textPrimary }]}
                    >
                      {t.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        textStyle('caption'),
                        { color: colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {t.artist} · {formatDuration(t.durationSec)}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {/* Browse by Genre — 2 columns */}
        <SectionHeader title="Browse by Genre" />
        <View style={styles.gridTwo}>
          {MOCK_GENRES.map((g) => (
            <GenreCard
              key={g.id}
              name={g.name}
              gradient={g.gradient}
              icon={g.icon}
              onPress={() => logger.info('Tapped genre', { name: g.name })}
            />
          ))}
        </View>

        {/* Mood Playlists — 2 columns */}
        <SectionHeader
          title="Mood Playlists"
          action={{
            label: 'See All',
            onPress: () => logger.info('See all moods'),
          }}
        />
        <View style={styles.gridTwo}>
          {MOCK_MOODS.map((m) => (
            <MoodCard
              key={m.id}
              title={m.title}
              subtitle={m.subtitle}
              gradient={m.gradient}
              icon={m.icon}
              onPress={() => logger.info('Tapped mood', { name: m.title })}
            />
          ))}
        </View>

        <View style={{ height: 200 }} />
      </ScrollView>
    </View>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Turn a thrown fetch/provider error into a short, user-readable
 * line. The full error is still logged so the dev log on the
 * Profile tab shows the stack + context.
 */
function formatSearchError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/network request failed/i.test(msg)) {
    return "Couldn't reach the search service. Check your network and try again.";
  }
  if (/missing.*api key/i.test(msg)) {
    return 'Search is not configured. Add your YouTube API key in .env.local.';
  }
  if (/http 4\d\d/i.test(msg) || /http 5\d\d/i.test(msg)) {
    return 'The search service is having trouble. Try again in a moment.';
  }
  return 'Search failed. Check the dev log for details.';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  resultMeta: {
    flex: 1,
  },
});
