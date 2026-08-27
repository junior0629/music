import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GlassCard } from '@/components/GlassCard';
import { useColors, textStyle, spacing } from '@/theme';
import { useLibraryStore } from '@/store/libraryStore';
import { logger } from '@/utils/logger';

export default function PlaylistScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === id));

  useEffect(() => {
    logger.setContext('PlaylistScreen');
    logger.info('Opened', { playlistId: id, found: Boolean(playlist) });
    return () => logger.clearContext();
  }, [id, playlist]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      <Text style={[textStyle('display'), { color: colors.textPrimary }]}>
        {playlist?.name ?? 'Playlist'}
      </Text>
      <Text style={[textStyle('body'), { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {playlist?.trackIds.length ?? 0} tracks
      </Text>
      <GlassCard padding="lg" radius="lg">
        <Text style={[textStyle('body'), { color: colors.textMuted, textAlign: 'center' }]}>
          Playlist detail UI arrives in Phase 3 (with real tracks).
        </Text>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.lg,
  },
});
