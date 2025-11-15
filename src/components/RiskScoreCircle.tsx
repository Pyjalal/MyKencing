import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Colors, Spacing } from '../constants/theme';
import { RiskScoreResult } from '../utils/riskScores';

interface RiskScoreCircleProps {
  result: RiskScoreResult;
  style?: StyleProp<ViewStyle>;
}

export default function RiskScoreCircle({ result, style }: RiskScoreCircleProps) {
  const { t } = useTranslation();
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.circle, { backgroundColor: result.color }]}>
        <Text style={styles.score}>{Math.round(result.score)}</Text>
        {result.maxScore !== undefined && (
          <Text style={styles.ofText}>/{result.maxScore}</Text>
        )}
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{result.label}</Text>
        <Text style={styles.category}>{formatCategory(result.category, t)}</Text>
        <Text style={styles.description}>{t(`risk_calculators.${result.description}`)}</Text>
      </View>
    </View>
  );
}

function formatCategory(category: RiskScoreResult['category'], t: (key: string) => string): string {
  switch (category) {
    case 'low':
      return t('risk_calculators.low_risk_level');
    case 'moderate':
      return t('risk_calculators.moderate_risk_level');
    case 'high':
      return t('risk_calculators.high_risk_level');
    case 'very_high':
      return t('risk_calculators.very_high_risk_level');
    default:
      return category;
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  score: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  ofText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    marginTop: 2,
  },
  label: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    color: Colors.text.primary,
  },
  category: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});

