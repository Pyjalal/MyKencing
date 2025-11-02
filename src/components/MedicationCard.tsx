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
import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../lib/utils';
import { Colors } from '../constants/theme';

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
  const getAdherenceColor = () => {
    if (adherencePercentage === undefined) return 'text-text-tertiary';
    if (adherencePercentage >= 80) return 'text-success';
    if (adherencePercentage >= 50) return 'text-warning';
    return 'text-error';
  };

  const getAdherenceBarColor = () => {
    if (adherencePercentage === undefined) return Colors.neutral[500];
    if (adherencePercentage >= 80) return Colors.status.success;
    if (adherencePercentage >= 50) return Colors.status.warning;
    return Colors.status.error;
  };

  return (
    <TouchableOpacity
      className={cn(
        "bg-white rounded-card p-4 min-h-[120px] shadow-sm",
        !isActive && "opacity-60"
      )}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${medicationName} ${dosage}`}
    >
      <View className="flex-1">
        {/* Header with medication name and menu button */}
        <View className="flex-row justify-between items-start mb-1">
          <View className="flex-1 flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-text-primary flex-shrink" numberOfLines={1}>
              {medicationName}
            </Text>
            {!isActive && (
              <View className="bg-gray-200 px-2 py-0.5 rounded-lg">
                <Text className="text-[10px] font-bold text-text-tertiary">INACTIVE</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className="w-10 h-10 justify-center items-center rounded-full"
            onPress={onMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Text className="text-2xl text-text-secondary font-bold">⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Dosage */}
        <Text className="text-base text-text-secondary mb-2">{dosage}</Text>

        {/* Frequency and times */}
        <View className="flex-row items-center mb-4 flex-wrap">
          <Text className="text-base font-medium text-text-primary">{frequency}</Text>
          <Text className="text-base text-text-tertiary mx-2">•</Text>
          <Text className="text-base text-text-secondary flex-shrink">{times.join(', ')}</Text>
        </View>

        {/* Adherence percentage */}
        {adherencePercentage !== undefined && (
          <View className="flex-row items-center gap-4">
            <View className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <View
                style={{
                  width: `${adherencePercentage}%`,
                  backgroundColor: getAdherenceBarColor(),
                }}
                className="h-full rounded"
              />
            </View>
            <Text className={cn("text-sm font-semibold min-w-[40px] text-right", getAdherenceColor())}>
              {adherencePercentage}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
