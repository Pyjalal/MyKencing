/**
 * MedicationCard Component
 * Card for displaying medication in list view
 * Specifications:
 * - 120px minimum height
 * - Medicine name (24px bold)
 * - Frequency and times (18px)
 * - Adherence percentage (14px)
 * - Menu button (40x40px touch target)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface MedicationCardProps {
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[];
  adherencePercentage?: number;
  isActive?: boolean;
  onPress?: () => void;
  onMenuPress?: () => void;
}

export default function MedicationCard({
  medicationName,
  dosage,
  frequency,
  times,
  adherencePercentage,
  isActive = true,
  onPress,
  onMenuPress,
}: MedicationCardProps) {
  const adherenceColor =
    adherencePercentage !== undefined
      ? adherencePercentage >= 80
        ? Colors.status.success
        : adherencePercentage >= 50
        ? Colors.status.warning
        : Colors.status.error
      : Colors.text.tertiary;

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.inactiveCard]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${medicationName} ${dosage}`}
    >
      <View style={styles.content}>
        {/* Header with medication name and menu button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.medicationName} numberOfLines={1}>
              {medicationName}
            </Text>
            {!isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Dosage */}
        <Text style={styles.dosage}>{dosage}</Text>

        {/* Frequency and times */}
        <View style={styles.scheduleRow}>
          <Text style={styles.frequency}>{frequency}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.times}>{times.join(', ')}</Text>
        </View>

        {/* Adherence percentage */}
        {adherencePercentage !== undefined && (
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceBar}>
              <View
                style={[
                  styles.adherenceFill,
                  { width: `${adherencePercentage}%`, backgroundColor: adherenceColor },
                ]}
              />
            </View>
            <Text style={[styles.adherenceText, { color: adherenceColor }]}>
              {adherencePercentage}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    minHeight: 120,
    ...Shadows.sm,
  },

  inactiveCard: {
    opacity: 0.6,
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  medicationName: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flexShrink: 1,
  },

  inactiveBadge: {
    backgroundColor: Colors.neutral[200],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },

  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.tertiary,
  },

  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },

  menuIcon: {
    fontSize: 24,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.bold,
  },

  dosage: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },

  frequency: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },

  dot: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    marginHorizontal: Spacing.sm,
  },

  times: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    flexShrink: 1,
  },

  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  adherenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },

  adherenceFill: {
    height: '100%',
    borderRadius: 4,
  },

  adherenceText: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.semibold,
    minWidth: 40,
    textAlign: 'right',
  },
});
