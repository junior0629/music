import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { useLibraryStore } from '@/store/libraryStore';
import { logger } from '@/utils/logger';

interface Section {
  key: string;
  label: string;
  icon: string;
  count?: number;
}

export default function LibraryScreen() {
  const colors = useColors();
  const favorites = useLibraryStore((s) => s.favorites);
  const playlists = useLibraryStore((s) => s.playlists);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const addPlaylist = useLibraryStore((s) => s.addPlaylist);

  useEffect(() => {
    logger.setContext('LibraryScreen');
    logger.debug('LibraryScreen mounted');
    return () => logger.clearContext();
  }, []);

  const sections: Section[] = [
    { key: 'favorites', label: 'Favorites', icon: '♥', count: favorites.length },
    { key: 'playlists', label: 'Playlists', icon: '☰', count: playlists.length },
    { key: 'downloads', label: 'Downloads', icon: '↓', count: 0 },
    { key: 'local', label: 'Local Music', icon: '◫', count: 0 },
    { key: 'recent', label: 'Recently Played', icon: '◷', count: recentlyPlayed.length },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[textStyle('display'), { color: colors.textPrimary, marginBottom: spacing.lg }]}>
        Library
      </Text>

      <View style={styles.grid}>
        {sections.map((s, idx) => (
          <Animated.View
            key={s.key}
            entering={FadeInDown.delay(idx * 60).duration(400)}
            style={styles.gridItem}
          >
            <Pressable
              accessibilityLabel={`Open ${s.label}`}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <GlassCard padding="md" radius="lg" style={styles.tile}>
                <View
                  style={[
                    styles.tileIcon,
                    {
                      backgroundColor: colors.accentSoft,
                      borderColor: colors.glassBorderStrong,
                    },
                  ]}
                >
                  <Text style={[styles.tileIconText, { color: colors.accent }]}>{s.icon}</Text>
                </View>
                <Text style={[textStyle('heading'), { color: colors.textPrimary }]}>
                  {s.label}
                </Text>
                {typeof s.count === 'number' ? (
                  <Text style={[textStyle('caption'), { color: colors.textMuted }]}>
                    {s.count} {s.count === 1 ? 'item' : 'items'}
                  </Text>
                ) : null}
              </GlassCard>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Pressable
          onPress={() => {
            const id = addPlaylist('New Playlist');
            logger.info('Created playlist', { id });
          }}
          accessibilityLabel="Create playlist"
        >
          <GlassCard padding="md" radius="lg" style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: colors.glassBorderStrong, borderRadius: radii.lg }}>
            <Text style={[textStyle('heading'), { color: colors.textPrimary }]}>
              +  New playlist
            </Text>
            <Text style={[textStyle('caption'), { color: colors.textMuted }]}>
              Tap to create
            </Text>
          </GlassCard>
        </Pressable>
      </View>

      <View style={{ height: 200 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
    flexGrow: 1,
  },
  tile: {
    minHeight: 140,
    justifyContent: 'space-between',
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
});
