import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing } from '../constants/theme';
import { DISCLAIMERS } from '../constants/clinical';
import { useSettingsStore } from '../stores/settingsStore';
import OnboardingPersonalInfoScreen from './OnboardingPersonalInfoScreen';
import OnboardingGoalScreen from './OnboardingGoalScreen';

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

    // Save onboarding data to settings (but not onboardingCompleted yet)
    await updateSettings({
      userAge: finalData.age,
      userGender: finalData.gender,
      userWeight: finalData.weight,
      userGoal: finalData.goal,
    });

    // Navigate to PrivacyConsent screen
    navigation.replace('PrivacyConsent');
  };

  const handleSkip = async () => {
    // Skip to PrivacyConsent screen without saving user data
    navigation.replace('PrivacyConsent');
  };

  const handleBack = () => {
    if (currentStep === 'personal-info') {
      setCurrentStep('welcome');
    } else if (currentStep === 'goal') {
      setCurrentStep('personal-info');
    }
  };

  // Render different steps
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

  // Welcome screen
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to MyKencing</Text>
        <Text style={styles.subtitle}>
          Your personal medication and health tracking companion
        </Text>

        <View style={styles.featuresContainer}>
          <FeatureItem
            title="Scan & Understand"
            description="Scan prescriptions and get plain-language medicine guidance"
          />
          <FeatureItem
            title="Never Miss a Dose"
            description="Set reminders and track your medication adherence"
          />
          <FeatureItem
            title="Monitor Your Health"
            description="Log vitals and track trends over time"
          />
          <FeatureItem
            title="Privacy First"
            description="All your health data stays on your device, encrypted and secure"
          />
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerTitle}>Important Notice</Text>
          <Text style={styles.disclaimerText}>{DISCLAIMERS.general}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing, you agree to keep your health data private and understand this app is for
          tracking purposes only.
        </Text>
      </View>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
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
  featuresContainer: {
    marginBottom: Spacing.xl,
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
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xl,
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
