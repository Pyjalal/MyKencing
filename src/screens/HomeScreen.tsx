import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  RootStackParamList,
  DoseStatus,
  VitalType,
  BloodPressureVital,
  WeightVital,
  WaistCircumferenceVital,
  GlucoseVital,
  CholesterolVital,
} from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatDistanceToNow, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import { Search } from 'lucide-react-native';
import { RiskScoreTrendCard } from '../components';
import { calculateFindrisc, calculateFraminghamSimplified, RiskScoreResult } from '../utils/riskScores';
import { CONVERSIONS } from '../constants/clinical';
import { ensureDailyVitalsReminderScheduled, initializeNotifications } from '../services/notifications';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const RISK_TREND_DAYS = 14;
const VITALS_CALENDAR_DAYS = 7;

const convertWeightToKg = (value: number, unit: 'kg' | 'lb') =>
  unit === 'kg' ? value : value * CONVERSIONS.lbToKg;

const percentFromResult = (result?: RiskScoreResult | null) => {
  if (!result) return null;
  const max = result.maxScore ?? 100;
  if (!max) return null;
  const percent = (result.score / max) * 100;
  return Math.max(0, Math.min(100, percent));
};

const isWithinRange = (value: number | null | undefined, min: number, max: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  return value >= min && value <= max;
};

const formatValidatedValue = (
  value: number | null | undefined,
  min: number,
  max: number,
  formatter: (val: number) => string,
  fallback: string,
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  if (value < min || value > max) return fallback;
  return formatter(value);
};

type RiskTrendMeta = {
  percentages: number[];
  latestScore: number | null;
  averageScore: number | null;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const { todayDoses, loadMedications, loadTodayDoses, markDose, getUnacknowledgedHighRiskInteractions } = useMedicationStore();
  const {
    vitals,
    loadVitals,
    getLatestByType,
    addBloodPressure,
    addGlucose,
    addWaistCircumference,
    addWeight,
  } = useVitalsStore();
  const settings = useSettingsStore((state) => state.settings);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnacknowledgedInteraction, setHasUnacknowledgedInteraction] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadMedications();
    loadTodayDoses();
    loadVitals();
  }, []);

  // Reload data when screen comes back into focus (e.g., after acknowledging interactions)
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused, reloading data');
      loadMedications();
      loadTodayDoses();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMedications(), loadTodayDoses(), loadVitals()]);
    setRefreshing(false);
  }, [loadMedications, loadTodayDoses, loadVitals]);

  const nextDose = useMemo(() => {
    const pending = todayDoses.find(
      (d) => d.status === DoseStatus.Pending || d.status === DoseStatus.Late
    );
    if (pending) return pending;

    const upcoming = todayDoses.find((d) => d.status === DoseStatus.Upcoming);
    return upcoming;
  }, [todayDoses]);

  // Check for unacknowledged interactions for next dose
  useEffect(() => {
    async function checkInteractions() {
      if (!nextDose) {
        console.log('[HomeScreen] No next dose, clearing interaction flag');
        setHasUnacknowledgedInteraction(false);
        return;
      }

      console.log('[HomeScreen] Checking interactions for next dose medication:', nextDose.medicationId);
      
      try {
        const unacknowledgedIds = await getUnacknowledgedHighRiskInteractions(nextDose.medicationId);
        console.log('[HomeScreen] Next dose unacknowledged interaction IDs:', unacknowledgedIds);
        const hasUnack = unacknowledgedIds.length > 0;
        console.log('[HomeScreen] Next dose has unacknowledged:', hasUnack);
        setHasUnacknowledgedInteraction(hasUnack);
      } catch (error) {
        console.error('[HomeScreen] Error checking next dose interactions:', error);
        setHasUnacknowledgedInteraction(false);
      }
    }

    checkInteractions();
  }, [todayDoses]);

  const timeUntilDose = useMemo(() => {
    if (!nextDose) return null;
    return formatDistanceToNow(new Date(nextDose.scheduledTime), { addSuffix: false });
  }, [nextDose]);

  const riskFactors = settings.riskFactors;
  const calculators = settings.riskCalculators;

  const dayBuckets = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    for (let i = RISK_TREND_DAYS - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    return days;
  }, []);

  const weightVitals = useMemo(
    () =>
      vitals
        .filter((v): v is WeightVital => v.type === VitalType.Weight)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [vitals]
  );

  const waistVitals = useMemo(
    () =>
      vitals
        .filter((v): v is WaistCircumferenceVital => v.type === VitalType.WaistCircumference)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [vitals]
  );

  const bloodPressureVitals = useMemo(
    () =>
      vitals
        .filter((v): v is BloodPressureVital => v.type === VitalType.BloodPressure)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [vitals]
  );

  const glucoseVitals = useMemo(
    () =>
      vitals
        .filter((v): v is GlucoseVital => v.type === VitalType.Glucose)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [vitals]
  );

  const totalCholesterolVitals = useMemo(
    () =>
      vitals
        .filter((v): v is CholesterolVital => v.type === VitalType.TotalCholesterol)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [vitals]
  );

  const hdlCholesterolVitals = useMemo(
    () =>
      vitals
        .filter((v): v is CholesterolVital => v.type === VitalType.HDLCholesterol)
        .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()),
    [vitals]
  );

  const findWeightBeforeDate = useCallback(
    (date: Date) => {
      const entry = weightVitals.find((v) => new Date(v.measuredAt) <= date);
      if (!entry) return null;
      return convertWeightToKg(entry.value, entry.unit);
    },
    [weightVitals]
  );

  const findWaistBeforeDate = useCallback(
    (date: Date) => {
      const entry = waistVitals.find((v) => new Date(v.measuredAt) <= date);
      return entry?.value ?? null;
    },
    [waistVitals]
  );

  const findSystolicBeforeDate = useCallback(
    (date: Date) => {
      const entry = bloodPressureVitals.find((v) => new Date(v.measuredAt) <= date);
      return entry?.systolic ?? null;
    },
    [bloodPressureVitals]
  );

  const buildTrendMeta = useCallback(
    (series: RiskScoreResult[], fallback?: RiskScoreResult | null): RiskTrendMeta | null => {
      if (!series.length && !fallback) return null;
      const basePercent = percentFromResult(fallback ?? null) ?? 0;
      const baseScore = fallback?.score ?? 0;
      const percentages = series.length
        ? series.map((item) => percentFromResult(item) ?? basePercent)
        : Array(dayBuckets.length).fill(basePercent);
      const scores = series.length
        ? series.map((item) => item?.score ?? baseScore)
        : Array(dayBuckets.length).fill(baseScore);

      const sanitized = percentages.map((value) =>
        Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : basePercent
      );
      const scoreSanitized = scores.map((value) =>
        Number.isFinite(value) ? value : baseScore
      );

      const latestScore = scoreSanitized[scoreSanitized.length - 1] ?? baseScore;
      const averageScore = scoreSanitized.length
        ? scoreSanitized.reduce((sum, value) => sum + value, 0) / scoreSanitized.length
        : latestScore;

      return {
        percentages: sanitized,
        latestScore,
        averageScore,
      };
    },
    [dayBuckets.length]
  );

  const latestWaist = useMemo(
    () => getLatestByType(VitalType.WaistCircumference) as WaistCircumferenceVital | undefined,
    [getLatestByType, vitals]
  );
  const waistCircumferenceValue = useMemo(
    () => latestWaist?.value ?? riskFactors?.waistCircumference ?? null,
    [latestWaist?.value, riskFactors?.waistCircumference]
  );
  const latestWeight = useMemo(
    () => getLatestByType(VitalType.Weight) as WeightVital | undefined,
    [getLatestByType, vitals]
  );
  const latestBloodPressure = useMemo(
    () => getLatestByType(VitalType.BloodPressure) as BloodPressureVital | undefined,
    [getLatestByType, vitals]
  );

  const latestWeightKg = useMemo(() => {
    if (!latestWeight) return null;
    return convertWeightToKg(latestWeight.value, latestWeight.unit);
  }, [latestWeight]);

  const bmi = useMemo(() => {
    if (!riskFactors) return null;
    const weight = latestWeightKg ?? riskFactors.weightKg ?? settings.userWeight;
    const height = riskFactors.heightCm;
    if (!weight || !height) return null;
    const heightMeters = height / 100;
    if (heightMeters <= 0) return null;
    return weight / (heightMeters * heightMeters);
  }, [latestWeightKg, riskFactors, settings.userWeight]);

  const findriscResult = useMemo(() => {
    if (!calculators?.findriscEnabled || !riskFactors) return null;
    return calculateFindrisc({
      age: settings.userAge,
      gender: settings.userGender,
      bmi,
      waistCircumference: waistCircumferenceValue,
      factors: riskFactors,
    });
  }, [bmi, calculators?.findriscEnabled, waistCircumferenceValue, riskFactors, settings.userAge, settings.userGender]);

  const framinghamResult = useMemo(() => {
    if (!calculators?.framinghamEnabled || !riskFactors) return null;
    return calculateFraminghamSimplified({
      age: settings.userAge,
      gender: settings.userGender,
      bmi,
      systolicBP: latestBloodPressure?.systolic ?? null,
      smoking: riskFactors.smoking,
      bpMedication: riskFactors.bpMedication,
      historyHighGlucose: riskFactors.historyHighGlucose,
    });
  }, [bmi, calculators?.framinghamEnabled, latestBloodPressure?.systolic, riskFactors, settings.userAge, settings.userGender]);

  const hasRiskScores = Boolean(findriscResult || framinghamResult);
  const riskScoresEnabled = Boolean(calculators?.findriscEnabled || calculators?.framinghamEnabled);

  const vitalsCalendarDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: VITALS_CALENDAR_DAYS }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (VITALS_CALENDAR_DAYS - 1 - index));
      return date;
    });
  }, []);

  const vitalsLoggedByDay = useMemo(() => {
    const set = new Set<string>();
    vitals.forEach((vital) => {
      const key = new Date(vital.measuredAt).toDateString();
      set.add(key);
    });
    return set;
  }, [vitals]);

  const vitalsCalendarItems = useMemo(
    () =>
      vitalsCalendarDays.map((date) => ({
        date,
        recorded: vitalsLoggedByDay.has(date.toDateString()),
      })),
    [vitalsCalendarDays, vitalsLoggedByDay]
  );

  const todayKey = useMemo(() => new Date().toDateString(), []);
  const todaysBloodPressure = useMemo(
    () => bloodPressureVitals.find((entry) => new Date(entry.measuredAt).toDateString() === todayKey),
    [bloodPressureVitals, todayKey]
  );
  const todaysWeight = useMemo(
    () => weightVitals.find((entry) => new Date(entry.measuredAt).toDateString() === todayKey),
    [todayKey, weightVitals]
  );
  const todaysGlucose = useMemo(
    () => glucoseVitals.find((entry) => new Date(entry.measuredAt).toDateString() === todayKey),
    [glucoseVitals, todayKey]
  );
  const todaysTotalCholesterol = useMemo(
    () => totalCholesterolVitals.find((entry) => new Date(entry.measuredAt).toDateString() === todayKey),
    [todayKey, totalCholesterolVitals]
  );
  const todaysHdlCholesterol = useMemo(
    () => hdlCholesterolVitals.find((entry) => new Date(entry.measuredAt).toDateString() === todayKey),
    [hdlCholesterolVitals, todayKey]
  );

  const hasLoggedVitalsToday = vitalsLoggedByDay.has(todayKey);

  const dailyVitalsDisplay = useMemo(() => {
    const invalidText = t('home.vitals_invalid_value', 'Recheck value');
    const formatOrFallback = (value: number | null | undefined, min: number, max: number, formatter: (val: number) => string) =>
      isWithinRange(value, min, max) ? formatter(value as number) : invalidText;

    const bpText = (() => {
      if (!todaysBloodPressure) return '--';
      const systolicValid = isWithinRange(todaysBloodPressure.systolic, 80, 220);
      const diastolicValid = isWithinRange(todaysBloodPressure.diastolic, 40, 140);
      if (!systolicValid || !diastolicValid) return invalidText;
      return `${todaysBloodPressure.systolic}/${todaysBloodPressure.diastolic} mmHg`;
    })();

    const glucoseText = todaysGlucose
      ? formatOrFallback(todaysGlucose.value, 3, 30, (val) => `${val.toFixed(1)} ${todaysGlucose.unit}`)
      : '--';

    const weightKg = todaysWeight ? convertWeightToKg(todaysWeight.value, todaysWeight.unit) : null;
    const weightText = todaysWeight
      ? formatOrFallback(weightKg, 30, 250, (val) => `${val.toFixed(1)} kg`)
      : '--';

    const totalCholText = todaysTotalCholesterol
      ? formatOrFallback(todaysTotalCholesterol.value, 2, 12, (val) => `${val.toFixed(1)} mmol/L`)
      : '--';

    const hdlText = todaysHdlCholesterol
      ? formatOrFallback(todaysHdlCholesterol.value, 0.5, 4, (val) => `${val.toFixed(1)} mmol/L`)
      : '--';

    const heightText = settings.riskFactors?.heightCm
      ? formatOrFallback(settings.riskFactors.heightCm, 100, 230, (val) => `${val} cm`)
      : '--';

    return {
      bp: bpText,
      glucose: glucoseText,
      weight: weightText,
      totalCholesterol: totalCholText,
      hdlCholesterol: hdlText,
      height: heightText,
    };
  }, [settings.riskFactors?.heightCm, t, todaysBloodPressure, todaysGlucose, todaysHdlCholesterol, todaysTotalCholesterol, todaysWeight]);


  const findriscTrend = useMemo(() => {
    if (!findriscResult || !riskFactors) return null;
    const heightMeters = riskFactors.heightCm ? riskFactors.heightCm / 100 : null;

    const series = dayBuckets.map((date) => {
      const weightValue =
        findWeightBeforeDate(date) ?? riskFactors.weightKg ?? settings.userWeight ?? null;
      const bmiValue =
        weightValue && heightMeters && heightMeters > 0
          ? weightValue / (heightMeters * heightMeters)
          : null;
      const waistValue = findWaistBeforeDate(date);

      return calculateFindrisc({
        age: settings.userAge,
        gender: settings.userGender,
        bmi: bmiValue,
        waistCircumference: waistValue,
        factors: riskFactors,
      });
    });

    return buildTrendMeta(series, findriscResult);
  }, [
    buildTrendMeta,
    dayBuckets,
    findWeightBeforeDate,
    findWaistBeforeDate,
    findriscResult,
    riskFactors,
    settings.userAge,
    settings.userGender,
    settings.userWeight,
  ]);

  const framinghamTrend = useMemo(() => {
    if (!framinghamResult || !riskFactors) return null;
    const heightMeters = riskFactors.heightCm ? riskFactors.heightCm / 100 : null;

    const series = dayBuckets.map((date) => {
      const weightValue =
        findWeightBeforeDate(date) ?? riskFactors.weightKg ?? settings.userWeight ?? null;
      const bmiValue =
        weightValue && heightMeters && heightMeters > 0
          ? weightValue / (heightMeters * heightMeters)
          : null;
      const systolic = findSystolicBeforeDate(date) ?? latestBloodPressure?.systolic ?? null;

      return calculateFraminghamSimplified({
        age: settings.userAge,
        gender: settings.userGender,
        bmi: bmiValue,
        systolicBP: systolic,
        smoking: riskFactors.smoking,
        bpMedication: riskFactors.bpMedication,
        historyHighGlucose: riskFactors.historyHighGlucose,
      });
    });

    return buildTrendMeta(series, framinghamResult);
  }, [
    buildTrendMeta,
    dayBuckets,
    findSystolicBeforeDate,
    findWeightBeforeDate,
    framinghamResult,
    latestBloodPressure?.systolic,
    riskFactors,
    settings.userAge,
    settings.userGender,
    settings.userWeight,
  ]);

  const handleDoseDetailsPress = () => {
    if (nextDose) {
      navigation.navigate('MedicineDetail', { medicationId: nextDose.medicationId });
    }
  };

  const handleSearchPress = () => {
    navigation.navigate('AddMedicine', {} as any);
  };

  const handleManageRiskPress = () => {
    navigation.navigate('RiskCalculators');
  };

  const handleUpdateRiskInputs = () => {
    navigation.navigate('RiskAssessment');
  };

  const handleLogVitalsPress = () => {
    navigation.navigate('DailyVitalsLog');
  };

  const handleNotificationTogglePress = async () => {
    try {
      await initializeNotifications();
      await ensureDailyVitalsReminderScheduled();
      setNotificationsEnabled(true);
      Alert.alert(
        t('home.notifications_enabled_title', 'Notifications enabled'),
        t(
          'home.notifications_enabled_message',
          'You will get a reminder every day at 12:00 AM to log your vitals.'
        )
      );
    } catch (error) {
      Alert.alert(
        t('home.notifications_failed_title', 'Unable to enable notifications'),
        t(
          'home.notifications_failed_message',
          'Please enable notifications from your device settings.'
        )
      );
    }
  };


  const handleTakeDose = async () => {
    if (nextDose) {
      try {
        console.log('HomeScreen: Marking dose as taken:', nextDose.id);
        await markDose(nextDose.id, DoseStatus.Taken);
        // Reload doses to update UI
        await loadTodayDoses();
        console.log('HomeScreen: Dose marked and reloaded');
      } catch (error) {
        console.error('HomeScreen: Error marking dose:', error);
      }
    }
  };

  const handleSkipDose = async () => {
    if (nextDose) {
      try {
        console.log('HomeScreen: Marking dose as skipped:', nextDose.id);
        await markDose(nextDose.id, DoseStatus.Skipped);
        // Reload doses to update UI
        await loadTodayDoses();
        console.log('HomeScreen: Dose skipped and reloaded');
      } catch (error) {
        console.error('HomeScreen: Error skipping dose:', error);
      }
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting_morning', 'Good morning');
    if (hour < 18) return t('home.greeting_afternoon', 'Good afternoon');
    return t('home.greeting_evening', 'Good evening');
  }, [t]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.main}
          />
        }
      >
        <View style={styles.heroSection}>
          <TouchableOpacity style={styles.searchBar} activeOpacity={0.8} onPress={handleSearchPress}>
            <Search size={20} color={Colors.primary.dark} />
            <Text style={styles.searchPlaceholder}>{t('home.search_placeholder', 'Search here')}</Text>
          </TouchableOpacity>

          <Text style={styles.greetingText}>
            {greeting},{'\n'}{settings.userName || t('home.user_name', 'Friend')}
          </Text>
        </View>


        <View style={styles.riskScoresCard}>
        <View style={styles.vitalsCalendarCard}>
            <View style={styles.vitalsCalendarRow}>
              {vitalsCalendarItems.map(({ date, recorded }) => (
                <View key={date.toDateString()} style={styles.vitalsCalendarDay}>
                  <Text style={styles.vitalsCalendarDayName}>{format(date, 'EEE')}</Text>
                  <View
                    style={[
                      styles.vitalsCalendarDayCircle,
                      recorded
                        ? styles.vitalsCalendarDayCircleRecorded
                        : styles.vitalsCalendarDayCircleMissing,
                    ]}
                  >
                    <Text style={styles.vitalsCalendarDayText}>{format(date, 'd')}</Text>
                  </View>
                  <Text
                    style={[
                      styles.vitalsCalendarStatus,
                      recorded
                        ? styles.vitalsCalendarStatusRecorded
                        : styles.vitalsCalendarStatusMissing,
                    ]}
                  >
                    {recorded ? '✓' : '✕'}
                  </Text>
                </View>
              ))}
            </View>
          <View style={styles.vitalsCalendarLegendRow}>
            <View style={styles.vitalsLegendItem}>
              <View style={[styles.vitalsLegendDot, styles.vitalsLegendDotRecorded]} />
              <Text style={styles.vitalsCalendarLegendLabel}>✓</Text>
            </View>
            <View style={styles.vitalsLegendItem}>
              <View style={[styles.vitalsLegendDot, styles.vitalsLegendDotMissing]} />
              <Text style={styles.vitalsCalendarLegendLabel}>✕</Text>
            </View>
          </View>
          {hasLoggedVitalsToday ? (
              <View style={styles.dailyVitalsSummary}>
                <Text style={styles.dailyVitalsSummaryTitle}>{t('home.daily_vitals_summary_title', 'Today’s vitals')}</Text>
                <View style={styles.dailyVitalsSummaryRow}>
                  <Text style={styles.dailyVitalsSummaryLabel}>{t('home.daily_vitals_bp', 'Blood pressure')}</Text>
                  <Text style={styles.dailyVitalsSummaryValue}>{dailyVitalsDisplay.bp}</Text>
                </View>
                <View style={styles.dailyVitalsSummaryRow}>
                  <Text style={styles.dailyVitalsSummaryLabel}>{t('home.daily_vitals_glucose', 'Glucose')}</Text>
                  <Text style={styles.dailyVitalsSummaryValue}>{dailyVitalsDisplay.glucose}</Text>
                </View>
                <View style={styles.dailyVitalsSummaryRow}>
                  <Text style={styles.dailyVitalsSummaryLabel}>{t('home.daily_vitals_weight', 'Weight')}</Text>
                  <Text style={styles.dailyVitalsSummaryValue}>{dailyVitalsDisplay.weight}</Text>
                </View>
                <View style={styles.dailyVitalsSummaryRow}>
                  <Text style={styles.dailyVitalsSummaryLabel}>{t('home.daily_vitals_total_cholesterol', 'Total cholesterol')}</Text>
                  <Text style={styles.dailyVitalsSummaryValue}>{dailyVitalsDisplay.totalCholesterol}</Text>
                </View>
                <View style={styles.dailyVitalsSummaryRow}>
                  <Text style={styles.dailyVitalsSummaryLabel}>{t('home.daily_vitals_hdl_cholesterol', 'HDL cholesterol')}</Text>
                  <Text style={styles.dailyVitalsSummaryValue}>{dailyVitalsDisplay.hdlCholesterol}</Text>
                </View>
                <View style={styles.dailyVitalsSummaryRow}>
                  <Text style={styles.dailyVitalsSummaryLabel}>{t('home.daily_vitals_height', 'Height')}</Text>
                  <Text style={styles.dailyVitalsSummaryValue}>{dailyVitalsDisplay.height}</Text>
                </View>
              <TouchableOpacity style={styles.vitalsCalendarButton} onPress={handleLogVitalsPress}>
                <Text style={styles.vitalsCalendarButtonText}>{t('home.update_vitals_button', 'Update today’s vitals')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.vitalsCalendarButton} onPress={handleLogVitalsPress}>
              <Text style={styles.vitalsCalendarButtonText}>{t('home.log_vitals_button', 'Log today’s vitals')}</Text>
            </TouchableOpacity>
          )}
        </View>

          <View style={styles.riskScoresHeader}>
            <Text style={styles.riskScoresTitle}>{t('vitals.risk_scores_title')}</Text>
            <TouchableOpacity onPress={handleManageRiskPress}>
              <Text style={styles.sectionLink}>{t('vitals.manage_risk_inputs')}</Text>
            </TouchableOpacity>
          </View>
          {hasRiskScores ? (
            <View style={styles.riskTrendList}>
              {findriscResult && findriscTrend && (
                <RiskScoreTrendCard
                  title={findriscResult.label}
                  trendLabel={t('vitals.last_14_day_trend', 'Last 14-day trend')}
                  averageLabel={t('vitals.fourteen_day_average', '14-day average')}
                  color={findriscResult.color}
                  percentages={findriscTrend.percentages}
                  latestScore={findriscTrend.latestScore}
                  averageScore={findriscTrend.averageScore}
                  maxScore={findriscResult.maxScore}
                  category={findriscResult.category}
                  description={findriscResult.description}
                />
              )}
              {framinghamResult && framinghamTrend && (
                <RiskScoreTrendCard
                  title={framinghamResult.label}
                  trendLabel={t('vitals.last_14_day_trend', 'Last 14-day trend')}
                  averageLabel={t('vitals.fourteen_day_average', '14-day average')}
                  color={framinghamResult.color}
                  percentages={framinghamTrend.percentages}
                  latestScore={framinghamTrend.latestScore}
                  averageScore={framinghamTrend.averageScore}
                  maxScore={framinghamResult.maxScore}
                  category={framinghamResult.category}
                  description={framinghamResult.description}
                />
              )}
            </View>
          ) : (
            <View style={styles.riskScoresEmpty}>
              <Text style={styles.riskScoresHint}>
                {riskScoresEnabled
                  ? t('risk_calculators.results_hint')
                  : t('vitals.enable_scores_hint')}
              </Text>
              <TouchableOpacity style={styles.riskScoresButton} onPress={handleManageRiskPress}>
                <Text style={styles.riskScoresButtonText}>{t('risk_calculators.update_button')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          {!hasUnacknowledgedInteraction && (
            <Text style={styles.nextDoseLabel}>{t('home.next_dose_label', 'Next Dose:')}</Text>
          )}
          {hasUnacknowledgedInteraction ? (
            <View style={styles.interactionBlockedContainer}>
              <View style={styles.warningIconContainer}>
                <Text style={styles.warningIconLarge}>⚠️</Text>
              </View>
              <Text style={styles.interactionBlockedTitle}>
                High-Risk Drug Interaction Detected
              </Text>
              <Text style={styles.interactionBlockedText}>
                This medication has a high-risk interaction that requires your acknowledgment.
              </Text>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={handleDoseDetailsPress}
              >
                <Text style={styles.viewDetailsButtonText}>
                  View Medicine Details
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {nextDose ? (
                <TouchableOpacity
                  style={styles.medicationChip}
                  onPress={handleDoseDetailsPress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.medicationChipText}>
                    {nextDose.medication.mims.brandName || nextDose.medication.mims.genericName}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.medicationChip, styles.medicationChipInactive]}>
                  <Text style={styles.medicationChipText}>{t('home.no_medication_selected', 'No medication scheduled')}</Text>
                </View>
              )}

              <Text style={styles.doseTimingText}>
                {nextDose
                  ? t('home.dose_in_time', {
                      defaultValue: 'in {{time}}',
                      time: timeUntilDose,
                    })
                  : t('home.no_upcoming_doses', 'No upcoming doses')}
              </Text>

              <View style={styles.doseActions}>
                <TouchableOpacity
                  style={[styles.primaryActionButton, !nextDose && styles.actionDisabled]}
                  onPress={handleTakeDose}
                  disabled={!nextDose}
                >
                  <Text style={styles.primaryActionText}>{t('home.take', 'Take')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryActionButton, !nextDose && styles.actionDisabledSecondary]}
                  onPress={handleSkipDose}
                  disabled={!nextDose}
                >
                  <Text style={styles.secondaryActionText}>{t('home.skip', 'Skip')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.notificationCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle}>
              {t('home.vitals_reminder_title', 'Daily vitals reminder')}
            </Text>
            <Text style={styles.notificationBody}>
              {t(
                'home.vitals_reminder_body',
                'Enable MyMedix notifications to get nudged every day at 12:00 AM.'
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationToggle,
              notificationsEnabled && styles.notificationToggleEnabled,
            ]}
            onPress={handleNotificationTogglePress}
          >
            <View
              style={[
                styles.notificationToggleKnob,
                notificationsEnabled && styles.notificationToggleKnobEnabled,
              ]}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  contentContainer: {
    paddingBottom: 120,
    gap: Spacing.lg,
  },
  heroSection: {
    backgroundColor: Colors.primary.dark,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl * 1.3,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 30,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchPlaceholder: {
    marginLeft: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
    lineHeight: 34,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius['3xl'],
    ...Shadows.sm,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  notificationBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  notificationToggle: {
    width: 56,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.neutral[200],
    padding: 4,
    justifyContent: 'center',
  },
  notificationToggleEnabled: {
    backgroundColor: Colors.primary.main,
  },
  notificationToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.card,
    alignSelf: 'flex-start',
    ...Shadows.sm,
  },
  notificationToggleKnobEnabled: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary.contrast,
  },
  notificationActionText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  sectionCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.lg,
    borderRadius: 28,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  interactionBlockedContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  warningIconContainer: {
    marginBottom: Spacing.md,
  },
  warningIconLarge: {
    fontSize: 64,
  },
  interactionBlockedTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.error,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  interactionBlockedText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  viewDetailsButton: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 999,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  sectionLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
  },
  riskTrendList: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  vitalsCalendarCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  vitalsCalendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  vitalsCalendarTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  vitalsCalendarLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vitalsLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vitalsCalendarLegendLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.semibold,
  },
  vitalsLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  vitalsLegendDotRecorded: {
    backgroundColor: Colors.status.success,
  },
  vitalsLegendDotMissing: {
    backgroundColor: Colors.status.error,
  },
  vitalsCalendarButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  vitalsCalendarButtonText: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.semibold,
  },
  vitalsCalendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalsCalendarDay: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vitalsCalendarDayName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  vitalsCalendarDayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalsCalendarDayCircleRecorded: {
    backgroundColor: Colors.status.successLight,
  },
  vitalsCalendarDayCircleMissing: {
    backgroundColor: Colors.status.errorLight,
  },
  vitalsCalendarDayText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  vitalsCalendarStatus: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  vitalsCalendarStatusRecorded: {
    color: Colors.status.success,
  },
  vitalsCalendarStatusMissing: {
    color: Colors.status.error,
  },
  dailyVitalsSummary: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  dailyVitalsSummaryTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  dailyVitalsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyVitalsSummaryLabel: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
  },
  dailyVitalsSummaryValue: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  riskScoresCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    gap: Spacing.md,
    ...Shadows.md,
  },
  riskScoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  riskScoresTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  riskScoresEmpty: {
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  riskScoresHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  riskScoresButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 999,
  },
  riskScoresButtonText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  nextDoseLabel: {
    fontSize: 22,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  medicationChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    marginBottom: Spacing.sm,
  },
  medicationChipInactive: {
    backgroundColor: Colors.neutral[200],
  },
  medicationChipText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent.contrast,
  },
  doseTimingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  doseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: Colors.accent.main,
    paddingVertical: Spacing.md,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent.contrast,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#EEF1FF',
    paddingVertical: Spacing.md,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.dark,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionDisabledSecondary: {
    backgroundColor: Colors.neutral[200],
  },
});
