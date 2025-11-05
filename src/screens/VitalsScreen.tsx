/**
 * VitalsScreen - Vitals Tracker
 * Matches Figma design: Vitals 1.png, Vitals 2.png, Vitals 3.png
 * Features hard-coded demo data for presentations
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { VitalType } from '../types';
import { Search, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

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
  glucose: [
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
  cholesterol: [
    { day: 1, value: 5.0 },
    { day: 2, value: 4.9 },
    { day: 3, value: 5.2 },
    { day: 4, value: 5.5 },
    { day: 5, value: 6.8 },
    { day: 6, value: 7.0 },
    { day: 7, value: 6.2 },
    { day: 8, value: 5.8 },
    { day: 9, value: 5.5 },
    { day: 10, value: 5.2 },
    { day: 11, value: 5.0 },
    { day: 12, value: 6.5 },
    { day: 13, value: 6.8 },
    { day: 14, value: 5.9 },
  ],
};

export default function VitalsScreen() {
  const { t } = useTranslation();
  const { vitals, loadVitals } = useVitalsStore();
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
  const glucoseAvg = (DEMO_DATA.glucose.reduce((sum, d) => sum + d.value, 0) / 14).toFixed(1);
  const cholesterolAvg = (DEMO_DATA.cholesterol.reduce((sum, d) => sum + d.value, 0) / 14).toFixed(2);

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
        <TouchableOpacity style={styles.aiButton}>
          <View style={styles.aiIconContainer}>
            <MessageSquare size={24} color={Colors.secondary.main} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

            {/* Glucose Levels Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.glucose_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.glucose_normal_range')}</Text>

              <View style={styles.chartContainer}>
                {DEMO_DATA.glucose.map((data, index) => (
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

            {/* Cholesterol Card */}
            <View style={styles.vitalCard}>
              <Text style={styles.cardTitle}>{t('vitals.cholesterol_card_title')}</Text>
              <Text style={styles.cardSubtitle}>{t('vitals.cholesterol_normal_range')}</Text>

              <View style={styles.chartContainer}>
                {DEMO_DATA.cholesterol.map((data, index) => (
                  <View key={index} style={styles.barGroup}>
                    <View style={[styles.weightBar, { 
                      height: data.value * 15,
                      backgroundColor: index % 2 === 0 ? '#2C5F8D' : '#5B9BD5'
                    }]} />
                  </View>
                ))}
              </View>

              <Text style={styles.avgText}>
                {t('vitals.avg_cholesterol', { avg: cholesterolAvg })} — <Text style={styles.statusHealthy}>{t('vitals.healthy')}</Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Original real data view */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('home.quick_add')}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.vitalButton}
                  onPress={() => navigation.navigate('AddVital', { type: VitalType.BloodPressure })}
                >
                  <Text style={styles.vitalButtonText}>{t('add_vital.blood_pressure')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.vitalButton}
                  onPress={() => navigation.navigate('AddVital', { type: VitalType.Glucose })}
                >
                  <Text style={styles.vitalButtonText}>{t('add_vital.glucose')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.vitalButton}
                  onPress={() => navigation.navigate('AddVital', { type: VitalType.Weight })}
                >
                  <Text style={styles.vitalButtonText}>{t('add_vital.weight')}</Text>
                </TouchableOpacity>
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
                    <Text style={styles.vitalType}>{vital.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.vitalValue}>
                      {vital.type === VitalType.BloodPressure
                        ? `${vital.systolic}/${vital.diastolic} ${vital.unit}`
                        : `${vital.value} ${vital.unit}`}
                    </Text>
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
    gap: Spacing.sm,
  },
  vitalButton: {
    flex: 1,
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
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