import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Slot } from 'expo-router';
import { BottomNavigation, NavTab } from '@/components/BottomNavigation';
import { MiniPlayer } from '@/components/MiniPlayer';
import { selection } from '@/utils/haptics';

/**
 * The tabs group layout. We use a custom BottomNavigation instead of
 * the default Expo Router Tabs UI, so the children are rendered
 * directly (no per-screen tab headers) and a single bottom bar is
 * mounted at the root.
 *
 * The active tab is tracked here so the nav reflects the current
 * route, and tapping a tab navigates with `router.replace`.
 */
export default function TabsLayout() {
  const router = useRouter();
  const [active, setActive] = useState<NavTab>('home');

  const onChange = (tab: NavTab) => {
    if (tab !== active) {
      // Only fire on real changes — re-tapping the current tab
      // shouldn't buzz.
      selection();
    }
    setActive(tab);
    switch (tab) {
      case 'home':
        router.replace('/(tabs)');
        break;
      case 'discover':
        router.replace('/(tabs)/discover');
        break;
      case 'library':
        router.replace('/(tabs)/library');
        break;
      case 'profile':
        router.replace('/(tabs)/profile');
        break;
    }
  };

  return (
    <View style={styles.root}>
      <Slot />
      <MiniPlayer />
      <BottomNavigation active={active} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
