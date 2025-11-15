/**
 * VitalCard Component
 * Card for displaying vital signs (blood pressure, blood sugar, etc.)
 * Specifications:
 * - 100px minimum height
 * - Type label (14px caps)
 * - Value (32px bold)
 * - Status badge (NORMAL/WARNING/CRITICAL)
 * - 4px left border color indicator
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

type VitalStatus = 'normal' | 'warning' | 'critical' | 'unknown';

interface VitalCardProps {
  type: string;
  value: string;
  unit: string;
  status: VitalStatus;
  timestamp?: string;
  icon?: string;
  onPress?: () => void;
}

const statusConfig: Record<VitalStatus, { labelKey: string; bgColor: string; textColor: string; borderColor: string }> = {
  normal: {
    labelKey: 'vitals_status.normal',
    bgColor: Colors.vitals.normalLight,
    textColor: Colors.vitals.normal,
    borderColor: Colors.vitals.normal,
  },
  warning: {
    labelKey: 'vitals_status.warning',
    bgColor: Colors.vitals.warningLight,
    textColor: Colors.vitals.warning,
    borderColor: Colors.vitals.warning,
  },
  critical: {
    labelKey: 'vitals_status.critical',
    bgColor: Colors.vitals.criticalLight,
    textColor: Colors.vitals.critical,
    borderColor: Colors.vitals.critical,
  },
  unknown: {
    labelKey: 'vitals_status.no_data',
    bgColor: Colors.vitals.unknownLight,
    textColor: Colors.vitals.unknown,
    borderColor: Colors.vitals.unknown,
  },
};

export default function VitalCard({
  type,
  value,
  unit,
  status,
  timestamp,
  icon,
  onPress,
}: VitalCardProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: config.borderColor }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${type} ${value} ${unit} ${status}`}
    >
      {/* Header with type and icon */}
      <View style={styles.header}>
        <Text style={styles.type}>{type.toUpperCase()}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>

      {/* Value and unit */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      {/* Status badge and timestamp */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
          <Text style={[styles.statusText, { color: config.textColor }]}>
            {t(config.labelKey)}
          </Text>
        </View>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    minHeight: 100,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  type: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    letterSpacing: 1,
  },

  icon: {
    fontSize: 20,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },

  value: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: 36,
  },

  unit: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.badge,
  },

  statusText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 0.5,
  },

  timestamp: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
});
