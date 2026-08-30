/**
 * BottomNavigation — full-width four-tab bar.
 *
 * White background, subtle top hairline, icon + label.
 * Active tab: filled purple icon + purple label.
 * Inactive: gray icon + gray label.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, useShadows } from '@/theme';

export type NavTab = 'home' | 'discover' | 'library' | 'profile';

interface Props {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; iconActive: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'home',     label: 'Home',     icon: 'home-outline',         iconActive: 'home' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline',      iconActive: 'compass' },
  { key: 'library',  label: 'Library',  icon: 'musical-notes-outline', iconActive: 'musical-notes' },
  { key: 'profile',  label: 'Profile',  icon: 'person-outline',       iconActive: 'person' },
];

export function BottomNavigation({ active, onChange }: Props): React.ReactElement {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const shadows = useShadows();

  return (
    <View
      style={[
        styles.outer,
        { paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.border },
        shadows.md,
      ]}
    >
      <View style={styles.row}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: isActive }}
              hitSlop={8}
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons
                name={isActive ? t.iconActive : t.icon}
                size={22}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  textStyle('micro'),
                  {
                    color: isActive ? colors.primary : colors.textMuted,
                    marginTop: 2,
                    textTransform: 'none',
                    letterSpacing: 0.2,
                  },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
