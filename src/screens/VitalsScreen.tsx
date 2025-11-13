/**
 * VitalsScreen - Vitals Tracker
 * Matches Figma design: Vitals 1.png, Vitals 2.png, Vitals 3.png
 * Features hard-coded demo data for presentations
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import {
  Vital,
  VitalType,
  BloodPressureVital,
  WeightVital,
  GlucoseVital,
  CholesterolVital,
  WaistCircumferenceVital,
} from '../types';
import { Search, BotMessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../stores/settingsStore';
import { CONVERSIONS } from '../constants/clinical';
import { RiskScoreTrendCard } from '../components';
import { calculateFindrisc, calculateFraminghamSimplified, RiskScoreResult } from '../utils/riskScores';

const toDayKey = (input: string | Date) => {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface MeasuredEntry {
  measuredAt: string;
}

const toKg = (value: number, unit: 'kg' | 'lb') =>
  unit === 'kg' ? value : value * CONVERSIONS.lbToKg;

const RISK_TREND_DAYS = 14;

const percentFromResult = (result?: RiskScoreResult | null) => {
  if (!result) return null;
  const max = result.maxScore ?? 100;
  if (!max) return null;
  const percent = (result.score / max) * 100;
  return Math.max(0, Math.min(100, percent));
};

type RiskTrendMeta = {
  percentages: number[];
  latestPercent: number | null;
  averagePercent: number | null;
};

const aggregateDaily = <T extends MeasuredEntry>(
  dates: Date[],
  entries: T[],
  getValue: (entry: T) => number | null | undefined
) => {
  return dates.map((date) => {
    const key = toDayKey(date);
    const values: number[] = [];
    entries.forEach((entry) => {
      if (toDayKey(entry.measuredAt) === key) {
        const value = getValue(entry);
        if (value !== null && value !== undefined && !isNaN(value)) {
          values.push(value);
        }
      }
    });
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  });
};

const aggregateWeekly = <T extends MeasuredEntry>(
  weekStarts: Date[],
  entries: T[],
  getValue: (entry: T) => number | null | undefined
) => {
  return weekStarts.map((start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const values: number[] = [];
    entries.forEach((entry) => {
      const measured = new Date(entry.measuredAt);
      if (measured >= start && measured < end) {
        const value = getValue(entry);
        if (value !== null && value !== undefined && !isNaN(value)) {
          values.push(value);
        }
      }
    });

    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  });
};

const getMaxValue = (series: (number | null)[]) => {
  const filtered = series.filter((value): value is number => value !== null);
  return filtered.length ? Math.max(...filtered) : null;
};

// const DAILY_POINTS = 14;
// const WEEKLY_POINTS = 6;

const DEMO_DATA = {
  bloodPressure: [
    { day: 1, systolic: 110, diastolic: 95 },
    { day: 2, systolic: 115, diastolic: 100 },
    { day: 3, systolic: 118, diastolic: 98 },
    { day: 4, systolic: 125, diastolic: 105 },
    { day: 5, systolic: 130, diastolic: 110 },
    { day: 6, systolic: 122, diastolic: 102 },
    { day: 7, systolic: 115, diastolic: 96 },
    { day: 8, systolic: 120, diastolic: 100 },
    { day: 9, systolic: 128, diastolic: 108 },
    { day: 10, systolic: 118, diastolic: 99 },
    { day: 11, systolic: 115, diastolic: 97 },
    { day: 12, systolic: 112, diastolic: 95 },
    { day: 13, systolic: 118, diastolic: 100 },
    { day: 14, systolic: 120, diastolic: 102 },
  ],
  weight: [
    { day: 1, weight: 58.2, bmi: 21.1 },
    { day: 2, weight: 58.3, bmi: 21.1 },
    { day: 3, weight: 58.5, bmi: 21.2 },
    { day: 4, weight: 58.8, bmi: 21.3 },
    { day: 5, weight: 59.0, bmi: 21.4 },
    { day: 6, weight: 58.9, bmi: 21.3 },
    { day: 7, weight: 58.7, bmi: 21.3 },
    { day: 8, weight: 58.5, bmi: 21.2 },
    { day: 9, weight: 58.4, bmi: 21.2 },
    { day: 10, weight: 58.6, bmi: 21.2 },
    { day: 11, weight: 58.8, bmi: 21.3 },
    { day: 12, weight: 59.1, bmi: 21.4 },
    { day: 13, weight: 58.9, bmi: 21.3 },
    { day: 14, weight: 58.4, bmi: 21.2 },
  ],
  bloodGlucose: [
    { day: 1, value: 7.5 },
    { day: 2, value: 7.2 },
    { day: 3, value: 6.8 },
    { day: 4, value: 6.5 },
    { day: 5, value: 8.2 },
    { day: 6, value: 8.5 },
    { day: 7, value: 7.8 },
    { day: 8, value: 7.5 },
    { day: 9, value: 7.9 },
    { day: 10, value: 8.1 },
    { day: 11, value: 8.8 },
    { day: 12, value: 9.0 },
    { day: 13, value: 8.5 },
    { day: 14, value: 8.3 },
  ],
  waistCircumference: [
    { day: 1, value: 88 },
    { day: 2, value: 88.5 },
    { day: 3, value: 87.8 },
    { day: 4, value: 87.5 },
    { day: 5, value: 88.2 },
    { day: 6, value: 88.0 },
    { day: 7, value: 87.6 },
    { day: 8, value: 87.4 },
    { day: 9, value: 87.0 },
    { day: 10, value: 86.8 },
    { day: 11, value: 86.5 },
    { day: 12, value: 86.2 },
    { day: 13, value: 86.0 },
    { day: 14, value: 85.8 },
  ],
  totalCholesterolWeekly: [
    { week: 1, value: 5.4 },
    { week: 2, value: 5.1 },
    { week: 3, value: 4.9 },
    { week: 4, value: 4.7 },
  ],
  hdlCholesterolWeekly: [
    { week: 1, value: 1.2 },
    { week: 2, value: 1.3 },
    { week: 3, value: 1.4 },
    { week: 4, value: 1.4 },
  ],
};

export default function VitalsScreen() {
  const { t } = useTranslation();
  const { vitals, loadVitals } = useVitalsStore();
  const settings = useSettingsStore((state) => state.settings);
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true); // Toggle for demo data

  useEffect(() => {
    loadVitals();
  }, []);

  const bloodPressureVitals = useMemo(
    () =>
      vitals
        .filter((v): v is BloodPressureVital => v.type === VitalType.BloodPressure)
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
        ),
    [vitals]
  );

  const weightVitals = useMemo(
    () =>
      vitals
        .filter((v): v is WeightVital => v.type === VitalType.Weight)
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
        ),
    [vitals]
  );

  const glucoseVitals = useMemo(
    () =>
      vitals
        .filter((v): v is GlucoseVital => v.type === VitalType.Glucose)
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
        ),
    [vitals]
  );

  const waistVitals = useMemo(
    () =>
      vitals
        .filter(
          (v): v is WaistCircumferenceVital => v.type === VitalType.WaistCircumference
        )
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
        ),
    [vitals]
  );

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

  const findWeightBeforeDate = useCallback(
    (date: Date) => {
      const entry = weightVitals.find((v) => new Date(v.measuredAt) <= date);
      if (!entry) return null;
      return toKg(entry.value, entry.unit);
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
      const percentages = series.length
        ? series.map((item) => percentFromResult(item) ?? basePercent)
        : Array(dayBuckets.length).fill(basePercent);

      const sanitized = percentages.map((value) =>
        Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : basePercent
      );

      const latestPercent = sanitized[sanitized.length - 1] ?? basePercent;
      const averagePercent = sanitized.length
        ? sanitized.reduce((sum, value) => sum + value, 0) / sanitized.length
        : latestPercent;

      return {
        percentages: sanitized,
        latestPercent,
        averagePercent,
      };
    },
    [dayBuckets.length]
  );

  const latestWeightVital = weightVitals[0];
  const latestWaistVital = waistVitals[0];
  const latestBloodPressure = bloodPressureVitals[0];

  const bmiValue = useMemo(() => {
    if (!riskFactors) return null;
    const weight =
      riskFactors.weightKg ??
      settings.userWeight ??
      (latestWeightVital ? toKg(latestWeightVital.value, latestWeightVital.unit) : null);
    const height = riskFactors.heightCm;
    if (!weight || !height) return null;
    const heightMeters = height / 100;
    if (heightMeters <= 0) return null;
    return weight / (heightMeters * heightMeters);
  }, [latestWeightVital, riskFactors, settings.userWeight]);

  const findriscResult = useMemo(() => {
    if (!calculators?.findriscEnabled || !riskFactors) return null;
    return calculateFindrisc({
      age: settings.userAge,
      gender: settings.userGender,
      bmi: bmiValue,
      waistCircumference: latestWaistVital?.value ?? null,
      factors: riskFactors,
    });
  }, [bmiValue, calculators?.findriscEnabled, latestWaistVital?.value, riskFactors, settings.userAge, settings.userGender]);

  const framinghamResult = useMemo(() => {
    if (!calculators?.framinghamEnabled || !riskFactors) return null;
    return calculateFraminghamSimplified({
      age: settings.userAge,
      gender: settings.userGender,
      bmi: bmiValue,
      systolicBP: latestBloodPressure?.systolic ?? null,
      smoking: riskFactors.smoking,
      bpMedication: riskFactors.bpMedication,
      historyHighGlucose: riskFactors.historyHighGlucose,
    });
  }, [bmiValue, calculators?.framinghamEnabled, latestBloodPressure?.systolic, riskFactors, settings.userAge, settings.userGender]);

  const riskScoresEnabled = Boolean(calculators?.findriscEnabled || calculators?.framinghamEnabled);
  const hasRiskScores = Boolean(findriscResult || framinghamResult);

  const findriscTrend = useMemo(() => {
    if (!findriscResult || !riskFactors) return null;
    const heightMeters = riskFactors.heightCm ? riskFactors.heightCm / 100 : null;

    const series = dayBuckets.map((date) => {
      const weightValue =
        findWeightBeforeDate(date) ?? riskFactors.weightKg ?? settings.userWeight ?? null;
      const bmiForDay =
        weightValue && heightMeters && heightMeters > 0
          ? weightValue / (heightMeters * heightMeters)
          : null;
      const waistValue = findWaistBeforeDate(date);

      return calculateFindrisc({
        age: settings.userAge,
        gender: settings.userGender,
        bmi: bmiForDay,
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
      const bmiForDay =
        weightValue && heightMeters && heightMeters > 0
          ? weightValue / (heightMeters * heightMeters)
          : null;
      const systolic = findSystolicBeforeDate(date) ?? latestBloodPressure?.systolic ?? null;

      return calculateFraminghamSimplified({
        age: settings.userAge,
        gender: settings.userGender,
        bmi: bmiForDay,
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

  const totalCholesterolVitals = useMemo(
    () =>
      vitals
        .filter(
          (v): v is CholesterolVital => v.type === VitalType.TotalCholesterol
        )
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
        ),
    [vitals]
  );

  const hdlCholesterolVitals = useMemo(
    () =>
      vitals
        .filter(
          (v): v is CholesterolVital => v.type === VitalType.HDLCholesterol
        )
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
        ),
    [vitals]
  );

  // Calculate averages from demo data
  const bpAvg = {
    systolic: Math.round(DEMO_DATA.bloodPressure.reduce((sum, d) => sum + d.systolic, 0) / 14),
    diastolic: Math.round(DEMO_DATA.bloodPressure.reduce((sum, d) => sum + d.diastolic, 0) / 14),
  };
  const weightAvg = DEMO_DATA.weight[13].weight; // Latest weight
  const bmiAvg = DEMO_DATA.weight[13].bmi;
  const glucoseAvg = (DEMO_DATA.bloodGlucose.reduce((sum, d) => sum + d.value, 0) / 14).toFixed(1);
  const waistAvg = (DEMO_DATA.waistCircumference.reduce((sum, d) => sum + d.value, 0) / 14).toFixed(1);
  const totalCholesterolAvg = (
    DEMO_DATA.totalCholesterolWeekly.reduce((sum, d) => sum + d.value, 0) / DEMO_DATA.totalCholesterolWeekly.length
  ).toFixed(2);
  const hdlCholesterolAvg = (
    DEMO_DATA.hdlCholesterolWeekly.reduce((sum, d) => sum + d.value, 0) / DEMO_DATA.hdlCholesterolWeekly.length
  ).toFixed(2);

  const quickAddOptions = [
    { type: VitalType.BloodPressure, label: t('add_vital.blood_pressure') },
    { type: VitalType.Glucose, label: t('add_vital.glucose') },
    { type: VitalType.Weight, label: t('add_vital.weight') },
    { type: VitalType.WaistCircumference, label: t('add_vital.waist_circumference') },
    { type: VitalType.TotalCholesterol, label: t('add_vital.total_cholesterol') },
    { type: VitalType.HDLCholesterol, label: t('add_vital.hdl_cholesterol') },
  ];

  const formatVitalLabel = (vitalType: VitalType) => {
    switch (vitalType) {
      case VitalType.BloodPressure:
        return t('add_vital.blood_pressure');
      case VitalType.Glucose:
        return t('vitals.blood_glucose');
      case VitalType.Weight:
        return t('add_vital.weight');
      case VitalType.WaistCircumference:
        return t('vitals.waist_circumference');
      case VitalType.TotalCholesterol:
        return t('vitals.total_cholesterol');
      case VitalType.HDLCholesterol:
        return t('vitals.hdl_cholesterol');
      default:
        return vitalType.replace('_', ' ').toUpperCase();
    }
  };

  const formatVitalValue = (vital: Vital) => {
    switch (vital.type) {
      case VitalType.BloodPressure:
        return `${vital.systolic}/${vital.diastolic} ${vital.unit}`;
      case VitalType.Glucose:
        return `${vital.value} ${vital.unit}`;
      case VitalType.Weight:
        return `${vital.value} ${vital.unit}`;
      case VitalType.WaistCircumference:
        return `${vital.value} cm`;
      case VitalType.TotalCholesterol:
      case VitalType.HDLCholesterol:
        return `${vital.value} mmol/L`;
      default:
        return `${'value' in vital ? vital.value : ''}`;
    }
  };

  const dailyDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    return dates;
  }, []);

  const weeklyStarts = useMemo(() => {
    const endOfWeek = new Date();
    endOfWeek.setHours(0, 0, 0, 0);
    const day = endOfWeek.getDay();
    endOfWeek.setDate(endOfWeek.getDate() - day);

    const starts: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(endOfWeek);
      start.setDate(endOfWeek.getDate() - i * 7);
      starts.push(start);
    }
    return starts;
  }, []);

  const systolicSeries = useMemo(
    () => aggregateDaily(dailyDates, bloodPressureVitals, (entry) => entry.systolic),
    [bloodPressureVitals, dailyDates]
  );

  const glucoseSeries = useMemo(
    () =>
      aggregateDaily(dailyDates, glucoseVitals, (entry) =>
        entry.unit === 'mmol/L'
          ? entry.value
          : entry.value * CONVERSIONS.glucoseMgdlToMmol
      ),
    [dailyDates, glucoseVitals]
  );

  const weightSeries = useMemo(
    () =>
      aggregateDaily(dailyDates, weightVitals, (entry) =>
        entry.unit === 'kg' ? entry.value : entry.value * CONVERSIONS.lbToKg
      ),
    [dailyDates, weightVitals]
  );

  const waistSeries = useMemo(
    () => aggregateDaily(dailyDates, waistVitals, (entry) => entry.value),
    [dailyDates, waistVitals]
  );

  const totalCholesterolWeekly = useMemo(
    () =>
      aggregateWeekly(weeklyStarts, totalCholesterolVitals, (entry) => entry.value),
    [totalCholesterolVitals, weeklyStarts]
  );

  const hdlCholesterolWeekly = useMemo(
    () =>
      aggregateWeekly(weeklyStarts, hdlCholesterolVitals, (entry) => entry.value),
    [hdlCholesterolVitals, weeklyStarts]
  );

  const systolicMax = useMemo(() => getMaxValue(systolicSeries), [systolicSeries]);
  const weightMax = useMemo(() => getMaxValue(weightSeries), [weightSeries]);
  const glucoseMax = useMemo(() => getMaxValue(glucoseSeries), [glucoseSeries]);
  const waistMax = useMemo(() => getMaxValue(waistSeries), [waistSeries]);
  const totalCholesterolMax = useMemo(
    () => getMaxValue(totalCholesterolWeekly),
    [totalCholesterolWeekly]
  );
  const hdlCholesterolMax = useMemo(
    () => getMaxValue(hdlCholesterolWeekly),
    [hdlCholesterolWeekly]
  );

  const hasData = (series: (number | null)[]) =>
    series.some((value) => value !== null);

  const renderBarSeries = (
    series: (number | null)[],
    maxValue: number | null,
    barStyle: any,
    getColor: (index: number, value: number | null) => string
  ) => {
    if (!hasData(series)) {
      return <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>;
    }
    return (
      <View style={styles.chartContainer}>
        {series.map((value, index) => {
          const height =
            value !== null && maxValue
              ? Math.max((value / maxValue) * 110, 4)
              : 4;
          return (
            <View key={index} style={styles.barGroup}>
              <View
                style={[
                  barStyle,
                  {
                    height,
                    backgroundColor: getColor(index, value),
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const renderWeeklySeries = (
    series: (number | null)[],
    maxValue: number | null,
    getColor: (index: number, value: number | null) => string
  ) => {
    if (!hasData(series)) {
      return <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>;
    }
    return (
      <View style={[styles.chartContainer, styles.weeklyChartContainer]}>
        {series.map((value, index) => {
          const height =
            value !== null && maxValue
              ? Math.max((value / maxValue) * 110, 4)
              : 4;
          return (
            <View key={index} style={styles.weeklyBarGroup}>
              <Text style={styles.weekLabel}>
                {t('vitals.week_label', { week: index + 1 })}
              </Text>
              <View
                style={[
                  styles.weeklyBar,
                  {
                    height,
                    backgroundColor: getColor(index, value),
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const average = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

  const bpAverages = useMemo(() => {
    if (!bloodPressureVitals.length) return null;
    const recent = bloodPressureVitals.slice(0, 5);
    return {
      systolic: average(recent.map((entry) => entry.systolic)),
      diastolic: average(recent.map((entry) => entry.diastolic)),
    };
  }, [bloodPressureVitals]);

  const weightStats = useMemo(() => {
    if (!weightVitals.length) return null;
    const latest = weightVitals[0];
    const recent = weightVitals.slice(0, 5);
    const avgKg = average(recent.map((entry) => toKg(entry.value, entry.unit)));
    const latestKg = toKg(latest.value, latest.unit);
    const heightCm = settings.riskFactors?.heightCm;
    const bmi =
      heightCm && heightCm > 0
        ? latestKg / Math.pow(heightCm / 100, 2)
        : undefined;
    return {
      latest,
      averageKg: avgKg ?? undefined,
      bmi,
      entries: recent,
    };
  }, [settings.riskFactors?.heightCm, weightVitals]);

  const glucoseStats = useMemo(() => {
    if (!glucoseVitals.length) return null;
    const recent = glucoseVitals.slice(0, 5);
    const latest = recent[0];
    const toMmol = (value: number, unit: 'mmol/L' | 'mg/dL') =>
      unit === 'mmol/L' ? value : value * CONVERSIONS.glucoseMgdlToMmol;
    const avgMmol = average(recent.map((entry) => toMmol(entry.value, entry.unit)));
    const averageInLatestUnit =
      latest.unit === 'mmol/L'
        ? avgMmol
        : avgMmol !== null && avgMmol !== undefined
        ? avgMmol / CONVERSIONS.glucoseMgdlToMmol
        : undefined;
    return {
      latest,
      average: averageInLatestUnit ?? undefined,
    };
  }, [glucoseVitals]);

  const waistStats = useMemo(() => {
    if (!waistVitals.length) return null;
    const recent = waistVitals.slice(0, 5);
    return {
      latest: recent[0],
      average: average(recent.map((entry) => entry.value)) ?? undefined,
      entries: recent,
    };
  }, [waistVitals]);

  const totalCholesterolStats = useMemo(() => {
    if (!totalCholesterolVitals.length) return null;
    const recent = totalCholesterolVitals.slice(0, 5);
    return {
      latest: recent[0],
      average: average(recent.map((entry) => entry.value)) ?? undefined,
      entries: recent,
    };
  }, [totalCholesterolVitals]);

  const hdlCholesterolStats = useMemo(() => {
    if (!hdlCholesterolVitals.length) return null;
    const recent = hdlCholesterolVitals.slice(0, 5);
    return {
      latest: recent[0],
      average: average(recent.map((entry) => entry.value)) ?? undefined,
      entries: recent,
    };
  }, [hdlCholesterolVitals]);

  const liveSections: Array<{ key: string; content: React.ReactNode }> = [];

  if (!isDemoMode && vitals.length > 0) {
    if (bloodPressureVitals.length) {
      liveSections.push({
        key: 'bp',
        content: (
          <>
            <Text style={styles.liveSectionTitle}>{t('vitals.blood_pressure_card_title')}</Text>
            <Text style={styles.liveSectionSubtitle}>{t('vitals.bp_normal_range')}</Text>
            {renderBarSeries(
              systolicSeries,
              systolicMax,
              styles.bar,
              (_, value) => (value !== null && value > 140 ? '#FF9999' : '#2C5F8D')
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {bloodPressureVitals[0].systolic}/{bloodPressureVitals[0].diastolic}
              </Text>
              <Text style={styles.realValueUnit}>mmHg</Text>
            </View>
            {bpAverages &&
              bpAverages.systolic !== null &&
              bpAverages.diastolic !== null && (
                <Text style={styles.realSecondaryText}>
                  {t('vitals.avg_bp', {
                    systolic: Math.round(bpAverages.systolic ?? 0),
                    diastolic: Math.round(bpAverages.diastolic ?? 0),
                  })}
                </Text>
              )}
            <View style={styles.realList}>
              {bloodPressureVitals.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {entry.systolic}/{entry.diastolic}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ),
      });
    }

    if (weightStats) {
      liveSections.push({
        key: 'weight',
        content: (
          <>
            <Text style={styles.liveSectionTitle}>{t('vitals.weight_card_title')}</Text>
            {renderBarSeries(
              weightSeries,
              weightMax,
              styles.weightBar,
              (index) => (index % 2 === 0 ? '#2C5F8D' : '#5B9BD5')
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {`${weightStats.latest.value.toFixed(1)} ${weightStats.latest.unit}`}
              </Text>
            </View>
            {weightStats.averageKg && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.weight_average', { avg: weightStats.averageKg.toFixed(1) })} kg
              </Text>
            )}
            {weightStats.bmi && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.bmi', { bmi: weightStats.bmi.toFixed(1) })}
              </Text>
            )}
            <View style={styles.realList}>
              {weightVitals.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(1)} ${entry.unit}`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ),
      });
    }

    if (glucoseStats) {
      liveSections.push({
        key: 'glucose',
        content: (
          <>
            <Text style={styles.liveSectionTitle}>{t('vitals.glucose_card_title')}</Text>
            <Text style={styles.liveSectionSubtitle}>{t('vitals.glucose_normal_range')}</Text>
            {renderBarSeries(
              glucoseSeries,
              glucoseMax,
              styles.bar,
              (_, value) => (value !== null && value > 7 ? '#FF9999' : '#E0E0E0')
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {glucoseStats.latest.value.toFixed(1)}
              </Text>
              <Text style={styles.realValueUnit}>{glucoseStats.latest.unit}</Text>
            </View>
            {glucoseStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_glucose', {
                  avg: glucoseStats.average.toFixed(1),
                })}
              </Text>
            )}
            <View style={styles.realList}>
              {glucoseVitals.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(1)} ${entry.unit}`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ),
      });
    }

    if (waistStats) {
      liveSections.push({
        key: 'waist',
        content: (
          <>
            <Text style={styles.liveSectionTitle}>
              {t('vitals.waist_circumference_card_title')}
            </Text>
            <Text style={styles.liveSectionSubtitle}>
              {t('vitals.waist_circumference_range')}
            </Text>
            {renderBarSeries(
              waistSeries,
              waistMax,
              styles.weightBar,
              (_, value) => (value !== null && value > 90 ? '#FF9999' : '#2C5F8D')
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {waistStats.latest.value.toFixed(1)}
              </Text>
              <Text style={styles.realValueUnit}>cm</Text>
            </View>
            {waistStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_waist', { avg: waistStats.average.toFixed(1) })}
              </Text>
            )}
            <View style={styles.realList}>
              {waistStats.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(1)} cm`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ),
      });
    }

    if (totalCholesterolStats) {
      liveSections.push({
        key: 'totalCholesterol',
        content: (
          <>
            <Text style={styles.liveSectionTitle}>
              {t('vitals.total_cholesterol_card_title')}
            </Text>
            <Text style={styles.liveSectionSubtitle}>
              {t('vitals.total_cholesterol_range')}
            </Text>
            {renderWeeklySeries(
              totalCholesterolWeekly,
              totalCholesterolMax,
              (_, value) => (value !== null && value > 5.2 ? '#FF9999' : '#2C5F8D')
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {totalCholesterolStats.latest.value.toFixed(2)}
              </Text>
              <Text style={styles.realValueUnit}>mmol/L</Text>
            </View>
            {totalCholesterolStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_total_cholesterol', {
                  avg: totalCholesterolStats.average.toFixed(2),
                })}
              </Text>
            )}
            <View style={styles.realList}>
              {totalCholesterolStats.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(2)} mmol/L`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ),
      });
    }

    if (hdlCholesterolStats) {
      liveSections.push({
        key: 'hdlCholesterol',
        content: (
          <>
            <Text style={styles.liveSectionTitle}>
              {t('vitals.hdl_cholesterol_card_title')}
            </Text>
            <Text style={styles.liveSectionSubtitle}>
              {t('vitals.hdl_cholesterol_range')}
            </Text>
            {renderWeeklySeries(
              hdlCholesterolWeekly,
              hdlCholesterolMax,
              (_, value) => (value !== null && value < 1.0 ? '#FF9999' : '#2C5F8D')
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {hdlCholesterolStats.latest.value.toFixed(2)}
              </Text>
              <Text style={styles.realValueUnit}>mmol/L</Text>
            </View>
            {hdlCholesterolStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_hdl_cholesterol', {
                  avg: hdlCholesterolStats.average.toFixed(2),
                })}
              </Text>
            )}
            <View style={styles.realList}>
              {hdlCholesterolStats.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(2)} mmol/L`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ),
      });
    }
  }

  const handleChatPress = () => {
    navigation.navigate('ChatBot');
  };

  const handleManageRiskPress = () => {
    navigation.navigate('RiskCalculators');
  };

  return (
    <View style={styles.container}>
      {/* Header with background */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('vitals.search_here')}
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Title */}
        <Text style={styles.headerTitle}>{t('vitals.vitals_tracker')}</Text>

        {/* AI Chat Button */}
        <TouchableOpacity style={styles.aiButton} onPress={handleChatPress}>
          <View style={styles.aiIconContainer}>
            <BotMessageSquare size={24} color={Colors.secondary.main} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCtaCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileCtaTitle}>{t('vitals.profile_cta_title')}</Text>
            <Text style={styles.profileCtaSubtitle}>{t('vitals.profile_cta_subtitle')}</Text>
          </View>
          <View style={styles.profileCtaButtons}>
            <TouchableOpacity
              style={[styles.profileCtaButton, styles.profileCtaPrimary]}
              onPress={() => navigation.navigate('HealthProfile')}
            >
              <Text style={styles.profileCtaPrimaryText}>{t('vitals.view_health_profile')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileCtaButton, styles.profileCtaSecondary]}
              onPress={() => navigation.navigate('RiskAssessment')}
            >
              <Text style={styles.profileCtaSecondaryText}>{t('vitals.update_risk_inputs')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.riskScoresCard}>
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
                  trendLabel={t('vitals.last_14_day_trend')}
                  averageLabel={t('vitals.fourteen_day_average')}
                  color={findriscResult.color}
                  latestPercent={findriscTrend.latestPercent}
                  averagePercent={findriscTrend.averagePercent}
                  percentages={findriscTrend.percentages}
                  category={findriscResult.category}
                  description={findriscResult.description}
                />
              )}
              {framinghamResult && framinghamTrend && (
                <RiskScoreTrendCard
                  title={framinghamResult.label}
                  trendLabel={t('vitals.last_14_day_trend')}
                  averageLabel={t('vitals.fourteen_day_average')}
                  color={framinghamResult.color}
                  latestPercent={framinghamTrend.latestPercent}
                  averagePercent={framinghamTrend.averagePercent}
                  percentages={framinghamTrend.percentages}
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

        {/* Demo Mode Toggle */}
        <TouchableOpacity
          style={styles.demoToggle}
          onPress={() => setIsDemoMode(!isDemoMode)}
        >
          <Text style={styles.demoToggleText}>
            {isDemoMode ? t('vitals.demo_mode_on') : t('vitals.real_data')}
          </Text>
        </TouchableOpacity>

        {weightStats && (
            <View style={styles.vitalCard}>
            <View style={styles.cardHeaderRow}>
              <View>
              <Text style={styles.cardTitle}>{t('vitals.weight_card_title')}</Text>
                <Text style={styles.cardSubtitle}>{t('vitals.weight_summary_subtitle')}</Text>
                  </View>
              {weightStats.bmi && (
                <View style={styles.metricChip}>
                  <Text style={styles.metricChipLabel}>{t('vitals.bmi_label')}</Text>
                  <Text style={styles.metricChipValue}>{weightStats.bmi.toFixed(1)}</Text>
              </View>
              )}
              </View>

            <Text style={styles.metricValue}>
              {`${weightStats.latest.value.toFixed(1)} ${weightStats.latest.unit}`}
            </Text>

            {weightStats.entries.length > 1 && (() => {
              const previous = weightStats.entries[1];
              const latestKg = toKg(weightStats.latest.value, weightStats.latest.unit);
              const previousKg = toKg(previous.value, previous.unit);
              const diff = latestKg - previousKg;
              if (Math.abs(diff) < 0.05) {
                return (
                  <Text style={styles.metricChange}>{t('vitals.weight_change_neutral')}</Text>
                );
              }
              const changeKey = diff > 0 ? 'vitals.weight_change_up' : 'vitals.weight_change_down';
              const changeStyle = diff > 0 ? styles.metricChangeUp : styles.metricChangeDown;
              return (
                <Text style={[styles.metricChange, changeStyle]}>
                  {t(changeKey, { value: Math.abs(diff).toFixed(1) })}
              </Text>
              );
            })()}

            {hasData(weightSeries) ? (
              <View style={styles.chartContainer}>
                {weightSeries.map((value, index) => {
                  const height =
                    value !== null && weightMax
                      ? Math.max((value / weightMax) * 110, 6)
                      : 6;
                  return (
                  <View key={index} style={styles.barGroup}>
                      <View
                        style={[
                          styles.weightBar,
                          {
                            height,
                            backgroundColor:
                              index % 2 === 0 ? '#2C5F8D' : '#5B9BD5',
                          },
                        ]}
                      />
                  </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>
            )}

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2C5F8D' }]} />
                <Text style={styles.legendText}>{t('vitals.weight_series_label')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#5B9BD5' }]} />
                <Text style={styles.legendText}>{t('vitals.bmi_series_label')}</Text>
                </View>
              </View>
            </View>
        )}

        {glucoseStats && (
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.glucose_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.glucose_normal_range')}</Text>
            {hasData(glucoseSeries) ? (
              <View style={styles.chartContainer}>
                {glucoseSeries.map((value, index) => {
                  const height =
                    value !== null && glucoseMax
                      ? Math.max((value / glucoseMax) * 110, 4)
                      : 4;
                  const isHigh = value !== null && value > 7;
                  return (
                  <View key={index} style={styles.barGroup}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: isHigh ? '#FF9999' : '#E0E0E0',
                          },
                        ]}
                      />
                  </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {glucoseStats.latest.value.toFixed(1)}
              </Text>
              <Text style={styles.realValueUnit}>{glucoseStats.latest.unit}</Text>
              </View>
            {glucoseStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_glucose', {
                  avg: glucoseStats.average.toFixed(1),
                })}
              </Text>
            )}
            <View style={styles.realList}>
              {glucoseVitals.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(1)} ${entry.unit}`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
            </View>
              ))}
            </View>
          </View>
        )}

        {waistStats && (
            <View style={styles.vitalCard}>
            <Text style={styles.cardTitle}>{t('vitals.waist_circumference_card_title')}</Text>
            <Text style={styles.cardSubtitle}>{t('vitals.waist_circumference_range')}</Text>
            {hasData(waistSeries) ? (
              <View style={styles.chartContainer}>
                {waistSeries.map((value, index) => {
                  const height =
                    value !== null && waistMax
                      ? Math.max((value / waistMax) * 110, 4)
                      : 4;
                  const isHigh = value !== null && value > 90;
                  return (
                  <View key={index} style={styles.barGroup}>
                      <View
                        style={[
                          styles.weightBar,
                          {
                            height,
                            backgroundColor: isHigh ? '#FF9999' : '#2C5F8D',
                          },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {waistStats.latest.value.toFixed(1)}
              </Text>
              <Text style={styles.realValueUnit}>cm</Text>
            </View>
            {waistStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_waist', { avg: waistStats.average.toFixed(1) })}
              </Text>
            )}
            <View style={styles.realList}>
              {waistStats.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(1)} cm`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                  </View>
                ))}
              </View>
          </View>
        )}

        {totalCholesterolStats && (
          <View style={styles.vitalCard}>
            <Text style={styles.cardTitle}>{t('vitals.total_cholesterol_card_title')}</Text>
            <Text style={styles.cardSubtitle}>{t('vitals.total_cholesterol_range')}</Text>
            {hasData(totalCholesterolWeekly) ? (
              <View style={[styles.chartContainer, styles.weeklyChartContainer]}>
                {totalCholesterolWeekly.map((value, index) => {
                  const height =
                    value !== null && totalCholesterolMax
                      ? Math.max((value / totalCholesterolMax) * 110, 4)
                      : 4;
                  const isHigh = value !== null && value > 5.2;
                  return (
                    <View key={index} style={styles.weeklyBarGroup}>
                      <Text style={styles.weekLabel}>
                        {t('vitals.week_label', { week: index + 1 })}
              </Text>
                      <View
                        style={[
                          styles.weeklyBar,
                          {
                            height,
                            backgroundColor: isHigh ? '#FF9999' : '#2C5F8D',
                          },
                        ]}
                      />
            </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {totalCholesterolStats.latest.value.toFixed(2)}
              </Text>
              <Text style={styles.realValueUnit}>mmol/L</Text>
              </View>
            {totalCholesterolStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_total_cholesterol', {
                  avg: totalCholesterolStats.average.toFixed(2),
                })}
              </Text>
            )}
            <View style={styles.realList}>
              {totalCholesterolStats.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(2)} mmol/L`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
            </View>
              ))}
            </View>
          </View>
        )}

        {hdlCholesterolStats && (
          <View style={styles.vitalCard}>
            <Text style={styles.cardTitle}>{t('vitals.hdl_cholesterol_card_title')}</Text>
            <Text style={styles.cardSubtitle}>{t('vitals.hdl_cholesterol_range')}</Text>
            {hasData(hdlCholesterolWeekly) ? (
              <View style={[styles.chartContainer, styles.weeklyChartContainer]}>
                {hdlCholesterolWeekly.map((value, index) => {
                  const height =
                    value !== null && hdlCholesterolMax
                      ? Math.max((value / hdlCholesterolMax) * 110, 4)
                      : 4;
                  const isLow = value !== null && value < 1.0;
                  return (
                    <View key={index} style={styles.weeklyBarGroup}>
                      <Text style={styles.weekLabel}>
                        {t('vitals.week_label', { week: index + 1 })}
                </Text>
                      <View
                        style={[
                          styles.weeklyBar,
                          {
                            height,
                            backgroundColor: isLow ? '#FF9999' : '#2C5F8D',
                          },
                        ]}
                      />
              </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noDataText}>{t('vitals.no_data_chart')}</Text>
            )}
            <View style={styles.realValueRow}>
              <Text style={styles.realValueMain}>
                {hdlCholesterolStats.latest.value.toFixed(2)}
                    </Text>
              <Text style={styles.realValueUnit}>mmol/L</Text>
            </View>
            {hdlCholesterolStats.average !== undefined && (
              <Text style={styles.realSecondaryText}>
                {t('vitals.avg_hdl_cholesterol', {
                  avg: hdlCholesterolStats.average.toFixed(2),
                })}
                    </Text>
            )}
            <View style={styles.realList}>
              {hdlCholesterolStats.entries.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.realListRow}>
                  <Text style={styles.realListValue}>
                    {`${entry.value.toFixed(2)} mmol/L`}
                  </Text>
                  <Text style={styles.realListDate}>{formatDate(entry.measuredAt)}</Text>
                  </View>
                ))}
            </View>
              </View>
        )}
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
    backgroundColor: Colors.background.vitals,
    paddingTop: Spacing['2xl'] + 10,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.inverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  aiButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing['2xl'] + 80,
  },
  aiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  vitalButton: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  vitalButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary.main,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // Demo Mode Styles
  demoToggle: {
    backgroundColor: '#4A6FA5',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  demoToggleText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  profileCtaCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius['3xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  profileCtaTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  profileCtaSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  profileCtaButtons: {
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  profileCtaButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  profileCtaPrimary: {
    backgroundColor: Colors.primary.main,
  },
  profileCtaPrimaryText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  profileCtaSecondary: {
    backgroundColor: Colors.background.primary,
  },
  profileCtaSecondaryText: {
    color: Colors.primary.main,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  sectionLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
  },
  riskScoresCard: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    gap: Spacing.md,
    ...Shadows.sm,
  },
  riskScoresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskScoresTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  riskTrendList: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  riskScoresEmpty: {
    gap: Spacing.sm,
  },
  riskScoresHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  riskScoresButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  riskScoresButtonText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  realValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  realValueMain: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  realValueUnit: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  realSecondaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  realList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginTop: Spacing.sm,
  },
  realListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  realListValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  realListDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  noDataText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  summaryHeader: {
    backgroundColor: '#F3F6FF',
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius['3xl'],
  },
  summaryTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  vitalCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius['3xl'],
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: 'rgba(74, 143, 189, 0.08)',
    gap: 6,
  },
  weeklyChartContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  weightBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  weeklyBarGroup: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyBar: {
    width: '60%',
    borderRadius: 6,
    minHeight: 8,
  },
  weekLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  chartLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'space-around',
    marginVertical: Spacing.md,
  },
  chartLine: {
    height: 1,
    backgroundColor: '#5B9BD5',
    opacity: 0.3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  avgText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  statusStable: {
    color: '#4CAF50',
    fontWeight: Typography.fontWeight.semibold,
  },
  statusElevated: {
    color: '#F5B800',
    fontWeight: Typography.fontWeight.semibold,
  },
  statusHealthy: {
    color: '#4CAF50',
    fontWeight: Typography.fontWeight.semibold,
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  weightValue: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  bmiBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  bmiText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  changeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  // Original data view styles
  oldVitalCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  vitalType: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  vitalDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.successLight,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  metricChipLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.status.successDark,
    fontWeight: Typography.fontWeight.semibold,
  },
  metricChipValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.successDark,
  },
  metricValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  metricChange: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricChangeUp: {
    color: Colors.status.warningDark,
  },
  metricChangeDown: {
    color: Colors.status.successDark,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
});
