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
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../constants/theme';

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
  containerStyle?: StyleProp<ViewStyle>;
}

export default function FoodDrugInteractionAlert({
  interaction,
  containerStyle,
}: FoodDrugInteractionAlertProps) {
  return (
    <View
      style={[styles.container, containerStyle]}
      accessibilityRole="alert"
      accessibilityLabel={`Food interaction: ${interaction.riskDescription}`}
    >
      <Text style={styles.title}>
        {interaction.riskDescription}
      </Text>

      <Text style={styles.label}>
        Recommendation:
      </Text>

      <Text style={styles.recommendation}>
        {interaction.recommendation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.cardPadding,
    minHeight: 155,
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent.main,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  recommendation: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
