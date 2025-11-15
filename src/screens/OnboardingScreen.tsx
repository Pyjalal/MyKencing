import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { DISCLAIMERS } from '../constants/clinical';
import { useSettingsStore } from '../stores/settingsStore';
import OnboardingPersonalInfoScreen from './OnboardingPersonalInfoScreen';
import OnboardingGoalScreen from './OnboardingGoalScreen';
import { useTranslation } from 'react-i18next';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

type OnboardingStep = 'welcome' | 'personal-info' | 'goal' | 'complete';

type OnboardingData = {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  goal?: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance';
};

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleGetStarted = () => {
    setCurrentStep('personal-info');
  };

  const handlePersonalInfoNext = (data: {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight: number;
  }) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    setCurrentStep('goal');
  };

  const handleGoalNext = async (goal: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance') => {
    const finalData = { ...onboardingData, goal };

    await updateSettings({
      userAge: finalData.age,
      userGender: finalData.gender,
      userWeight: finalData.weight,
      userGoal: finalData.goal,
    });

    navigation.replace('PrivacyConsent');
  };

  const handleSkip = async () => {
    navigation.replace('PrivacyConsent');
  };

  const handleBack = () => {
    if (currentStep === 'personal-info') {
      setCurrentStep('welcome');
    } else if (currentStep === 'goal') {
      setCurrentStep('personal-info');
    }
  };

  if (currentStep === 'personal-info') {
    return (
      <OnboardingPersonalInfoScreen
        onNext={handlePersonalInfoNext}
        onBack={handleBack}
        onSkip={handleSkip}
        initialData={onboardingData}
      />
    );
  }

  if (currentStep === 'goal') {
    return (
      <OnboardingGoalScreen
        onNext={handleGoalNext}
        onBack={handleBack}
        onSkip={handleSkip}
        initialGoal={onboardingData.goal}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>{t('onboarding.welcome_title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.welcome_subtitle')}</Text>
        </View>

        <View style={styles.featuresCard}>
          <FeatureItem
            title={t('onboarding.feature_scan_title')}
            description={t('onboarding.feature_scan_desc')}
          />
          <FeatureItem
            title={t('onboarding.feature_reminders_title')}
            description={t('onboarding.feature_reminders_desc')}
          />
          <FeatureItem
            title={t('onboarding.feature_monitor_title')}
            description={t('onboarding.feature_monitor_desc')}
          />
          <FeatureItem
            title={t('onboarding.feature_privacy_title')}
            description={t('onboarding.feature_privacy_desc')}
          />
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerTitle}>{t('onboarding.important_notice')}</Text>
          <Text style={styles.disclaimerText}>{DISCLAIMERS.general}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>{t('onboarding.get_started')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>{t('onboarding.footer_text')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureBullet} />
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
    marginTop: 6,
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  disclaimerContainer: {
    backgroundColor: Colors.status.warningLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
  },
  disclaimerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  disclaimerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  button: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
  },
});
