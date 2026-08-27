/**
 * Global error boundary.
 * Catches any uncaught render error, shows a glass-styled fallback
 * with the error and a reload button, and logs the full error to
 * the logger (so it shows up in the DevLogPanel).
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors, useShadows, textStyle, spacing, radii } from '@/theme';
import { logger } from '@/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error(
      'Render error caught by ErrorBoundary',
      { componentStack: errorInfo.componentStack?.slice(0, 1500) },
      error,
    );
    this.setState({ errorInfo });
  }

  reset = (): void => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onReset={this.reset} />;
  }
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}) {
  const colors = useColors();
  const shadows = useShadows();

  const details = [
    `Error: ${error.message}`,
    errorInfo?.componentStack ? `Component stack:\n${errorInfo.componentStack}` : null,
    error.stack ? `JS stack:\n${error.stack}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <View style={[styles.root, { backgroundColor: colors.bgBase }]}>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.glassSurface,
            borderColor: colors.glassBorder,
          },
          shadows.lg,
        ]}
      >
        <Text style={[textStyle('title'), { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          Something went wrong
        </Text>
        <Text
          style={[
            textStyle('body'),
            { color: colors.textSecondary, marginBottom: spacing.lg },
          ]}
        >
          {error.message || 'Unknown error'}
        </Text>
        <ScrollView
          style={[
            styles.detailsBox,
            {
              backgroundColor: colors.glassSurfaceSubtle,
              borderColor: colors.glassBorder,
            },
          ]}
          contentContainerStyle={{ padding: spacing.md }}
        >
          <Text
            selectable
            style={[
              textStyle('caption'),
              { color: colors.textMuted, fontFamily: 'monospace' },
            ]}
          >
            {details}
          </Text>
        </ScrollView>
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.accentSoft,
              borderColor: colors.glassBorderStrong,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityLabel="Reload app"
          accessibilityRole="button"
        >
          <Text style={[textStyle('heading'), { color: colors.accent }]}>Reload</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  detailsBox: {
    maxHeight: 280,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
