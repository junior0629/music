import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Slot } from 'expo-router';
import { FloatingNav, NavTab } from '@/components/FloatingNav';
import { MiniPlayer } from '@/components/MiniPlayer';

/**
 * The tabs group layout. We use a custom FloatingNav instead of the
 * default Expo Router Tabs UI, so the children are rendered directly
 * (no per-screen tab headers) and a single floating nav is mounted
 * at the root.
 *
 * The active tab is tracked here so the nav reflects the current
 * route, and tapping a tab navigates with `router.replace`.
 */
export default function TabsLayout() {
  const router = useRouter();
  const [active, setActive] = useState<NavTab>('home');

  const onChange = (tab: NavTab) => {
    setActive(tab);
    switch (tab) {
      case 'home':
        router.replace('/(tabs)');
        break;
      case 'search':
        router.replace('/(tabs)/search');
        break;
      case 'library':
        router.replace('/(tabs)/library');
        break;
      case 'settings':
        router.replace('/(tabs)/settings');
        break;
    }
  };

  return (
    <View style={styles.root}>
      <Slot />
      <MiniPlayer />
      <FloatingNav active={active} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
