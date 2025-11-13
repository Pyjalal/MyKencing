import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { RiskScoreResult } from '../utils/riskScores';

interface RiskScoreTrendCardProps {
  title: string;
  trendLabel: string;
  averageLabel: string;
  color: string;
  latestPercent: number | null;
  averagePercent: number | null;
  percentages: number[];
  category: RiskScoreResult['category'];
  description: string;
}

export default function RiskScoreTrendCard({
  title,
  trendLabel,
  averageLabel,
  color,
  latestPercent,
  averagePercent,
  percentages,
  category,
  description,
}: RiskScoreTrendCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={[styles.circleOuter, { borderColor: color }]}>        
        <Text style={styles.circleValue}>{formatPercent(latestPercent)}</Text>
      </View>

      <Text style={styles.trendLabel}>{trendLabel}</Text>

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

      <Text style={styles.averageLabel}>{averageLabel}</Text>
      <Text style={[styles.averageValue, { color }]}>{formatPercent(averagePercent)}</Text>

      <View style={[styles.categoryPill, { backgroundColor: color }]}>
        <Text style={styles.categoryPillText}>{formatCategory(category)}</Text>
      </View>

      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return '--';
  return `${value.toFixed(1)}%`;
}

function formatCategory(category: RiskScoreResult['category']): string {
  switch (category) {
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'high':
      return 'High';
    case 'very_high':
      return 'Very High';
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
