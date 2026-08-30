/**
 * GenreCard — large rounded rectangle with a soft pastel gradient.
 *
 * Genre name top-left, large subtle icon bottom-right.
 * Used in Discover's "Browse by Genre" 2-column grid.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors, textStyle, spacing, radii } from '@/theme';
import { Gradient, IconName } from '@/data/mockData';

interface Props {
  name: string;
  gradient: Gradient;
  icon: IconName;
  onPress?: () => void;
}

export function GenreCard({ name, gradient, icon, onPress }: Props): React.ReactElement {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${name}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, flex: 1 }]}
    >
      <LinearGradient
        colors={gradient as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={[textStyle('title'), { color: colors.textPrimary }]}>
          {name}
        </Text>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={56} color="rgba(255,255,255,0.7)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1.4,
    borderRadius: radii.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  iconWrap: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
});
