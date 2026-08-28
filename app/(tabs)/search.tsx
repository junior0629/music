import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';
import { GlassPanel } from '@/components/GlassPanel';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { getProvider } from '@/services/music';
import { Track } from '@/types/player';
import { logger } from '@/utils/logger';
import { withErrorLogging } from '@/utils/withErrorLogging';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const loadTrack = usePlayerStore((s) => s.loadTrack);
  const isFavorite = useLibraryStore((s) => s.isFavorite);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  useEffect(() => {
    logger.setContext('SearchScreen');
    return () => logger.clearContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce: only search after the user has paused typing
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      runSearch(query).catch(() => { /* error already logged */ });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const runSearch = withErrorLogging('SearchScreen.search', async (q: string) => {
    try {
      const r = await getProvider().search(q);
      setResults(r.tracks);
    } finally {
      setLoading(false);
    }
  });

  const play = async (track: Track) => {
    try {
      await loadTrack(track, results);
      await usePlayerStore.getState().play();
    } catch (err) {
      const e = err as Error;
      logger.error('SearchScreen.play failed', { id: track.id, title: track.title, err: e?.message ?? String(err) }, e);
    }
    router.push(`/player/${track.id}`);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={[textStyle('display'), { color: colors.textPrimary, marginBottom: spacing.md }]}>
          Search
        </Text>
        <GlassPanel padding={spacing.xs} radius={radii.pill}>
          <View style={styles.searchBar}>
            <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search music..."
              placeholderTextColor={colors.textMuted}
              style={[textStyle('body'), { color: colors.textPrimary, flex: 1 }]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <Text style={[styles.clearIcon, { color: colors.textMuted }]}>×</Text>
              </Pressable>
            ) : null}
          </View>
        </GlassPanel>
        <Text style={[textStyle('caption'), { color: colors.textMuted, marginTop: spacing.xs }]}>
          {getProvider().name}{loading ? ' · searching…' : ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.results}
        showsVerticalScrollIndicator={false}
      >
        {results.length === 0 ? (
          <GlassCard padding="lg" radius="lg" style={{ marginTop: spacing.xl }}>
            <Text style={[textStyle('body'), { color: colors.textMuted, textAlign: 'center' }]}>
              {loading
                ? 'Searching…'
                : query.trim().length === 0
                ? 'Type a song, artist, or album to search'
                : 'No results — try a different query'}
            </Text>
          </GlassCard>
        ) : (
          results.map((t, idx) => (
            <Animated.View
              key={t.id}
              entering={FadeInDown.delay(idx * 40).duration(300)}
              layout={Layout.springify()}
            >
              <Pressable onPress={() => play(t)} accessibilityLabel={`Play ${t.title} by ${t.artist}`}>
                <GlassCard padding="sm" radius="lg" style={{ marginBottom: spacing.sm }}>
                  <View style={styles.resultRow}>
                    <Image
                      source={{ uri: t.thumbnail }}
                      style={[styles.thumb, { backgroundColor: colors.glassSurfaceSubtle }]}
                    />
                    <View style={styles.meta}>
                      <Text
                        numberOfLines={1}
                        style={[textStyle('heading'), { color: colors.textPrimary }]}
                      >
                        {t.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[textStyle('caption'), { color: colors.textSecondary }]}
                      >
                        {t.artist}  ·  {formatDuration(t.durationSec)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(t);
                      }}
                      hitSlop={10}
                      accessibilityLabel={isFavorite(t.id) ? 'Unfavorite' : 'Favorite'}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 6 }]}
                    >
                      <Text
                        style={{
                          color: isFavorite(t.id) ? colors.accent : colors.textMuted,
                          fontSize: 22,
                        }}
                      >
                        {isFavorite(t.id) ? '♥' : '♡'}
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))
        )}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearIcon: {
    fontSize: 22,
    fontWeight: '300',
  },
  results: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
  },
  meta: {
    flex: 1,
  },
});
