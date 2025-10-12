/**
 * DoseStatusBadge Component
 * Color-coded badge for medication dose status
 * Specifications: Auto-sized, rounded corners (16px), bold uppercase text
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

export type DoseStatus = 'taken' | 'pending' | 'upcoming' | 'late' | 'missed' | 'skipped';

interface DoseStatusBadgeProps {
  status: DoseStatus;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig: Record<DoseStatus, { label: string; icon: string; bgColor: string; textColor: string }> = {
  taken: {
    label: 'TAKEN',
    icon: '✓',
    bgColor: Colors.dose.takenLight,
    textColor: Colors.dose.taken,
  },
  pending: {
    label: 'PENDING',
    icon: '○',
    bgColor: Colors.dose.pendingLight,
    textColor: Colors.dose.pending,
  },
  upcoming: {
    label: 'UPCOMING',
    icon: '◷',
    bgColor: Colors.dose.upcomingLight,
    textColor: Colors.dose.upcoming,
  },
  late: {
    label: 'LATE',
    icon: '⚠',
    bgColor: Colors.dose.lateLight,
    textColor: Colors.dose.late,
  },
  missed: {
    label: 'MISSED',
    icon: '✗',
    bgColor: Colors.dose.missedLight,
    textColor: Colors.dose.missed,
  },
  skipped: {
    label: 'SKIPPED',
    icon: '⊘',
    bgColor: Colors.dose.skippedLight,
    textColor: Colors.dose.skipped,
  },
};

export default function DoseStatusBadge({ status, size = 'medium' }: DoseStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, styles[size]]}>
      <Text style={[styles.icon, { color: config.textColor }, styles[`${size}Icon`]]}>
        {config.icon}
      </Text>
      <Text style={[styles.label, { color: config.textColor }, styles[`${size}Text`]]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.badge,
    alignSelf: 'flex-start',
  },

  // Sizes
  small: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  medium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  large: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },

  // Icon
  icon: {
    fontWeight: Typography.fontWeight.bold,
  },
  smallIcon: {
    fontSize: 10,
  },
  mediumIcon: {
    fontSize: 12,
  },
  largeIcon: {
    fontSize: 14,
  },

  // Label
  label: {
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});
