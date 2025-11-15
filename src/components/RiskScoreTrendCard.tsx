import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { RiskScoreResult } from '../utils/riskScores';

interface RiskScoreTrendCardProps {
  title: string;
  trendLabel: string;
  averageLabel: string;
  color: string;
  percentages: number[];
  latestScore: number | null;
  averageScore: number | null;
  maxScore?: number;
  category: RiskScoreResult['category'];
  description: string;
}

export default function RiskScoreTrendCard({
  title,
  trendLabel,
  averageLabel,
  color,
  latestScore,
  averageScore,
  maxScore,
  percentages,
  category,
  description,
}: RiskScoreTrendCardProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t(title)}</Text>

      <View style={[styles.circleOuter, { borderColor: color }]}>        
        <Text style={styles.circleValue}>{formatScore(latestScore)}</Text>
        {maxScore !== undefined && maxScore !== null && (
          <Text style={styles.circleMax}>/ {maxScore}</Text>
        )}
      </View>

      <Text style={styles.trendLabel}>{t(trendLabel)}</Text>

      {percentages.length ? (
        <View style={styles.trendBars}>
          {percentages.map((value, index) => (
            <View
              key={`${title}-trend-${index}`}
              style={[
                styles.trendBar,
                {
                  height: Math.max((value / 100) * 72, 8),
                  backgroundColor: color,
                },
              ]}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.placeholderText}>--</Text>
      )}

      <Text style={styles.averageLabel}>{t(averageLabel)}</Text>
      <Text style={[styles.averageValue, { color }]}>
        {formatScore(averageScore)}
        {maxScore !== undefined && maxScore !== null ? ` / ${maxScore}` : ''}
      </Text>

      <View style={[styles.categoryPill, { backgroundColor: color }]}>
        <Text style={styles.categoryPillText}>{formatCategory(category, t)}</Text>
      </View>

      <Text style={styles.description}>{t(`risk_calculators.${description}`)}</Text>
    </View>
  );
}

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) return '--';
  return value % 1 === 0 ? `${value}` : value.toFixed(1);
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
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    gap: Spacing.sm,
    width: '100%',
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  circleOuter: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 6,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },
  circleValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  circleMax: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  trendLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginVertical: Spacing.sm,
  },
  trendBar: {
    flex: 1,
    borderRadius: BorderRadius.sm,
  },
  placeholderText: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.sm,
    marginVertical: Spacing.md,
  },
  averageLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  averageValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  categoryPill: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    marginTop: Spacing.xs,
  },
  categoryPillText: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.sm,
  },
  description: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
  },
});
