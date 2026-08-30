import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, textStyle, spacing, radii, useShadows } from '@/theme';
import { useLibraryStore } from '@/store/libraryStore';
import { logger } from '@/utils/logger';

export default function PlaylistScreen() {
  const colors = useColors();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={[textStyle('display'), { color: colors.textPrimary }]}>
        {playlist?.name ?? 'Playlist'}
      </Text>
      <Text style={[textStyle('body'), { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {playlist?.trackIds.length ?? 0} tracks
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
        <Text style={[textStyle('body'), { color: colors.textMuted, textAlign: 'center' }]}>
          Playlist detail UI arrives once real tracks are wired in.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
});
