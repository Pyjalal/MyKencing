import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Colors, Spacing, Shadows } from '../constants/theme';
import { RiskScoreResult } from '../utils/riskScores';

interface RiskScoreCircleProps {
  result: RiskScoreResult;
}

export default function RiskScoreCircle({ result }: RiskScoreCircleProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: result.color }]}>
        <Text style={styles.score}>{Math.round(result.score)}</Text>
        {result.maxScore && (
          <Text style={styles.ofText}>/ {result.maxScore}</Text>
        )}
      </View>
      <Text style={styles.label}>{result.label}</Text>
      <Text style={styles.category}>{formatCategory(result.category)}</Text>
      <Text style={styles.description}>{result.description}</Text>
    </View>
  );
}

function formatCategory(category: RiskScoreResult['category']): string {
  switch (category) {
    case 'low':
      return 'Low risk';
    case 'moderate':
      return 'Moderate risk';
    case 'high':
      return 'High risk';
    case 'very_high':
      return 'Very high risk';
    default:
      return category;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: 18,
    ...Shadows.sm,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  score: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  ofText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.contrast,
  },
  label: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  category: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

