/**
 * Profile screen.
 *
 * Layout:
 *   - Lavender header gradient with avatar + name + subtitle
 *   - Three stat cards (Minutes / Artists / Playlists)
 *   - Account settings list (3 rows)
 *   - Developer section with the dev log panel (restored here after
 *     the Settings tab was removed in the redesign; the user needs
 *     somewhere accessible to see runtime errors)
 *
 * Note: a Premium/subscription card was removed — the project is a
 * personal, no-budget build for two people, so the premium upsell
 * doesn't belong here.
 */
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, textStyle, spacing, useShadows } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { SettingRow } from '@/components/SettingRow';
import { DevLogSection } from '@/components/DevLogPanel';
import { MOCK_SETTINGS, MOCK_STATS, MOCK_USER } from '@/data/mockData';
import { logger } from '@/utils/logger';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const shadows = useShadows();

  useEffect(() => {
    logger.setContext('ProfileScreen');
    return () => logger.clearContext();
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Lavender header */}
      <View style={[styles.header, shadows.sm]}>
        <LinearGradient
          colors={['#E9D5FF', '#C4B5FD', '#A78BFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBg}
        />
        <View style={styles.headerContent}>
          <Avatar size={88} initials={MOCK_USER.initials} />
          <Text
            style={[
              textStyle('display'),
              { color: '#1E1B4B', fontSize: 24, lineHeight: 30, marginTop: spacing.md },
            ]}
          >
            {MOCK_USER.name}
          </Text>
          <Text
            style={[
              textStyle('body'),
              { color: '#4C1D95', marginTop: spacing.xxs },
            ]}
          >
            {MOCK_USER.subtitle}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {MOCK_STATS.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} />
        ))}
      </View>

      {/* Account settings */}
      <SectionHeader title="Account Settings" />
      {MOCK_SETTINGS.map((s) => (
        <SettingRow
          key={s.id}
          title={s.title}
          icon={s.icon}
          tint={s.tint}
          onPress={() => logger.info('Tapped setting', { id: s.id, title: s.title })}
        />
      ))}

      {/* Developer — live log panel, filterable + copyable. Lives on
          Profile because the Settings tab was removed in the redesign. */}
      <DevLogSection />

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
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
