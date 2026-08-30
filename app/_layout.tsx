import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useThemeStore } from '@/store/themeStore';
import { usePlayerMetaStore } from '@/store/playerStore';
import { logger } from '@/utils/logger';
import { installGlobalErrorHandlers } from '@/utils/globalErrorHandlers';
import { APP_VERSION, APP_PHASE } from '@/constants/app';
import { applyGlobalWebStyles } from '@/theme/global.css';
import { palette } from '@/theme/colors';

export default function RootLayout() {
  // themeStore is now a light-only stub; we still read it so any
  // persisted callers don't break and the boot order is unchanged.
  const themeMode = useThemeStore((s) => s.mode);
  const hydrate = useThemeStore((s) => s.hydrate);

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
    const dispose = usePlayerMetaStore.getState().init();
    return () => dispose();
  }, []);

  // Apply web-only global styles (font import, etc.)
  useEffect(() => {
    applyGlobalWebStyles();
  }, []);

  // Load the Ionicons font once at boot. Without this, the codepoints
  // that <Ionicons name="home" /> resolves to render as tofu boxes
  // (Roboto doesn't include the private-use-area glyphs the icon
  // font uses). We don't gate UI on the load — the font is bundled
  // with the APK and resolves in a few ms; rendering shows a blank
  // icon for that frame and snaps to the icon on the next paint.
  useEffect(() => {
    Ionicons.loadFont().catch((err) => {
      logger.warn('Ionicons.loadFont failed', { err: String(err) });
    });
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
          {/* Solid off-white page — the new aesthetic has no gradient
              background. We render a single soft accent bloom in the
              top-right so the page has a hint of life without
              becoming decorative. */}
          <View style={[styles.root, { backgroundColor: palette.bgPageSoft }]}>
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
            <StatusBar style="dark" />
          </View>
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
