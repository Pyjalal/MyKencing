import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Shadows } from '../constants/theme';
import { useTranslation } from 'react-i18next';

interface OnboardingGoalScreenProps {
  onNext: (goal: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance') => void;
  onBack: () => void;
  onSkip: () => void;
  initialGoal?: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance';
}

type GoalOption = {
  id: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance';
  titleKey: string;
  subtitleKey: string;
  icon: string;
};

export default function OnboardingGoalScreen({
  onNext,
  onBack,
  onSkip,
  initialGoal,
}: OnboardingGoalScreenProps) {
  const { t } = useTranslation();
  const GOALS: GoalOption[] = [
    { id: 'get_fit', titleKey: 'onboarding.get_fit', subtitleKey: 'onboarding.get_fit_desc', icon: '💪' },
    { id: 'be_active', titleKey: 'onboarding.be_active', subtitleKey: 'onboarding.be_active_desc', icon: '🏃' },
    { id: 'be_healthy', titleKey: 'onboarding.be_healthy', subtitleKey: 'onboarding.be_healthy_desc', icon: '🍎' },
    { id: 'find_balance', titleKey: 'onboarding.find_balance', subtitleKey: 'onboarding.find_balance_desc', icon: '🧘' },
  ];
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
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{t('onboarding.whats_your_main_goal')}</Text>

        <View style={styles.goalsList}>
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
              <View style={styles.goalTextContainer}>
                <Text
                  style={[
                    styles.goalTitle,
                    selectedGoal === goal.id && styles.goalTitleSelected,
                  ]}
                >
                  {t(goal.titleKey)}
                </Text>
                <Text style={styles.goalSubtitle}>{t(goal.subtitleKey)}</Text>
              </View>
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
          <Text style={styles.nextButtonText}>{t('onboarding.next')}</Text>
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
  goalsList: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  goalCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.background.card,
    ...Shadows.sm,
  },
  goalCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary[50],
  },
  goalIcon: {
    fontSize: 28,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  goalTitleSelected: {
    color: Colors.primary.main,
  },
  goalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
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
