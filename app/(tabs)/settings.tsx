import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '@/components/GlassCard';
import { DevLogSection } from '@/components/DevLogPanel';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { useThemeStore } from '@/store/themeStore';
import { useColorScheme } from 'react-native';
import { getProvider } from '@/services/music';
import { APP_VERSION, APP_PHASE, APP_NAME } from '@/constants/app';
import { logger } from '@/utils/logger';
import { isWeb, isNative } from '@/theme';

export default function SettingsScreen() {
  const colors = useColors();
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const provider = getProvider();

  useEffect(() => {
    logger.setContext('SettingsScreen');
    return () => logger.clearContext();
  }, []);

  const setLight = () => setMode('light');
  const setDark = () => setMode('dark');
  const setSystem = () => setMode('system');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[textStyle('display'), { color: colors.textPrimary, marginBottom: spacing.lg }]}>
        Settings
      </Text>

      <Animated.View entering={FadeInDown.duration(400)}>
        <SectionHeader label="Appearance" />
        <GlassCard padding={0} radius="lg">
          <SettingRow label="Light" onPress={setLight} trailing={mode === 'light' ? '●' : '○'} />
          <Divider />
          <SettingRow label="Dark" onPress={setDark} trailing={mode === 'dark' ? '●' : '○'} />
          <Divider />
          <SettingRow
            label="Match system"
            sublabel={system === 'light' ? 'Currently light' : 'Currently dark'}
            onPress={setSystem}
            trailing={mode === 'system' ? '●' : '○'}
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <SectionHeader label="Music" />
        <GlassCard padding="md" radius="lg">
          <Text style={[textStyle('caption'), { color: colors.textMuted }]}>
            Provider
          </Text>
          <Text style={[textStyle('heading'), { color: colors.textPrimary, marginTop: 4 }]}>
            {provider.name}
          </Text>
          <Text style={[textStyle('caption'), { color: colors.textMuted, marginTop: 6 }]}>
            Real search and playback arrive in Phase 2.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
        <SectionHeader label="About" />
        <GlassCard padding="md" radius="lg">
          <InfoRow label="App" value={APP_NAME} />
          <InfoRow label="Version" value={APP_VERSION} />
          <InfoRow label="Phase" value={APP_PHASE} />
          <InfoRow label="Platform" value={isWeb ? 'Web (browser)' : isNative ? 'Native' : 'Unknown'} />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(400)}>
        <DevLogSection />
      </Animated.View>

      <View style={{ height: 200 }} />
    </ScrollView>
  );
}

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text
      style={[
        textStyle('label'),
        {
          color: colors.textMuted,
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
        },
      ]}
    >
      {label.toUpperCase()}
    </Text>
  );
}

function SettingRow({
  label,
  sublabel,
  onPress,
  trailing,
}: {
  label: string;
  sublabel?: string;
  onPress?: () => void;
  trailing?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
    >
      <View style={{ flex: 1 }}>
        <Text style={[textStyle('body'), { color: colors.textPrimary }]}>{label}</Text>
        {sublabel ? (
          <Text style={[textStyle('caption'), { color: colors.textMuted, marginTop: 2 }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text style={[textStyle('heading'), { color: colors.accent }]}>{trailing}</Text>
      ) : null}
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[textStyle('body'), { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[textStyle('body'), { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.glassBorder }} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
