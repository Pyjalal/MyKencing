import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../constants/theme';

interface OnboardingGoalScreenProps {
  onNext: (goal: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance') => void;
  onBack: () => void;
  onSkip: () => void;
  initialGoal?: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance';
}

type GoalOption = {
  id: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance';
  title: string;
  icon: string;
};

const GOALS: GoalOption[] = [
  { id: 'get_fit', title: 'Get fit', icon: '💪' },
  { id: 'be_active', title: 'Be active', icon: '❤️' },
  { id: 'be_healthy', title: 'Be healthy', icon: '🩺' },
  { id: 'find_balance', title: 'Find balance', icon: '⚖️' },
];

export default function OnboardingGoalScreen({
  onNext,
  onBack,
  onSkip,
  initialGoal,
}: OnboardingGoalScreenProps) {
  const [selectedGoal, setSelectedGoal] = useState<
    'get_fit' | 'be_active' | 'be_healthy' | 'find_balance' | null
  >(initialGoal || null);

  const handleNext = () => {
    if (selectedGoal) {
      onNext(selectedGoal);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarFill} />
        </View>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>What's your main goal?</Text>

        {/* Goal Cards Grid */}
        <View style={styles.goalsGrid}>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selectedGoal === goal.id && styles.goalCardSelected,
              ]}
              onPress={() => setSelectedGoal(goal.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text
                style={[
                  styles.goalTitle,
                  selectedGoal === goal.id && styles.goalTitleSelected,
                ]}
              >
                {goal.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, !selectedGoal && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedGoal}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.primary,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral[300],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '66%',
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 3,
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl + Spacing.md,
    lineHeight: 40,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  goalCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary[100],
  },
  goalIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  goalTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  goalTitleSelected: {
    color: Colors.primary.main,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl + Spacing.lg,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 40,
    height: 6,
    backgroundColor: Colors.neutral[300],
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: Colors.primary.main,
  },
  nextButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 28,
    paddingVertical: Spacing.lg + 4,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  nextButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
});
