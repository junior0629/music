import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GradientBackground } from '@/components/GradientBackground';
import { useThemeStore } from '@/store/themeStore';
import { usePlayerStore } from '@/store/playerStore';
import { logger } from '@/utils/logger';
import { installGlobalErrorHandlers } from '@/utils/globalErrorHandlers';
import { APP_VERSION, APP_PHASE } from '@/constants/app';
import { applyGlobalWebStyles } from '@/theme/global.css';

export default function RootLayout() {
  const themeMode = useThemeStore((s) => s.mode);
  const hydrate = useThemeStore((s) => s.hydrate);
  const isDark = themeMode !== 'light';

  // Hydrate persisted theme on first mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Install global error handlers once
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  // Wire the audio service to the player store once at app boot
  useEffect(() => {
    const dispose = usePlayerStore.getState().init();
    return () => dispose();
  }, []);

  // Apply web-only global styles (Oswald font import, etc.)
  useEffect(() => {
    applyGlobalWebStyles();
  }, []);

  // Startup banner
  useEffect(() => {
    logger.info('App started', {
      version: APP_VERSION,
      phase: APP_PHASE,
      platform: Platform.OS,
      theme: themeMode,
    });
  }, [themeMode]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <GradientBackground>
            <View style={[styles.root, { backgroundColor: 'transparent' }]}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="player/[id]"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="playlist/[id]"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
              </Stack>
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </View>
          </GradientBackground>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
