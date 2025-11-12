import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { RootStackParamList, VitalType } from '../types';
import { RiskScoreCircle } from '../components';
import { calculateFindrisc, calculateFraminghamSimplified } from '../utils/riskScores';

interface SummaryItem {
  key: string;
  label: string;
  value: string;
  status: 'good' | 'moderate' | 'bad';
}

type HealthProfileScreenNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'HealthProfile'
>;

export default function HealthProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HealthProfileScreenNavigation>();
  const settings = useSettingsStore((state) => state.settings);
  const riskFactors = settings.riskFactors;
  const getLatestByType = useVitalsStore((state) => state.getLatestByType);

  const latestWaist = useMemo(
    () => getLatestByType(VitalType.WaistCircumference),
    [getLatestByType]
  );
  const latestWeight = useMemo(
    () => getLatestByType(VitalType.Weight),
    [getLatestByType]
  );
  const latestBloodPressure = useMemo(
    () => getLatestByType(VitalType.BloodPressure),
    [getLatestByType]
  );

  const bmiValue = useMemo(() => {
    if (!riskFactors) return null;
    const weight = riskFactors.weightKg ?? settings.userWeight ?? latestWeight?.value;
    const height = riskFactors.heightCm;
    if (!weight || !height || height <= 0) return null;
    const heightMeters = height / 100;
    if (heightMeters <= 0) return null;
    return weight / (heightMeters * heightMeters);
  }, [latestWeight?.value, riskFactors, settings.userWeight]);

  const findriscResult = useMemo(() => {
    if (!settings.riskCalculators?.findriscEnabled || !riskFactors) return null;
    return calculateFindrisc({
      age: settings.userAge,
      gender: settings.userGender,
      bmi: bmiValue,
      waistCircumference: latestWaist?.value ?? null,
      factors: riskFactors,
    });
  }, [bmiValue, latestWaist?.value, riskFactors, settings.riskCalculators?.findriscEnabled, settings.userAge, settings.userGender]);

  const framinghamResult = useMemo(() => {
    if (!settings.riskCalculators?.framinghamEnabled || !riskFactors) return null;
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
    latestBloodPressure?.systolic,
    riskFactors,
    settings.riskCalculators?.framinghamEnabled,
    settings.userAge,
    settings.userGender,
  ]);

  const summaryItems: SummaryItem[] = useMemo(() => {
    if (!riskFactors) return [];

    const familyLabel =
      riskFactors.familyHistory === 'immediate'
        ? t('risk.family_immediate')
        : riskFactors.familyHistory === 'extended'
        ? t('risk.family_extended')
        : t('risk.family_none');

    const bmiStatus = (() => {
      if (!bmiValue) return 'moderate' as const;
      if (bmiValue < 23) return 'good' as const;
      if (bmiValue < 27.5) return 'moderate' as const;
      return 'bad' as const;
    })();

    const familyHistoryStatus = (() => {
      if (!riskFactors) return 'moderate' as const;
      if (riskFactors.familyHistory === 'immediate') return 'bad' as const;
      if (riskFactors.familyHistory === 'extended') return 'moderate' as const;
      return 'good' as const;
    })();

    return [
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
        value: familyLabel,
        status: familyHistoryStatus,
      },
    ];
  }, [bmiValue, riskFactors, settings.userAge, settings.userGender, t]);

  const getStatusColors = (status: SummaryItem['status']) => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('vitals.health_profile')}</Text>
      <Text style={styles.subtitle}>{t('vitals.profile_cta_subtitle')}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('RiskAssessment')}
        >
          <Text style={styles.primaryButtonText}>{t('vitals.update_risk_inputs')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('RiskCalculators')}
        >
          <Text style={styles.secondaryButtonText}>{t('vitals.manage_risk_inputs')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>{t('vitals.health_profile_details')}</Text>
        <View style={styles.summaryGrid}>
          {summaryItems.map((item) => {
            const colors = getStatusColors(item.status);
            return (
              <View
                key={item.key}
                style={[styles.summaryItem, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}
              >
                <Text style={[styles.summaryLabel, { color: colors.textColor }]}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {(findriscResult || framinghamResult) && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{t('vitals.risk_scores_title')}</Text>
          <View style={styles.scoresRow}>
            {findriscResult && (
              <RiskScoreCircle result={findriscResult} style={styles.scoreCard} />
            )}
            {framinghamResult && (
              <RiskScoreCircle result={framinghamResult} style={styles.scoreCard} />
            )}
          </View>
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
    gap: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
  },
  primaryButtonText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.primary.light,
  },
  secondaryButtonText: {
    color: Colors.primary.main,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardHeading: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  summaryGrid: {
    gap: Spacing.sm,
  },
  summaryItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  scoreCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    ...Shadows.sm,
  },
});
