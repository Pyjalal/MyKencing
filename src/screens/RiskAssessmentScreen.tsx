import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { AppSettings, RiskFactorSettings, VitalType, RootStackParamList } from '../types';
import { RiskScoreCircle } from '../components';
import {
  calculateFindrisc,
  calculateFraminghamSimplified,
  RiskScoreResult,
} from '../utils/riskScores';

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

function isValidNumber(value: string, min: number, max: number) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return false;
  if (!Number.isFinite(numeric)) return false;
  return numeric >= min && numeric <= max;
}

export default function RiskAssessmentScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'RiskAssessment'>>();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const getLatestByType = useVitalsStore((state) => state.getLatestByType);

  const [riskFactors, setRiskFactors] = useState<RiskFactorSettings>(() => ({
    ...BASE_RISK_FACTORS,
    ...(settings.riskFactors || {}),
  }));

  const [ageModalVisible, setAgeModalVisible] = useState(false);
  const [ageInput, setAgeInput] = useState(settings.userAge ? String(settings.userAge) : '');
  const [ageError, setAgeError] = useState<string | null>(null);

  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const initialWeight = useMemo(
    () => riskFactors.weightKg ?? settings.userWeight ?? null,
    [riskFactors.weightKg, settings.userWeight]
  );
  const [weightInput, setWeightInput] = useState(initialWeight ? String(initialWeight) : '');
  const [heightInput, setHeightInput] = useState(riskFactors.heightCm ? String(riskFactors.heightCm) : '');
  const [bmiError, setBmiError] = useState<string | null>(null);

  useEffect(() => {
    setRiskFactors({
      ...BASE_RISK_FACTORS,
      ...(settings.riskFactors || {}),
    });
  }, [settings.riskFactors]);

  useEffect(() => {
    if (!settings.riskQuestionnaireCompleted) {
      navigation.replace('RiskOnboarding');
    }
  }, [navigation, settings.riskQuestionnaireCompleted]);

  const latestWaist = useMemo(
    () => getLatestByType(VitalType.WaistCircumference),
    [getLatestByType]
  );
  const waistCircumferenceValue = useMemo(
    () => latestWaist?.value ?? riskFactors.waistCircumference ?? null,
    [latestWaist?.value, riskFactors.waistCircumference]
  );
  const latestWeightVital = useMemo(
    () => getLatestByType(VitalType.Weight),
    [getLatestByType]
  );
  const latestBloodPressure = useMemo(
    () => getLatestByType(VitalType.BloodPressure),
    [getLatestByType]
  );

  const bmiValue = useMemo(() => {
    const weight = riskFactors.weightKg ?? settings.userWeight ?? latestWeightVital?.value;
    const height = riskFactors.heightCm;
    if (!weight || !height || height <= 0) return null;
    const heightMeters = height / 100;
    if (heightMeters <= 0) return null;
    return weight / (heightMeters * heightMeters);
  }, [latestWeightVital?.value, riskFactors.heightCm, riskFactors.weightKg, settings.userWeight]);

  const persistSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      try {
        await updateSettings(updates);
      } catch (error) {
        console.error('RiskAssessmentScreen: Failed to update settings', error);
      }
    },
    [updateSettings]
  );

  const updateRiskFactors = useCallback(
    async (updates: Partial<RiskFactorSettings>, extraSettings?: Partial<AppSettings>) => {
      const next = { ...BASE_RISK_FACTORS, ...riskFactors, ...updates };
      setRiskFactors(next);
      await persistSettings({
        riskFactors: next,
        ...(extraSettings || {}),
        riskQuestionnaireCompleted: true,
      });
    },
    [persistSettings, riskFactors]
  );

  const handleToggle = useCallback(
    (key: keyof RiskFactorSettings, value: boolean) => {
      void updateRiskFactors({ [key]: value } as Partial<RiskFactorSettings>);
    },
    [updateRiskFactors]
  );

  const handleSaveAge = useCallback(async () => {
    if (!isValidNumber(ageInput, 8, 120)) {
      setAgeError(t('risk.errors.age_invalid'));
      return;
    }
    const ageValue = Number(ageInput);
    setAgeError(null);
    setAgeModalVisible(false);
    const ageRisk = ageValue >= 45;
    await updateRiskFactors({ ageHighRisk: ageRisk }, { userAge: ageValue });
  }, [ageInput, t, updateRiskFactors]);

  const handleSaveBmi = useCallback(async () => {
    const weightValid = isValidNumber(weightInput, 25, 220);
    const heightValid = isValidNumber(heightInput, 50, 200);
    if (!weightValid || !heightValid) {
      setBmiError(t('risk.errors.bmi_invalid'));
      return;
    }

    const weight = Number(weightInput);
    const height = Number(heightInput);
    const heightMeters = height / 100;
    const bmi = weight / (heightMeters * heightMeters);
    if (bmi < 10 || bmi > 50) {
      setBmiError(t('risk.errors.bmi_invalid'));
      return;
    }
    const bmiRisk = bmi >= 27.5;

    setBmiError(null);
    setBmiModalVisible(false);

    await updateRiskFactors(
      {
        weightKg: weight,
        heightCm: height,
        bmiHighRisk: bmiRisk,
      },
      { userWeight: weight }
    );
  }, [heightInput, t, updateRiskFactors, weightInput]);

  const renderToggleRow = (value: boolean, onChange: (v: boolean) => void) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{value ? t('risk.answer_yes') : t('risk.answer_no')}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? Colors.primary.main : Colors.neutral[300]}
        trackColor={{ true: Colors.primary.light, false: Colors.neutral[300] }}
      />
    </View>
  );

  const getCardBackground = (isRisk: boolean) => ({
    borderLeftWidth: 6,
    borderLeftColor: isRisk ? Colors.secondary.main : Colors.status.success,
  });

  const familyOptions: Array<{
    value: RiskFactorSettings['familyHistory'];
    label: string;
  }> = [
    { value: 'none', label: t('risk.family_none') },
    { value: 'extended', label: t('risk.family_extended') },
    { value: 'immediate', label: t('risk.family_immediate') },
  ];

  const bmiRisk = riskFactors.bmiHighRisk ?? (bmiValue ? bmiValue >= 27.5 : false);
  const calculators = settings.riskCalculators;

  const findriscResult: RiskScoreResult | undefined = useMemo(() => {
    if (!calculators?.findriscEnabled) return undefined;
    return calculateFindrisc({
      age: settings.userAge,
      gender: settings.userGender,
      bmi: bmiValue,
      waistCircumference: waistCircumferenceValue,
      factors: riskFactors,
    });
  }, [bmiValue, calculators?.findriscEnabled, riskFactors, settings.userAge, settings.userGender, waistCircumferenceValue]);

  const framinghamResult: RiskScoreResult | undefined = useMemo(() => {
    if (!calculators?.framinghamEnabled) return undefined;
    return calculateFraminghamSimplified({
      age: settings.userAge,
      gender: settings.userGender,
      bmi: bmiValue,
      systolicBP: latestBloodPressure?.systolic ?? null,
      smoking: riskFactors.smoking,
      bpMedication: riskFactors.bpMedication,
      historyHighGlucose: riskFactors.historyHighGlucose,
    });
  }, [
    bmiValue,
    calculators?.framinghamEnabled,
    latestBloodPressure?.systolic,
    riskFactors.bpMedication,
    riskFactors.historyHighGlucose,
    riskFactors.smoking,
    settings.userAge,
    settings.userGender,
  ]);

  type SummaryStatus = 'good' | 'moderate' | 'bad';

  const getStatusColors = (status: SummaryStatus) => {
    switch (status) {
      case 'good':
        return {
          backgroundColor: Colors.status.successLight,
          borderColor: Colors.status.success,
          textColor: Colors.status.successDark,
        };
      case 'moderate':
        return {
          backgroundColor: Colors.status.warningLight,
          borderColor: Colors.status.warning,
          textColor: Colors.status.warningDark,
        };
      case 'bad':
      default:
        return {
          backgroundColor: Colors.secondary.light,
          borderColor: Colors.secondary.main,
          textColor: Colors.secondary.dark,
        };
    }
  };

  const familyHistoryLabel = () => {
    switch (riskFactors.familyHistory) {
      case 'extended':
        return t('risk.family_extended');
      case 'immediate':
        return t('risk.family_immediate');
      default:
        return t('risk.family_none');
    }
  };

  const bmiStatus: SummaryStatus = (() => {
    if (!bmiValue) return 'moderate';
    if (bmiValue < 23) return 'good';
    if (bmiValue < 27.5) return 'moderate';
    return 'bad';
  })();

  const summaryItems = [
    {
      key: 'age',
      label: t('risk.age_title'),
      value: settings.userAge ? t('risk.age_value', { age: settings.userAge }) : t('risk.summary_missing'),
      status: riskFactors.ageHighRisk ? 'bad' : 'good',
    },
    {
      key: 'gender',
      label: t('risk.gender_title'),
      value: settings.userGender ? t(`risk.gender_${settings.userGender}`) : t('risk.gender_unknown'),
      status: riskFactors.genderHighRisk ? 'bad' : 'good',
    },
    {
      key: 'smoking',
      label: t('risk.smoking_title'),
      value: riskFactors.smoking ? t('risk.answer_yes') : t('risk.answer_no'),
      status: riskFactors.smoking ? 'bad' : 'good',
    },
    {
      key: 'bpMedication',
      label: t('risk.bp_title'),
      value: riskFactors.bpMedication ? t('risk.answer_yes') : t('risk.answer_no'),
      status: riskFactors.bpMedication ? 'bad' : 'good',
    },
    {
      key: 'bmi',
      label: t('risk.bmi_title'),
      value: bmiValue ? t('risk.bmi_value', { value: bmiValue.toFixed(1) }) : t('risk.summary_missing'),
      status: bmiStatus,
    },
    {
      key: 'historyHighGlucose',
      label: t('risk.history_title'),
      value: riskFactors.historyHighGlucose ? t('risk.answer_yes') : t('risk.answer_no'),
      status: riskFactors.historyHighGlucose ? 'bad' : 'good',
    },
    {
      key: 'physicalActivity',
      label: t('risk.activity_title'),
      value: riskFactors.physicalActivity ? t('risk.answer_yes') : t('risk.answer_no'),
      status: riskFactors.physicalActivity ? 'good' : 'bad',
    },
    {
      key: 'familyHistory',
      label: t('risk.family_title'),
      value: familyHistoryLabel(),
      status:
        riskFactors.familyHistory === 'immediate'
          ? 'bad'
          : riskFactors.familyHistory === 'extended'
          ? 'moderate'
          : 'good',
    },
  ] as Array<{ key: string; label: string; value: string; status: SummaryStatus }>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{t('risk.title')}</Text>
        <Text style={styles.subtitle}>{t('risk.subtitle')}</Text>


        <View style={styles.summaryGrid}>
          {summaryItems.map((item) => {
            const colors = getStatusColors(item.status);
            return (
              <View key={item.key} style={[styles.summaryCard, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
                <Text style={[styles.summaryLabel, { color: colors.textColor }]}>{item.label}</Text>
                <Text style={[styles.summaryValue, { color: Colors.text.primary }]}>{item.value}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, getCardBackground(riskFactors.ageHighRisk)]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('risk.age_title')}</Text>
            <TouchableOpacity onPress={() => { setAgeInput(settings.userAge ? String(settings.userAge) : ''); setAgeModalVisible(true); }}>
              <Text style={styles.link}>{t('risk.edit')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardValue}>
            {settings.userAge ? t('risk.age_value', { age: settings.userAge }) : t('risk.age_unknown')}
          </Text>
          {renderToggleRow(riskFactors.ageHighRisk, (value) => handleToggle('ageHighRisk', value))}
          <Text style={styles.cardHint}>{t('risk.age_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(riskFactors.genderHighRisk)]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('risk.gender_title')}</Text>
            <Text style={styles.cardPill}>
              {settings.userGender ? t(`risk.gender_${settings.userGender}`) : t('risk.gender_unknown')}
            </Text>
          </View>
          {renderToggleRow(riskFactors.genderHighRisk, (value) => handleToggle('genderHighRisk', value))}
          <Text style={styles.cardHint}>{t('risk.gender_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(riskFactors.smoking)]}>
          <Text style={styles.cardTitle}>{t('risk.smoking_title')}</Text>
          {renderToggleRow(riskFactors.smoking, (value) => handleToggle('smoking', value))}
          <Text style={styles.cardHint}>{t('risk.smoking_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(riskFactors.bpMedication)]}>
          <Text style={styles.cardTitle}>{t('risk.bp_title')}</Text>
          {renderToggleRow(riskFactors.bpMedication, (value) => handleToggle('bpMedication', value))}
          <Text style={styles.cardHint}>{t('risk.bp_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(bmiRisk)]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('risk.bmi_title')}</Text>
            <TouchableOpacity onPress={() => { setWeightInput(initialWeight ? String(initialWeight) : ''); setHeightInput(riskFactors.heightCm ? String(riskFactors.heightCm) : ''); setBmiModalVisible(true); }}>
              <Text style={styles.link}>{t('risk.edit')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardValue}>
            {bmiValue ? t('risk.bmi_value', { value: bmiValue.toFixed(1) }) : t('risk.bmi_unknown')}
          </Text>
          {renderToggleRow(bmiRisk, (value) => handleToggle('bmiHighRisk', value))}
          <Text style={styles.cardHint}>{t('risk.bmi_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(riskFactors.historyHighGlucose)]}>
          <Text style={styles.cardTitle}>{t('risk.history_title')}</Text>
          {renderToggleRow(riskFactors.historyHighGlucose, (value) => handleToggle('historyHighGlucose', value))}
          <Text style={styles.cardHint}>{t('risk.history_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(!riskFactors.physicalActivity)]}>
          <Text style={styles.cardTitle}>{t('risk.activity_title')}</Text>
          {renderToggleRow(riskFactors.physicalActivity, (value) => handleToggle('physicalActivity', value))}
          <Text style={styles.cardHint}>{t('risk.activity_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(!riskFactors.vegetablesDaily)]}>
          <Text style={styles.cardTitle}>{t('risk.vegetables_title')}</Text>
          {renderToggleRow(riskFactors.vegetablesDaily, (value) => handleToggle('vegetablesDaily', value))}
          <Text style={styles.cardHint}>{t('risk.vegetables_hint')}</Text>
        </View>

        <View style={[styles.card, getCardBackground(riskFactors.familyHistory === 'immediate')]}>
          <Text style={styles.cardTitle}>{t('risk.family_title')}</Text>
          <View style={styles.familyRow}>
            {familyOptions.map((option) => {
              const isSelected = riskFactors.familyHistory === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.familyChip,
                    isSelected && styles.familyChipSelected,
                  ]}
                  onPress={() => void updateRiskFactors({ familyHistory: option.value })}
                >
                  <Text
                    style={[
                      styles.familyChipText,
                      isSelected && styles.familyChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.cardHint}>{t('risk.family_hint')}</Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={ageModalVisible}
        onRequestClose={() => setAgeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAgeModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <Pressable style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('risk.age_modal_title')}</Text>
              <TextInput
                style={styles.modalInput}
                value={ageInput}
                onChangeText={(text) => {
                  setAgeInput(text);
                  setAgeError(null);
                }}
                keyboardType="number-pad"
                placeholder="45"
              />
              {ageError && <Text style={styles.errorText}>{ageError}</Text>}
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setAgeModalVisible(false)}>
                  <Text style={styles.modalCancelText}>{t('risk.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleSaveAge}>
                  <Text style={styles.modalConfirmText}>{t('risk.save')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={bmiModalVisible}
        onRequestClose={() => setBmiModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBmiModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <Pressable style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('risk.bmi_modal_title')}</Text>
              <View style={styles.modalFieldRow}>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>{t('risk.bmi_weight_label')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={weightInput}
                    onChangeText={(text) => {
                      setWeightInput(text);
                      setBmiError(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="70"
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>{t('risk.bmi_height_label')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={heightInput}
                    onChangeText={(text) => {
                      setHeightInput(text);
                      setBmiError(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="165"
                  />
                </View>
              </View>
              {bmiError && <Text style={styles.errorText}>{bmiError}</Text>}
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setBmiModalVisible(false)}>
                  <Text style={styles.modalCancelText}>{t('risk.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleSaveBmi}>
                  <Text style={styles.modalConfirmText}>{t('risk.save')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    backgroundColor: Colors.background.card,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  cardValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  cardHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  link: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.dark,
  },
  cardPill: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  familyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  familyChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.badge,
    borderWidth: 1,
    borderColor: Colors.text.tertiary,
    backgroundColor: Colors.background.card,
  },
  familyChipSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  familyChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  familyChipTextSelected: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.semibold,
  },
  resultsCard: {
    marginTop: Spacing['2xl'],
    padding: Spacing.lg,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    ...Shadows.sm,
  },
  resultsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  resultsHint: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.modal,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: BorderRadius.input,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
  },
  modalCancel: {
    backgroundColor: Colors.background.secondary,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  modalConfirm: {
    backgroundColor: Colors.primary.main,
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.error,
    marginBottom: Spacing.sm,
  },
  modalFieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalField: {
    flex: 1,
  },
  modalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  summaryCard: {
    flexBasis: '48%',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});
