/**
 * FloatingNav — bottom navigation as a floating glass pill.
 *
 * Sits above the screen bottom with margin, not flush to the edge.
 * Replaces the traditional solid tab bar. Active tab gets the
 * accent color and a subtle glow.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassPanel } from './GlassPanel';
import { useColors, useShadows, textStyle, spacing, radii, isWeb } from '@/theme';

export type NavTab = 'home' | 'search' | 'library' | 'settings';

interface Props {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'search', label: 'Search', icon: '⌕' },
  { key: 'library', label: 'Library', icon: '♪' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

export function FloatingNav({ active, onChange }: Props): React.ReactElement {
  const colors = useColors();

  return (
    <View pointerEvents="box-none" style={styles.outer}>
      <GlassPanel
        style={styles.panel}
        padding={spacing.xs}
        radius={radii.pill}
        blurIntensity={isWeb ? 24 : 35}
      >
        <View style={styles.row}>
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <Pressable
                key={t.key}
                onPress={() => onChange(t.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.glassBorderStrong,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="tab"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: isActive }}
                hitSlop={8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[colors.accentGradient.from, colors.accentGradient.via, colors.accentGradient.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGlow}
                  />
                ) : null}
                <Text
                  style={[
                    styles.icon,
                    { color: isActive ? colors.accent : colors.textMuted },
                  ]}
                >
                  {t.icon}
                </Text>
                <Text
                  style={[
                    textStyle('label'),
                    { color: isActive ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  panel: {
    // The GlassPanel already gives us a nice shadow. We constrain width
    // to feel like a "pill" rather than a full-width bar.
    width: 'auto',
    minWidth: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '600',
  },
  iconGlow: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: 6,
    left: 6,
    opacity: 0.5,
  },
  label: {
    fontSize: 11,
  },
});
