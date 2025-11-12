import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { RiskScoreCircle } from '../components';
import { RootStackParamList, VitalType } from '../types';
import {
  calculateFindrisc,
  calculateFraminghamSimplified,
  RiskScoreResult,
} from '../utils/riskScores';
import { useTranslation } from 'react-i18next';

type RiskCalculatorScreenNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'RiskCalculators'
>;

export default function RiskCalculatorScreen() {
  const navigation = useNavigation<RiskCalculatorScreenNavigation>();
  const { t } = useTranslation();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const getLatestByType = useVitalsStore((state) => state.getLatestByType);

  const calculators = settings.riskCalculators;
  const riskFactors = settings.riskFactors;

  const latestWaist = getLatestByType(VitalType.WaistCircumference);
  const latestWeightVital = getLatestByType(VitalType.Weight);
  const latestBloodPressure = getLatestByType(VitalType.BloodPressure);

  const bmi = useMemo(() => {
    const weight = riskFactors?.weightKg ?? latestWeightVital?.value ?? settings.userWeight;
    const height = riskFactors?.heightCm;
    if (!weight || !height) return null;
    const heightMeters = height / 100;
    if (heightMeters <= 0) return null;
    return weight / (heightMeters * heightMeters);
  }, [latestWeightVital?.value, riskFactors?.heightCm, riskFactors?.weightKg, settings.userWeight]);

  const waistCircumference = useMemo(() => latestWaist?.value ?? null, [latestWaist?.value]);

  const systolic = useMemo(() => latestBloodPressure?.systolic ?? null, [latestBloodPressure?.systolic]);

  const findriscResult: RiskScoreResult | undefined = useMemo(() => {
    if (!calculators?.findriscEnabled || !riskFactors) return undefined;
    return calculateFindrisc({
      age: settings.userAge,
      gender: settings.userGender,
      bmi,
      waistCircumference,
      factors: riskFactors,
    });
  }, [bmi, calculators?.findriscEnabled, riskFactors, settings.userAge, settings.userGender, waistCircumference]);

  const framinghamResult: RiskScoreResult | undefined = useMemo(() => {
    if (!calculators?.framinghamEnabled || !riskFactors) return undefined;
    return calculateFraminghamSimplified({
      age: settings.userAge,
      gender: settings.userGender,
      bmi,
      systolicBP: systolic,
      smoking: riskFactors.smoking,
      bpMedication: riskFactors.bpMedication,
      historyHighGlucose: riskFactors.historyHighGlucose,
    });
  }, [
    bmi,
    calculators?.framinghamEnabled,
    riskFactors,
    settings.userAge,
    settings.userGender,
    systolic,
  ]);

  const handleToggle = useCallback(
    async (key: 'findriscEnabled' | 'framinghamEnabled', value: boolean) => {
      const next = {
        ...calculators,
        findriscEnabled: calculators?.findriscEnabled ?? false,
        framinghamEnabled: calculators?.framinghamEnabled ?? false,
        [key]: value,
      };
      await updateSettings({ riskCalculators: next });
      if (value) {
        navigation.navigate('RiskAssessment');
      }
    },
    [calculators, navigation, updateSettings],
  );

  const handleUpdateFactors = useCallback(() => {
    navigation.navigate('RiskAssessment');
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('risk_calculators.title')}</Text>
      <Text style={styles.subtitle}>
        {t('risk_calculators.subtitle')}
      </Text>

      <View style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>{t('risk_calculators.findrisc_title')}</Text>
            <Text style={styles.toggleDescription}>
              {t('risk_calculators.findrisc_desc')}
            </Text>
          </View>
          <Switch
            value={calculators?.findriscEnabled ?? false}
            onValueChange={(value) => handleToggle('findriscEnabled', value)}
            trackColor={{ true: Colors.primary.light, false: Colors.neutral[300] }}
            thumbColor={(calculators?.findriscEnabled ?? false) ? Colors.primary.main : Colors.neutral[200]}
          />
        </View>
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>{t('risk_calculators.framingham_title')}</Text>
            <Text style={styles.toggleDescription}>
              {t('risk_calculators.framingham_desc')}
            </Text>
          </View>
          <Switch
            value={calculators?.framinghamEnabled ?? false}
            onValueChange={(value) => handleToggle('framinghamEnabled', value)}
            trackColor={{ true: Colors.primary.light, false: Colors.neutral[300] }}
            thumbColor={(calculators?.framinghamEnabled ?? false) ? Colors.primary.main : Colors.neutral[200]}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateFactors}>
        <Text style={styles.updateButtonText}>{t('risk_calculators.update_button')}</Text>
      </TouchableOpacity>

      {(findriscResult || framinghamResult) && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>{t('risk_calculators.results_title')}</Text>
          <View style={styles.resultsGrid}>
            {findriscResult && (
              <RiskScoreCircle result={findriscResult} style={styles.resultsCard} />
            )}
            {framinghamResult && (
              <RiskScoreCircle result={framinghamResult} style={styles.resultsCard} />
            )}
          </View>
          <Text style={styles.resultsHint}>
            {t('risk_calculators.results_hint')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
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
  toggleCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  toggleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  updateButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    ...Shadows.sm,
  },
  updateButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  resultsSection: {
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  resultsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'left',
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  resultsCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  resultsHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'left',
  },
});

