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
  | 'waistCircumference'
  | 'bpMedication'
  | 'historyHighGlucose'
  | 'smoking'
  | 'physicalActivity'
  | 'vegetablesDaily'
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
  id: 'age' | 'waistCircumference';
  type: 'input';
  title: string;
  prompt: string;
  helper?: string;
  placeholder: string;
  min: number;
  max: number;
  suffix?: string;
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
  waistCircumference?: number;
  bpMedication?: boolean;
  historyHighGlucose?: boolean;
  smoking?: boolean;
  physicalActivity?: boolean;
  vegetablesDaily?: boolean;
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
        title: t('risk_onboarding.about_title'),
        prompt: t('risk_onboarding.gender_prompt'),
        helper: t('risk_onboarding.gender_helper'),
        options: [
          { value: 'male', label: t('risk_onboarding.male') },
          { value: 'female', label: t('risk_onboarding.female') },
        ],
      },
      {
        id: 'age',
        type: 'input',
        title: t('risk_onboarding.about_title'),
        prompt: t('risk_onboarding.age_prompt'),
        helper: t('risk_onboarding.age_helper'),
        placeholder: t('risk_onboarding.age_placeholder'),
        min: 10,
        max: 120,
      },
      {
        id: 'waistCircumference',
        type: 'input',
        title: t('risk_onboarding.waist_title'),
        prompt: t('risk_onboarding.waist_prompt'),
        helper: t('risk_onboarding.waist_helper'),
        placeholder: t('risk_onboarding.waist_placeholder'),
        min: 40,
        max: 200,
        suffix: 'cm',
      },
      {
        id: 'bpMedication',
        type: 'choice',
        title: t('risk_onboarding.bp_title'),
        prompt: t('risk_onboarding.bp_prompt'),
        helper: t('risk_onboarding.bp_helper'),
        options: [
          { value: true, label: t('common.yes') },
          { value: false, label: t('common.no') },
        ],
      },
      {
        id: 'historyHighGlucose',
        type: 'choice',
        title: t('risk_onboarding.glucose_title'),
        prompt: t('risk_onboarding.glucose_prompt'),
        helper: t('risk_onboarding.glucose_helper'),
        options: [
          { value: true, label: t('common.yes') },
          { value: false, label: t('common.no') },
        ],
      },
      {
        id: 'smoking',
        type: 'choice',
        title: t('risk_onboarding.smoking_title'),
        prompt: t('risk_onboarding.smoking_prompt'),
        helper: t('risk_onboarding.smoking_helper'),
        options: [
          { value: true, label: t('common.yes') },
          { value: false, label: t('common.no') },
        ],
      },
      {
        id: 'physicalActivity',
        type: 'choice',
        title: t('risk_onboarding.activity_title'),
        prompt: t('risk_onboarding.activity_prompt'),
        helper: t('risk_onboarding.activity_helper'),
        options: [
          { value: true, label: t('risk_onboarding.activity_yes') },
          { value: false, label: t('risk_onboarding.activity_no') },
        ],
      },
      {
        id: 'vegetablesDaily',
        type: 'choice',
        title: t('risk_onboarding.vegetables_title'),
        prompt: t('risk_onboarding.vegetables_prompt'),
        helper: t('risk_onboarding.vegetables_helper'),
        options: [
          { value: true, label: t('risk_onboarding.vegetables_yes') },
          { value: false, label: t('risk_onboarding.vegetables_no') },
        ],
      },
      {
        id: 'familyHistory',
        type: 'choice',
        title: t('risk_onboarding.family_title'),
        prompt: t('risk_onboarding.family_prompt'),
        helper: t('risk_onboarding.family_helper'),
        options: [
          { value: 'none', label: t('risk.family_none') },
          { value: 'extended', label: t('risk.family_extended') },
          { value: 'immediate', label: t('risk.family_immediate') },
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
          waistCircumference: settings.riskFactors?.waistCircumference ?? undefined,
          bpMedication: settings.riskFactors?.bpMedication,
          historyHighGlucose: settings.riskFactors?.historyHighGlucose,
          smoking: settings.riskFactors?.smoking,
          physicalActivity: settings.riskFactors?.physicalActivity,
          vegetablesDaily: settings.riskFactors?.vegetablesDaily,
          familyHistory: settings.riskFactors?.familyHistory,
        }
      : {}
  );
  const [ageInput, setAgeInput] = useState(() =>
    settings.riskQuestionnaireCompleted && settings.userAge ? String(settings.userAge) : ''
  );
  const [waistInput, setWaistInput] = useState(() =>
    settings.riskQuestionnaireCompleted && settings.riskFactors?.waistCircumference
      ? String(settings.riskFactors.waistCircumference)
      : ''
  );

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleSelect = (stepId: StepId, value: ChoiceValue) => {
    setAnswers((prev) => ({
      ...prev,
      [stepId]: value,
    }));
  };

  const handleNumericInputChange = (stepId: 'age' | 'waistCircumference', value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (stepId === 'age') {
      setAgeInput(digitsOnly);
    } else {
      setWaistInput(digitsOnly);
    }
    const numeric = Number(digitsOnly);
    if (!Number.isNaN(numeric) && digitsOnly.length > 0) {
      setAnswers((prev) => ({ ...prev, [stepId]: numeric }));
    } else {
      setAnswers((prev) => ({ ...prev, [stepId]: undefined }));
    }
  };

  const isCurrentStepComplete = () => {
    if (currentStep.type === 'input') {
      const value =
        currentStep.id === 'age' ? answers.age : answers.waistCircumference;
      if (typeof value !== 'number') return false;
      return value >= currentStep.min && value <= currentStep.max;
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
       vegetablesDaily: answers.vegetablesDaily ?? true,
      familyHistory: answers.familyHistory ?? 'none',
      waistCircumference: answers.waistCircumference ?? null,
    };

    await updateSettings({
      userAge: answers.age,
      userGender: answers.gender,
      riskFactors: updatedRiskFactors,
      riskQuestionnaireCompleted: true,
    });

    // Reset navigation stack to include Home before HealthProfile
    // This ensures the native back button appears
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home', params: { screen: 'VitalsTab' } },
        { name: 'HealthProfile' },
      ],
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
                {t('risk_onboarding.header_title')}
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
                  value={currentStep.id === 'age' ? ageInput : waistInput}
                  onChangeText={(text) => handleNumericInputChange(currentStep.id, text)}
                  keyboardType="number-pad"
                  placeholder={currentStep.placeholder}
                  placeholderTextColor={Colors.text.secondary}
                  maxLength={3}
                  style={styles.ageInput}
                />
                {currentStep.suffix && (
                  <Text style={styles.inputSuffix}>{currentStep.suffix}</Text>
                )}
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
                ? t('risk_onboarding.finish')
                : t('common.next')}
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
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageInput: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  inputSuffix: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginLeft: Spacing.md,
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
