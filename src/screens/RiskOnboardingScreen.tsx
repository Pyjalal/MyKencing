import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { RootStackParamList, RiskFactorSettings } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

type StepId =
  | 'gender'
  | 'age'
  | 'bpMedication'
  | 'historyHighGlucose'
  | 'smoking'
  | 'physicalActivity'
  | 'familyHistory';

type ChoiceValue = 'male' | 'female' | boolean | 'none' | 'extended' | 'immediate';

type ChoiceStep = {
  id: Exclude<StepId, 'age'>;
  type: 'choice';
  title: string;
  prompt: string;
  helper?: string;
  options: Array<{ value: ChoiceValue; label: string; description?: string }>;
};

type InputStep = {
  id: 'age';
  type: 'input';
  title: string;
  prompt: string;
  helper?: string;
  placeholder: string;
};

type RiskQuestionStep = ChoiceStep | InputStep;

const BASE_RISK_FACTORS: RiskFactorSettings = {
  ageHighRisk: false,
  genderHighRisk: false,
  smoking: false,
  bpMedication: false,
  bmiHighRisk: false,
  historyHighGlucose: false,
  physicalActivity: true,
  vegetablesDaily: true,
  familyHistory: 'none',
  weightKg: null,
  heightCm: null,
};

type OnboardingAnswers = {
  gender?: 'male' | 'female';
  age?: number;
  bpMedication?: boolean;
  historyHighGlucose?: boolean;
  smoking?: boolean;
  physicalActivity?: boolean;
  familyHistory?: 'none' | 'extended' | 'immediate';
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RiskOnboarding'>;

export default function RiskOnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const steps: RiskQuestionStep[] = useMemo(
    () => [
      {
        id: 'gender',
        type: 'choice',
        title: t('risk_onboarding.about_title', 'Tell us about yourself'),
        prompt: t('risk_onboarding.gender_prompt', 'What is your biological sex?'),
        helper: t(
          'risk_onboarding.gender_helper',
          'Choose your biological sex for accurate calculations.'
        ),
        options: [
          { value: 'male', label: t('risk_onboarding.male', 'Male') },
          { value: 'female', label: t('risk_onboarding.female', 'Female') },
        ],
      },
      {
        id: 'age',
        type: 'input',
        title: t('risk_onboarding.about_title', 'Tell us about yourself'),
        prompt: t('risk_onboarding.age_prompt', 'How old are you?'),
        helper: t(
          'risk_onboarding.age_helper',
          'Younger than 45? You are likely in the low-risk range.'
        ),
        placeholder: t('risk_onboarding.age_placeholder', 'Enter your age'),
      },
      {
        id: 'bpMedication',
        type: 'choice',
        title: t('risk_onboarding.bp_title', 'Blood pressure care'),
        prompt: t('risk_onboarding.bp_prompt', 'Are you currently taking BP medication?'),
        helper: t('risk_onboarding.bp_helper', 'Medication history helps us fine-tune your risk.'),
        options: [
          { value: true, label: t('common.yes', 'Yes') },
          { value: false, label: t('common.no', 'No') },
        ],
      },
      {
        id: 'historyHighGlucose',
        type: 'choice',
        title: t('risk_onboarding.glucose_title', 'Blood sugar history'),
        prompt: t(
          'risk_onboarding.glucose_prompt',
          'Have you ever been told you have high blood glucose?'
        ),
        helper: t(
          'risk_onboarding.glucose_helper',
          'Prior diagnoses help us personalize your monitoring plan.'
        ),
        options: [
          { value: true, label: t('common.yes', 'Yes') },
          { value: false, label: t('common.no', 'No') },
        ],
      },
      {
        id: 'smoking',
        type: 'choice',
        title: t('risk_onboarding.smoking_title', 'Lifestyle choices'),
        prompt: t('risk_onboarding.smoking_prompt', 'Do you currently smoke?'),
        helper: t(
          'risk_onboarding.smoking_helper',
          'We use this to highlight lifestyle tips just for you.'
        ),
        options: [
          { value: true, label: t('common.yes', 'Yes') },
          { value: false, label: t('common.no', 'No') },
        ],
      },
      {
        id: 'physicalActivity',
        type: 'choice',
        title: t('risk_onboarding.activity_title', 'Movement matters'),
        prompt: t(
          'risk_onboarding.activity_prompt',
          'Do you get at least 4 hours of physical activity per week?'
        ),
        helper: t(
          'risk_onboarding.activity_helper',
          'Staying active helps lower your long-term risk.'
        ),
        options: [
          { value: true, label: t('risk_onboarding.activity_yes', 'Yes, I do') },
          { value: false, label: t('risk_onboarding.activity_no', 'Not yet') },
        ],
      },
      {
        id: 'familyHistory',
        type: 'choice',
        title: t('risk_onboarding.family_title', 'Family history'),
        prompt: t(
          'risk_onboarding.family_prompt',
          'Does anyone in your family have diabetes?'
        ),
        helper: t(
          'risk_onboarding.family_helper',
          'Immediate family raises risk more than extended relatives.'
        ),
        options: [
          { value: 'none', label: t('risk.family_none', 'None') },
          { value: 'extended', label: t('risk.family_extended', 'Extended family') },
          { value: 'immediate', label: t('risk.family_immediate', 'Immediate family') },
        ],
      },
    ],
    [t]
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() =>
    settings.riskQuestionnaireCompleted
      ? {
          gender:
            settings.userGender === 'male' || settings.userGender === 'female'
              ? settings.userGender
              : undefined,
          age: settings.userAge,
          bpMedication: settings.riskFactors?.bpMedication,
          historyHighGlucose: settings.riskFactors?.historyHighGlucose,
          smoking: settings.riskFactors?.smoking,
          physicalActivity: settings.riskFactors?.physicalActivity,
          familyHistory: settings.riskFactors?.familyHistory,
        }
      : {}
  );
  const [ageInput, setAgeInput] = useState(() =>
    settings.riskQuestionnaireCompleted && settings.userAge ? String(settings.userAge) : ''
  );

  useEffect(() => {
    if (settings.riskQuestionnaireCompleted) {
      navigation.replace('HealthProfile');
    }
  }, [navigation, settings.riskQuestionnaireCompleted]);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleSelect = (stepId: StepId, value: ChoiceValue) => {
    setAnswers((prev) => ({
      ...prev,
      [stepId]: value,
    }));
  };

  const handleAgeChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setAgeInput(digitsOnly);
    const numeric = Number(digitsOnly);
    if (!Number.isNaN(numeric) && digitsOnly.length > 0) {
      setAnswers((prev) => ({ ...prev, age: numeric }));
    } else {
      setAnswers((prev) => ({ ...prev, age: undefined }));
    }
  };

  const isCurrentStepComplete = () => {
    if (currentStep.type === 'input') {
      return typeof answers.age === 'number' && answers.age >= 10 && answers.age <= 120;
    }

    const value = (answers as any)[currentStep.id];
    return value !== undefined && value !== null && value !== '';
  };

  const goToPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleNext = async () => {
    if (!isCurrentStepComplete()) return;
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((index) => Math.min(index + 1, totalSteps - 1));
      return;
    }

    const updatedRiskFactors: RiskFactorSettings = {
      ...BASE_RISK_FACTORS,
      ...(settings.riskFactors || {}),
      ageHighRisk: (answers.age ?? 0) >= 45,
      genderHighRisk: answers.gender === 'male',
      bpMedication: !!answers.bpMedication,
      historyHighGlucose: !!answers.historyHighGlucose,
      smoking: !!answers.smoking,
      physicalActivity: !!answers.physicalActivity,
      familyHistory: answers.familyHistory ?? 'none',
    };

    await updateSettings({
      userAge: answers.age,
      userGender: answers.gender,
      riskFactors: updatedRiskFactors,
      riskQuestionnaireCompleted: true,
    });

    navigation.reset({
      index: 0,
      routes: [{ name: 'HealthProfile' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={goToPrevious}>
              <Text style={styles.backIcon}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>
                {t('risk_onboarding.header_title', 'Framingham Heart Disease Risk')}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepPrompt}>{currentStep.prompt}</Text>
            {currentStep.type === 'choice' ? (
              <View style={styles.optionsGroup}>
                {currentStep.options.map((option) => {
                  const selected =
                    (answers as any)[currentStep.id] !== undefined &&
                    (answers as any)[currentStep.id] === option.value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[
                        styles.optionCard,
                        selected && styles.optionCardSelected,
                      ]}
                      onPress={() => handleSelect(currentStep.id, option.value)}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          selected && styles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.inputCard}>
                <TextInput
                  value={ageInput}
                  onChangeText={handleAgeChange}
                  keyboardType="number-pad"
                  placeholder={currentStep.placeholder}
                  placeholderTextColor={Colors.text.secondary}
                  maxLength={3}
                  style={styles.ageInput}
                />
              </View>
            )}
            {currentStep.helper && (
              <Text style={styles.helperText}>{currentStep.helper}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.nextButton,
              !isCurrentStepComplete() && styles.nextButtonDisabled,
            ]}
            disabled={!isCurrentStepComplete()}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonLabel}>
              {currentStepIndex === totalSteps - 1
                ? t('risk_onboarding.finish', 'Finish')
                : t('common.next', 'Next')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  backIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2F5DA3',
  },
  stepContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing['2xl'],
    alignItems: 'stretch',
    ...Shadows.md,
  },
  stepTitle: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepPrompt: {
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  optionsGroup: {
    gap: Spacing.md,
  },
  optionCard: {
    borderRadius: BorderRadius['3xl'],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#F5F7FF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: 'rgba(74, 143, 189, 0.12)',
  },
  optionLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  optionLabelSelected: {
    color: Colors.primary.dark,
  },
  optionDescription: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  inputCard: {
    borderRadius: BorderRadius['3xl'],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: '#F5F7FF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ageInput: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  helperText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  nextButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonLabel: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
});
