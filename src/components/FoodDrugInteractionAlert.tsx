/**
 * FoodDrugInteractionAlert Component
 * Displays food-drug interaction warnings
 * Specifications from Figma:
 * - Size: 377x155px
 * - Yellow/warning theme
 * - Informational style (less critical than drug-drug)
 * - Clear recommendations
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export interface FoodInteraction {
  id: string;
  drug: {
    id: string;
    name: string;
  };
  foodItem: string;
  riskDescription: string;
  recommendation: string;
  severity: 'medium' | 'low';
}

interface FoodDrugInteractionAlertProps {
  interaction: FoodInteraction;
  containerClassName?: string;
}

export default function FoodDrugInteractionAlert({
  interaction,
  containerClassName,
}: FoodDrugInteractionAlertProps) {
  const { t } = useTranslation();
  return (
    <View
      className={cn(
        'bg-white rounded-[20px] p-5 shadow-md',
        containerClassName
      )}
      style={{ minHeight: 155 }}
      accessibilityRole="alert"
      accessibilityLabel={`Food interaction: ${interaction.riskDescription}`}
    >
      {/* Interaction Title */}
      <Text className="text-2xl font-semibold text-warning text-center mb-3">
        {interaction.riskDescription}
      </Text>

      {/* Recommendation Label */}
      <Text className="text-[15px] font-medium text-text-primary text-center mb-1">
        {t('drug_interaction.recommendation')}
      </Text>

      {/* Recommendation Text */}
      <Text className="text-[15px] font-medium text-text-primary text-center">
        {interaction.recommendation}
      </Text>
    </View>
  );
}
