/**
 * DoseCard Component
 * Card for displaying individual medication doses
 * Specifications:
 * - 140px height
 * - Color-coded status with 4px left border
 * - Action buttons (56px height)
 * - Large medicine name (24px)
 * - Status badge with icons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TouchTargets } from '../constants/theme';
import DoseStatusBadge, { DoseStatus } from './DoseStatusBadge';

interface DoseCardProps {
  medicationName: string;
  dosage: string;
  time: string;
  status: DoseStatus;
  foodInstructions?: string;
  onTakeDose?: () => void;
  onSkipDose?: () => void;
  onViewDetails?: () => void;
}

export default function DoseCard({
  medicationName,
  dosage,
  time,
  status,
  foodInstructions,
  onTakeDose,
  onSkipDose,
  onViewDetails,
}: DoseCardProps) {
  const statusColor = {
    taken: Colors.dose.taken,
    pending: Colors.dose.pending,
    upcoming: Colors.dose.upcoming,
    late: Colors.dose.late,
    missed: Colors.dose.missed,
    skipped: Colors.dose.skipped,
  }[status];

  const showActions = status === 'pending' || status === 'late';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusColor }]}
      onPress={onViewDetails}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${medicationName} ${dosage} at ${time}`}
    >
      {/* Header with time and status */}
      <View style={styles.header}>
        <Text style={styles.time}>{time}</Text>
        <DoseStatusBadge status={status} />
      </View>

      {/* Medication info */}
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName} numberOfLines={1}>
          {medicationName}
        </Text>
        <Text style={styles.dosage}>{dosage}</Text>
        {foodInstructions && (
          <Text style={styles.foodInstructions}>
            <Text style={styles.foodIcon}>🍽️</Text> {foodInstructions}
          </Text>
        )}
      </View>

      {/* Action buttons for pending/late doses */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.takeButton]}
            onPress={onTakeDose}
            accessibilityRole="button"
            accessibilityLabel="Take dose"
          >
            <Text style={styles.takeButtonText}>Take</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={onSkipDose}
            accessibilityRole="button"
            accessibilityLabel="Skip dose"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    minHeight: 140,
    borderLeftWidth: 4,
    ...Shadows.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  time: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },

  medicationInfo: {
    marginBottom: Spacing.md,
  },

  medicationName: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },

  dosage: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: 4,
  },

  foodInstructions: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: 4,
  },

  foodIcon: {
    fontSize: Typography.fontSize.base,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  actionButton: {
    flex: 1,
    minHeight: TouchTargets.min,
    borderRadius: BorderRadius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },

  takeButton: {
    backgroundColor: Colors.primary.main,
  },

  takeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },

  skipButton: {
    backgroundColor: Colors.neutral[200],
  },

  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
});
