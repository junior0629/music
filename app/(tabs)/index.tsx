import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@/components/GlassCard';
import { useColors, useShadows, textStyle, spacing, radii } from '@/theme';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { logger } from '@/utils/logger';
import { getProvider } from '@/services/music';

const MOCK_FEATURED = {
  id: 'mock_featured',
  title: 'Die With A Smile',
  artist: 'Lady Gaga & Bruno Mars',
  durationSec: 251,
  thumbnail:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="%237C3AED"/><stop offset="0.5" stop-color="%23EC4899"/><stop offset="1" stop-color="%233B82F6"/></linearGradient></defs><rect width="80" height="80" rx="14" fill="url(%23g)"/></svg>',
    ),
  sourceProvider: 'mock',
};

export default function HomeScreen() {
  const colors = useColors();
  const shadows = useShadows();
  const router = useRouter();
  const playlists = useLibraryStore((s) => s.playlists);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const loadTrack = usePlayerStore((s) => s.loadTrack);

  useEffect(() => {
    logger.setContext('HomeScreen');
    logger.debug('HomeScreen mounted');
    return () => logger.clearContext();
  }, []);

  // Seed mock recently-played for the visual demo
  const recent = recentlyPlayed.length > 0
    ? recentlyPlayed
    : [
        { ...MOCK_FEATURED, id: 'mock_1' },
        { ...MOCK_FEATURED, id: 'mock_2', title: 'Espresso', artist: 'Sabrina Carpenter' },
        { ...MOCK_FEATURED, id: 'mock_3', title: 'APT.', artist: 'ROSÉ & Bruno Mars' },
      ];

  const playTrack = (track: typeof MOCK_FEATURED) => {
    loadTrack(track as any);
    router.push(`/player/${track.id}`);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[textStyle('display'), { color: colors.textPrimary }]}>
          {greeting} 👋
        </Text>
        <Text style={[textStyle('body'), { color: colors.textSecondary, marginBottom: spacing.xl }]}>
          {getProvider().name === 'mock' ? 'Mock data · Phase 1 demo' : 'Welcome back'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)}>
        <Pressable onPress={() => playTrack(MOCK_FEATURED)} accessibilityLabel="Play featured track">
          <GlassCard padding={0} radius="xl" shadow="md" style={styles.featured}>
            <View style={styles.featuredInner}>
              <LinearGradient
                colors={[colors.accentGradient.from, colors.accentGradient.via, colors.accentGradient.to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.featuredArt, { borderRadius: radii.md }]}
              >
                <Text style={styles.featuredArtGlyph}>♪</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={[textStyle('heading'), { color: colors.textPrimary }]}
                >
                  {MOCK_FEATURED.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[textStyle('body'), { color: colors.textSecondary, marginBottom: spacing.sm }]}
                >
                  {MOCK_FEATURED.artist}
                </Text>
                <View style={[styles.playPill, { backgroundColor: colors.accentSoft, borderColor: colors.glassBorderStrong }]}>
                  <Text style={[textStyle('label'), { color: colors.accent }]}>▶  PLAY</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Text
          style={[
            textStyle('title'),
            { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
          ]}
        >
          Recently played
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {recent.map((t, idx) => (
            <Pressable
              key={t.id}
              onPress={() => playTrack(t as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Animated.View entering={FadeInDown.delay(160 + idx * 60).duration(400)}>
                <GlassCard padding="sm" radius="lg" style={styles.recentCard}>
                  <Image
                    source={{ uri: t.thumbnail }}
                    style={[styles.recentArt, { backgroundColor: colors.glassSurfaceSubtle }]}
                  />
                  <Text
                    numberOfLines={1}
                    style={[textStyle('caption'), { color: colors.textPrimary, marginTop: spacing.xs, width: 120 }]}
                  >
                    {t.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[textStyle('caption'), { color: colors.textMuted, width: 120 }]}
                  >
                    {t.artist}
                  </Text>
                </GlassCard>
              </Animated.View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280).duration(500)}>
        <Text
          style={[
            textStyle('title'),
            { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
          ]}
        >
          Your playlists
        </Text>
        {playlists.length === 0 ? (
          <GlassCard padding="md" radius="lg">
            <Text style={[textStyle('body'), { color: colors.textMuted }]}>
              No playlists yet. Create one from the Library tab.
            </Text>
          </GlassCard>
        ) : (
          playlists.map((p) => (
            <Pressable key={p.id} accessibilityLabel={`Open playlist ${p.name}`}>
              <GlassCard padding="md" radius="lg" style={{ marginBottom: spacing.sm }}>
                <View style={styles.playlistRow}>
                  <View
                    style={[
                      styles.playlistIcon,
                      { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Text style={[styles.playlistIconGlyph, { color: colors.accent }]}>♪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[textStyle('heading'), { color: colors.textPrimary }]}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={[textStyle('caption'), { color: colors.textMuted }]}
                    >
                      {p.trackIds.length} {p.trackIds.length === 1 ? 'track' : 'tracks'}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))
        )}
      </Animated.View>

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
    paddingTop: spacing.xxxl + spacing.lg,
  },
  featured: {
    overflow: 'hidden',
  },
  featuredInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  featuredArt: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredArtGlyph: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '700',
  },
  playPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  row: {
    gap: spacing.sm,
  },
  recentCard: {
    width: 140,
  },
  recentArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistIconGlyph: {
    fontSize: 22,
    fontWeight: '700',
  },
});
