/**
 * VitalsScreen - Vitals Tracker
 * Matches Figma design: Vitals 1.png, Vitals 2.png, Vitals 3.png
 * Features hard-coded demo data for presentations
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Vital, VitalType } from '../types';
import { Search, BotMessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../stores/settingsStore';
import { RiskScoreCircle } from '../components';
import { calculateFindrisc, calculateFraminghamSimplified } from '../utils/riskScores';

// Hard-coded demo data for 14 days
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
  const { vitals, loadVitals, getLatestByType } = useVitalsStore();
  const settings = useSettingsStore((state) => state.settings);
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true); // Toggle for demo data

  useEffect(() => {
    loadVitals();
  }, []);

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

  const calculators = settings.riskCalculators;
  const riskFactors = settings.riskFactors;

  const latestWaist = useMemo(
    () => getLatestByType(VitalType.WaistCircumference),
    [getLatestByType, vitals]
  );
  const latestWeight = useMemo(
    () => getLatestByType(VitalType.Weight),
    [getLatestByType, vitals]
  );
  const latestBloodPressure = useMemo(
    () => getLatestByType(VitalType.BloodPressure),
    [getLatestByType, vitals]
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
    if (!calculators?.findriscEnabled || !riskFactors) return null;
    return calculateFindrisc({
      age: settings.userAge,
      gender: settings.userGender,
      bmi: bmiValue,
      waistCircumference: latestWaist?.value ?? null,
      factors: riskFactors,
    });
  }, [bmiValue, calculators?.findriscEnabled, latestWaist?.value, riskFactors, settings.userAge, settings.userGender]);

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
  }, [
    bmiValue,
    calculators?.framinghamEnabled,
    latestBloodPressure?.systolic,
    riskFactors,
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

  const bmiStatus: SummaryStatus = useMemo(() => {
    if (!bmiValue) return 'moderate';
    if (bmiValue < 23) return 'good';
    if (bmiValue < 27.5) return 'moderate';
    return 'bad';
  }, [bmiValue]);

  const familyHistoryStatus: SummaryStatus = useMemo(() => {
    if (!riskFactors) return 'moderate';
    if (riskFactors.familyHistory === 'immediate') return 'bad';
    if (riskFactors.familyHistory === 'extended') return 'moderate';
    return 'good';
  }, [riskFactors]);

  const summaryItems = useMemo(() => {
    if (!riskFactors) return [];
    const familyLabel =
      riskFactors.familyHistory === 'immediate'
        ? t('risk.family_immediate')
        : riskFactors.familyHistory === 'extended'
        ? t('risk.family_extended')
        : t('risk.family_none');

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
    ] as Array<{ key: string; label: string; value: string; status: SummaryStatus }>;
  }, [bmiStatus, bmiValue, familyHistoryStatus, riskFactors, settings.userAge, settings.userGender, t]);

  const handleChatPress = () => {
    navigation.navigate('ChatBot');
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
        {riskFactors && summaryItems.length > 0 && (
          <View style={styles.riskSummaryCard}>
            <View style={styles.riskSummaryHeader}>
              <Text style={styles.riskSummaryTitle}>{t('vitals.risk_summary_title')}</Text>
              <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('RiskCalculators')}>
                <Text style={styles.manageButtonText}>{t('vitals.manage_risk_inputs')}</Text>
              </TouchableOpacity>
            </View>

            {(findriscResult || framinghamResult) ? (
              <View style={styles.riskScoreRow}>
                {findriscResult && (
                  <View style={[styles.riskScoreItem, styles.riskScoreCard]}>
                    <RiskScoreCircle result={findriscResult} />
                  </View>
                )}
                {framinghamResult && (
                  <View style={[styles.riskScoreItem, styles.riskScoreCard]}>
                    <RiskScoreCircle result={framinghamResult} />
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.riskSummaryHint}>{t('vitals.enable_scores_hint')}</Text>
            )}

            <View style={styles.riskSummaryGrid}>
              {summaryItems.map((item) => {
                const colors = getStatusColors(item.status);
                return (
                  <View
                    key={item.key}
                    style={[
                      styles.riskSummaryItem,
                      { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor },
                    ]}
                  >
                    <Text style={[styles.riskSummaryLabel, { color: colors.textColor }]}>
                      {item.label}
                    </Text>
                    <Text style={styles.riskSummaryValue}>{item.value}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Demo Mode Toggle */}
        <TouchableOpacity
          style={styles.demoToggle}
          onPress={() => setIsDemoMode(!isDemoMode)}
        >
          <Text style={styles.demoToggleText}>
            {isDemoMode ? t('vitals.demo_mode_on') : t('vitals.real_data')}
          </Text>
        </TouchableOpacity>

        {isDemoMode ? (
          <>
            {/* 14-Day Summary Header */}
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>{t('vitals.summary_title')}</Text>
            </View>

            {/* Blood Pressure Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.blood_pressure_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.bp_normal_range')}</Text>
              
              {/* Simple bar chart visualization */}
              <View style={styles.chartContainer}>
                {DEMO_DATA.bloodPressure.map((data, index) => (
                  <View key={index} style={styles.barGroup}>
                    <View style={[styles.bar, { 
                      height: (data.systolic - 60) * 1.5, 
                      backgroundColor: data.systolic > 130 ? '#FF9999' : '#E0E0E0' 
                    }]} />
                  </View>
                ))}
              </View>

              {/* Chart lines (simplified) */}
              <View style={styles.chartLinesContainer}>
                <View style={styles.chartLine} />
                <View style={styles.chartLine} />
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2C5F8D' }]} />
                  <Text style={styles.legendText}>{t('vitals.systolic')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#5B9BD5' }]} />
                  <Text style={styles.legendText}>{t('vitals.diastolic')}</Text>
                </View>
              </View>

              <Text style={styles.avgText}>
                {t('vitals.avg_bp', { systolic: bpAvg.systolic, diastolic: bpAvg.diastolic })} — <Text style={styles.statusStable}>{t('vitals.stable')}</Text>
              </Text>
            </View>

            {/* Weight Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.weight_card_title')}</Text>
              <View style={styles.weightHeader}>
                <Text style={styles.weightValue}>{weightAvg} kg</Text>
                <View style={styles.bmiBadge}>
                  <Text style={styles.bmiText}>{t('vitals.bmi', { bmi: bmiAvg })}</Text>
                </View>
              </View>
              <Text style={styles.changeText}>{t('vitals.weight_change_since_last_week')}</Text>

              {/* Bar chart for weight */}
              <View style={styles.chartContainer}>
                {DEMO_DATA.weight.map((data, index) => (
                  <View key={index} style={styles.barGroup}>
                    <View style={[styles.weightBar, { 
                      height: (data.weight - 40) * 3,
                      backgroundColor: index % 2 === 0 ? '#2C5F8D' : '#5B9BD5'
                    }]} />
                  </View>
                ))}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2C5F8D' }]} />
                  <Text style={styles.legendText}>{t('add_vital.weight')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#5B9BD5' }]} />
                  <Text style={styles.legendText}>{t('vitals.bmi', { bmi: '' })}</Text>
                </View>
              </View>
            </View>

            {/* Blood Glucose Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.glucose_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.glucose_normal_range')}</Text>

              <View style={styles.chartContainer}>
                {DEMO_DATA.bloodGlucose.map((data, index) => (
                  <View key={index} style={styles.barGroup}>
                    <View style={[styles.bar, { 
                      height: data.value * 15, 
                      backgroundColor: data.value > 7 ? '#FF9999' : '#E0E0E0' 
                    }]} />
                  </View>
                ))}
              </View>

              <View style={styles.chartLinesContainer}>
                <View style={styles.chartLine} />
              </View>

              <Text style={styles.avgText}>
                {t('vitals.avg_glucose', { avg: glucoseAvg })} — <Text style={styles.statusElevated}>{t('vitals.slightly_elevated')}</Text>
              </Text>
            </View>

            {/* Waist Circumference Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.waist_circumference_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.waist_circumference_range')}</Text>

              <View style={styles.chartContainer}>
                {DEMO_DATA.waistCircumference.map((data, index) => (
                  <View key={index} style={styles.barGroup}>
                    <View style={[styles.weightBar, { 
                      height: (data.value - 70) * 4,
                      backgroundColor: data.value > 90 ? '#FF9999' : '#2C5F8D'
                    }]} />
                  </View>
                ))}
              </View>

              <Text style={styles.avgText}>
                {t('vitals.avg_waist', { avg: waistAvg })} — <Text style={styles.statusHealthy}>{t('vitals.trending_down')}</Text>
              </Text>
            </View>

            {/* Total Cholesterol Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.total_cholesterol_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.total_cholesterol_range')}</Text>

              <View style={[styles.chartContainer, styles.weeklyChartContainer]}>
                {DEMO_DATA.totalCholesterolWeekly.map((data, index) => (
                  <View key={index} style={styles.weeklyBarGroup}>
                    <Text style={styles.weekLabel}>{t('vitals.week_label', { week: data.week })}</Text>
                    <View style={[styles.weeklyBar, {
                      height: data.value * 20,
                      backgroundColor: data.value > 5.2 ? '#FF9999' : '#2C5F8D'
                    }]} />
                  </View>
                ))}
              </View>

              <Text style={styles.avgText}>
                {t('vitals.avg_total_cholesterol', { avg: totalCholesterolAvg })} — <Text style={styles.statusHealthy}>{t('vitals.healthy')}</Text>
              </Text>
            </View>

            {/* HDL Cholesterol Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.hdl_cholesterol_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.hdl_cholesterol_range')}</Text>

              <View style={[styles.chartContainer, styles.weeklyChartContainer]}>
                {DEMO_DATA.hdlCholesterolWeekly.map((data, index) => (
                  <View key={index} style={styles.weeklyBarGroup}>
                    <Text style={styles.weekLabel}>{t('vitals.week_label', { week: data.week })}</Text>
                    <View style={[styles.weeklyBar, {
                      height: data.value * 80,
                      backgroundColor: data.value < 1.0 ? '#FF9999' : '#2C5F8D'
                    }]} />
                  </View>
                ))}
              </View>

              <Text style={styles.avgText}>
                {t('vitals.avg_hdl_cholesterol', { avg: hdlCholesterolAvg })} — <Text style={styles.statusStable}>{t('vitals.stable')}</Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Original real data view */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('home.quick_add')}</Text>
              <View style={styles.buttonRow}>
                {quickAddOptions.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={styles.vitalButton}
                    onPress={() => navigation.navigate('AddVital', { type: option.type })}
                  >
                    <Text style={styles.vitalButtonText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {vitals.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>{t('vitals.no_vitals_yet')}</Text>
                <Text style={styles.emptyStateText}>
                  {t('vitals.start_tracking_vitals')}
                </Text>
              </View>
            )}

            {vitals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('vitals.recent_readings')}</Text>
                {vitals.slice(0, 10).map((vital) => (
                  <View key={vital.id} style={styles.oldVitalCard}>
                    <Text style={styles.vitalType}>{formatVitalLabel(vital.type)}</Text>
                    <Text style={styles.vitalValue}>{formatVitalValue(vital)}</Text>
                    <Text style={styles.vitalDate}>
                      {new Date(vital.measuredAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
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
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.lg,
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
  riskSummaryCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    ...Shadows.sm,
  },
  riskSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  riskSummaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  manageButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.badge,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  riskScoreRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  riskScoreItem: {
    width: '100%',
    alignItems: 'center',
  },
  riskScoreCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    ...Shadows.sm,
  },
  riskSummaryHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  riskSummaryGrid: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  riskSummaryItem: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  riskSummaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
    color: Colors.text.secondary,
  },
  riskSummaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  summaryHeader: {
    backgroundColor: '#E8E5F2',
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.card,
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
    marginTop: Spacing.md,
    borderRadius: BorderRadius.card,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: Spacing.md,
    gap: 4,
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
});