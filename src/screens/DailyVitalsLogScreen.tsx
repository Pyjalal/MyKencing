import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useVitalsStore } from '../stores/vitalsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const STEPS = ['bp', 'weight', 'glucose', 'cholesterol'] as const;
type StepKey = (typeof STEPS)[number];

const STEP_TITLES: Record<StepKey, string> = {
  bp: 'daily_vitals.bp_title',
  weight: 'daily_vitals.weight_title',
  glucose: 'daily_vitals.glucose_title',
  cholesterol: 'daily_vitals.cholesterol_title',
};

const STEP_DESCRIPTIONS: Record<StepKey, string> = {
  bp: 'daily_vitals.bp_desc',
  weight: 'daily_vitals.weight_desc',
  glucose: 'daily_vitals.glucose_desc',
  cholesterol: 'daily_vitals.cholesterol_desc',
};

const FIELD_CONFIG: Record<StepKey, { key: keyof DailyVitalsForm; placeholder: string; min: number; max: number }[]> = {
  bp: [
    { key: 'systolic', placeholder: '120', min: 80, max: 220 },
    { key: 'diastolic', placeholder: '80', min: 40, max: 140 },
  ],
  weight: [
    { key: 'weight', placeholder: '70', min: 30, max: 250 },
    { key: 'height', placeholder: '170', min: 100, max: 230 },
  ],
  glucose: [{ key: 'glucose', placeholder: '5.5', min: 3, max: 30 }],
  cholesterol: [
    { key: 'totalCholesterol', placeholder: '4.5', min: 2, max: 12 },
    { key: 'hdlCholesterol', placeholder: '1.2', min: 0.5, max: 4 },
  ],
};

interface DailyVitalsForm {
  systolic: string;
  diastolic: string;
  weight: string;
  height: string;
  glucose: string;
  totalCholesterol: string;
  hdlCholesterol: string;
}

const INITIAL_FORM: DailyVitalsForm = {
  systolic: '',
  diastolic: '',
  weight: '',
  height: '',
  glucose: '',
  totalCholesterol: '',
  hdlCholesterol: '',
};

export default function DailyVitalsLogScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    addBloodPressure,
    addWeight,
    addGlucose,
    addTotalCholesterol,
    addHdlCholesterol,
  } = useVitalsStore();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const [form, setForm] = useState<DailyVitalsForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = STEPS[stepIndex];
  const progress = (stepIndex + 1) / STEPS.length;

  const unitLabels = useMemo(() => ({
    weight: settings.weightUnit === 'lb' ? 'lb' : 'kg',
    glucose: settings.glucoseUnit === 'mg/dL' ? 'mg/dL' : 'mmol/L',
  }), [settings.glucoseUnit, settings.weightUnit]);

  const setField = (key: keyof DailyVitalsForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateStep = (): boolean => {
    const config = FIELD_CONFIG[currentStep];
    const newErrors: Record<string, string> = {};

    config.forEach(({ key, min, max }) => {
      const raw = form[key];
      const value = Number(raw);
      if (!raw.trim()) {
        newErrors[key] = t('daily_vitals.required', 'This field is required');
      } else if (Number.isNaN(value) || value < min || value > max) {
        newErrors[key] = t('daily_vitals.range', 'Enter a value between {{min}} and {{max}}', { min, max });
      }
    });

    if (currentStep === 'bp' && !newErrors.systolic && !newErrors.diastolic) {
      if (Number(form.systolic) <= Number(form.diastolic)) {
        newErrors.diastolic = t('daily_vitals.bp_error', 'Systolic must be higher than diastolic');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await addBloodPressure(Number(form.systolic), Number(form.diastolic));
      await addWeight(Number(form.weight), 'kg');
      await addGlucose(Number(form.glucose), unitLabels.glucose === 'mg/dL' ? 'mg/dL' : 'mmol/L');
      await addTotalCholesterol(Number(form.totalCholesterol));
      await addHdlCholesterol(Number(form.hdlCholesterol));
      if (form.height.trim()) {
        await updateSettings({
          riskFactors: {
            ...settings.riskFactors,
            heightCm: Number(form.height),
          },
        });
      }
      navigation.replace('Vitals');
    } catch (error) {
      console.error('DailyVitalsLogScreen: Error saving vitals', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      navigation.goBack();
    } else {
      setStepIndex((prev) => prev - 1);
    }
  };

  const fieldUnits: Record<keyof DailyVitalsForm, string> = {
    systolic: 'mmHg',
    diastolic: 'mmHg',
    weight: 'kg',
    height: 'cm',
    glucose: unitLabels.glucose,
    totalCholesterol: 'mmol/L',
    hdlCholesterol: 'mmol/L',
  };

  const fieldLabels: Record<keyof DailyVitalsForm, string> = {
    systolic: t('daily_vitals.systolic', 'Systolic'),
    diastolic: t('daily_vitals.diastolic', 'Diastolic'),
    weight: t('daily_vitals.weight', 'Weight'),
    height: t('daily_vitals.height', 'Height'),
    glucose: t('daily_vitals.glucose_label', 'Blood glucose'),
    totalCholesterol: t('daily_vitals.total_cholesterol', 'Total cholesterol'),
    hdlCholesterol: t('daily_vitals.hdl_cholesterol', 'HDL cholesterol'),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('daily_vitals.title', 'Log today’s vitals')}</Text>
        <Text style={styles.progressLabel}>
          {t('daily_vitals.step', 'Step {{current}} of {{total}}', { current: stepIndex + 1, total: STEPS.length })}
        </Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTitle}>{t(STEP_TITLES[currentStep])}</Text>
        <Text style={styles.stepDescription}>{t(STEP_DESCRIPTIONS[currentStep])}</Text>

        <View style={styles.fieldsCard}>
          {FIELD_CONFIG[currentStep].map(({ key, placeholder }) => (
            <View key={key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{fieldLabels[key]}</Text>
              <TextInput
                style={[styles.input, errors[key] && styles.inputError]}
                keyboardType="numeric"
                placeholder={placeholder}
                value={form[key]}
                onChangeText={(value) => setField(key, value)}
              />
              <Text style={styles.fieldUnit}>{fieldUnits[key]}</Text>
              {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={isSubmitting}>
          <Text style={styles.primaryButtonText}>
            {stepIndex === STEPS.length - 1
              ? t('daily_vitals.finish', 'Finish')
              : t('daily_vitals.next', 'Next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background.vitals,
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  backIcon: {
    fontSize: 22,
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  progressLabel: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  progressBarTrack: {
    marginTop: Spacing.sm,
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.primary.main,
    borderRadius: 3,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  fieldsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  fieldBlock: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  fieldUnit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  errorText: {
    color: Colors.status.error,
    fontSize: Typography.fontSize.xs,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.base,
  },
});
