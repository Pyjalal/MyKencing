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
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../constants/theme';

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
  containerStyle?: StyleProp<ViewStyle>;
}

export default function DrugDrugInteractionAlert({
  interaction,
  onDrugPress,
  containerStyle,
}: DrugDrugInteractionAlertProps) {
  const handleDrug1Press = () => {
    onDrugPress?.(interaction.drug1.id);
  };

  const handleDrug2Press = () => {
    onDrugPress?.(interaction.drug2.id);
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      accessibilityRole="alert"
      accessibilityLabel={`Drug interaction warning: ${interaction.drug1.name} and ${interaction.drug2.name}`}
    >
      <Text style={styles.title}>
        Possible interactions detected
      </Text>

      <TouchableOpacity
        onPress={handleDrug1Press}
        style={styles.drugButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${interaction.drug1.name}`}
      >
        <Text style={styles.drugButtonText}>
          {interaction.drug1.name}
        </Text>
      </TouchableOpacity>

      <Text style={styles.plus}>+</Text>

      <TouchableOpacity
        onPress={handleDrug2Press}
        style={styles.drugButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${interaction.drug2.name}`}
      >
        <Text style={styles.drugButtonText}>
          {interaction.drug2.name}
        </Text>
      </TouchableOpacity>

      <View style={styles.riskContainer}>
        <Text style={styles.riskLabel}>
          Risk:
        </Text>
        <Text style={styles.riskText}>
          {interaction.riskDescription}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.cardPadding,
    minHeight: 252,
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.status.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  drugButton: {
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    ...Shadows.sm,
  },
  drugButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
    textAlign: 'center',
  },
  plus: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  riskContainer: {
    marginTop: Spacing.sm,
  },
  riskLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  riskText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  }
});
