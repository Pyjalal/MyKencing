/**
 * StatCard Component
 * Card for displaying statistics with emoji icons and optional gradients
 * Specifications:
 * - 100px minimum height
 * - Emoji icon (40px)
 * - Title and value
 * - Streak display (fire emoji + days)
 * - Optional gradient background
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  streak?: number;
  gradient?: [string, string];
  backgroundColor?: string;
  textColor?: string;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  icon,
  streak,
  gradient,
  backgroundColor = Colors.background.card,
  textColor = Colors.text.primary,
  onPress,
}: StatCardProps) {
  const content = (
    <View style={styles.content}>
      {/* Icon */}
      {icon && <Text style={styles.icon}>{icon}</Text>}

      {/* Title and Value */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.value, { color: textColor }]} numberOfLines={1}>
          {value}
        </Text>
      </View>

      {/* Streak display */}
      {streak !== undefined && streak > 0 && (
        <View style={styles.streak}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={[styles.streakValue, { color: textColor }]}>{streak}</Text>
        </View>
      )}
    </View>
  );

  if (gradient) {
    return (
      <TouchableOpacity
        disabled={!onPress}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        accessibilityRole={onPress ? 'button' : 'none'}
        accessibilityLabel={`${title} ${value}`}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, styles.gradientCard]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }, !onPress && styles.noShadow]}
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${title} ${value}`}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    minHeight: 100,
    ...Shadows.sm,
  },

  gradientCard: {
    ...Shadows.md,
  },

  noShadow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  icon: {
    fontSize: 40,
    lineHeight: 48,
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: 4,
  },

  value: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 32,
  },

  streak: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },

  streakIcon: {
    fontSize: 24,
    marginBottom: 2,
  },

  streakValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
});
