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
import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../lib/utils';
import DoseStatusBadge, { DoseStatus } from './DoseStatusBadge';
import { Colors } from '../constants/theme';

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
  const statusColors = {
    taken: Colors.dose.taken,
    pending: Colors.dose.pending,
    upcoming: Colors.dose.upcoming,
    late: Colors.dose.late,
    missed: Colors.dose.missed,
    skipped: Colors.dose.skipped,
  };

  const statusColor = statusColors[status];
  const showActions = status === 'pending' || status === 'late';

  return (
    <TouchableOpacity
      style={{ borderLeftColor: statusColor }}
      className="bg-white rounded-card p-4 min-h-[140px] border-l-4 shadow-md"
      onPress={onViewDetails}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${medicationName} ${dosage} at ${time}`}
    >
      {/* Header with time and status */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-semibold text-text-primary">{time}</Text>
        <DoseStatusBadge status={status} />
      </View>

      {/* Medication info */}
      <View className="mb-4">
        <Text className="text-2xl font-bold text-text-primary mb-1" numberOfLines={1}>
          {medicationName}
        </Text>
        <Text className="text-base text-text-secondary mb-1">{dosage}</Text>
        {foodInstructions && (
          <Text className="text-sm text-text-tertiary mt-1">
            <Text className="text-base">🍽️</Text> {foodInstructions}
          </Text>
        )}
      </View>

      {/* Action buttons for pending/late doses */}
      {showActions && (
        <View className="flex-row gap-4">
          <TouchableOpacity
            className="flex-1 min-h-[56px] rounded-xl justify-center items-center bg-primary"
            onPress={onTakeDose}
            accessibilityRole="button"
            accessibilityLabel="Take dose"
          >
            <Text className="text-base font-semibold text-white">Take</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 min-h-[56px] rounded-xl justify-center items-center bg-gray-200"
            onPress={onSkipDose}
            accessibilityRole="button"
            accessibilityLabel="Skip dose"
          >
            <Text className="text-base font-semibold text-text-secondary">Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
