/**
 * DrugDrugInteractionAlert Component
 * Displays critical drug-drug interaction warnings
 * Specifications from Figma:
 * - Size: 377x252px
 * - Red theme for critical alerts
 * - Drug buttons with pill shape
 * - Severity-based styling
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../lib/utils';

export interface DrugInteraction {
  id: string;
  drug1: {
    id: string;
    name: string;
  };
  drug2: {
    id: string;
    name: string;
  };
  riskDescription: string;
  severity: 'high' | 'medium' | 'low';
}

interface DrugDrugInteractionAlertProps {
  interaction: DrugInteraction;
  onDrugPress?: (drugId: string) => void;
  containerClassName?: string;
}

export default function DrugDrugInteractionAlert({
  interaction,
  onDrugPress,
  containerClassName,
}: DrugDrugInteractionAlertProps) {
  const handleDrug1Press = () => {
    onDrugPress?.(interaction.drug1.id);
  };

  const handleDrug2Press = () => {
    onDrugPress?.(interaction.drug2.id);
  };

  return (
    <View
      className={cn(
        'bg-white rounded-[20px] p-5 shadow-md',
        containerClassName
      )}
      style={{ minHeight: 252 }}
      accessibilityRole="alert"
      accessibilityLabel={`Drug interaction warning: ${interaction.drug1.name} and ${interaction.drug2.name}`}
    >
      {/* Warning Title */}
      <Text className="text-2xl font-semibold text-error text-center mb-4">
        Possible interactions detected
      </Text>

      {/* Drug 1 Button */}
      <TouchableOpacity
        onPress={handleDrug1Press}
        className="bg-error rounded-[50px] py-2 px-6 mb-3 shadow-sm"
        style={{ minHeight: 38 }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${interaction.drug1.name}`}
      >
        <Text className="text-2xl font-semibold text-white text-center">
          {interaction.drug1.name}
        </Text>
      </TouchableOpacity>

      {/* Plus Separator */}
      <Text className="text-2xl font-medium text-text-primary text-center mb-3">
        +
      </Text>

      {/* Drug 2 Button */}
      <TouchableOpacity
        onPress={handleDrug2Press}
        className="bg-error rounded-[50px] py-2 px-6 mb-4 shadow-sm"
        style={{ minHeight: 38 }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${interaction.drug2.name}`}
      >
        <Text className="text-2xl font-semibold text-white text-center">
          {interaction.drug2.name}
        </Text>
      </TouchableOpacity>

      {/* Risk Description */}
      <View className="mt-2">
        <Text className="text-[15px] font-medium text-text-primary text-center mb-1">
          Risk:
        </Text>
        <Text className="text-[15px] font-medium text-text-primary text-center">
          {interaction.riskDescription}
        </Text>
      </View>
    </View>
  );
}
