/**
 * HomeScreen - Today's Dashboard
 * Redesigned with elderly-friendly UI components
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, DoseStatus } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../constants/theme';
import { DoseCard, StatCard, PrimaryButton, MedicationCard } from '../components';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const { todayDoses, medications, loadMedications, loadTodayDoses, markDose } =
    useMedicationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMedications();
    loadTodayDoses();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMedications(), loadTodayDoses()]);
    setRefreshing(false);
  }, [loadMedications, loadTodayDoses]);

  // Calculate adherence statistics
  const adherenceStats = useMemo(() => {
    const takenCount = todayDoses.filter((d) => d.status === 'taken').length;
    const totalCount = todayDoses.length;
    const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

    // Calculate streak (simplified - should be calculated from historical data)
    const streak = takenCount === totalCount && totalCount > 0 ? 1 : 0;

    return { takenCount, totalCount, percentage, streak };
  }, [todayDoses]);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning') || 'Good Morning';
    if (hour < 18) return t('good_afternoon') || 'Good Afternoon';
    return t('good_evening') || 'Good Evening';
  }, [t]);

  // Separate doses by status for better organization
  const { pendingDoses, upcomingDoses, completedDoses } = useMemo(() => {
    const now = new Date();
    return {
      pendingDoses: todayDoses.filter((d) => d.status === 'pending' || d.status === 'late'),
      upcomingDoses: todayDoses.filter((d) => d.status === 'upcoming'),
      completedDoses: todayDoses.filter((d) => d.status === 'taken'),
    };
  }, [todayDoses]);

  const handleTakeDose = useCallback(
    async (doseId: string) => {
      await markDose(doseId, 'taken');
    },
    [markDose]
  );

  const handleSkipDose = useCallback(
    async (doseId: string) => {
      await markDose(doseId, 'skipped');
    },
    [markDose]
  );

  // Empty state
  if (medications.length === 0 && todayDoses.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary.main, Colors.primary.dark]}
          style={styles.header}
        >
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-MY', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </LinearGradient>

        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>{t('no_medications') || 'No Medications Yet'}</Text>
          <Text style={styles.emptyText}>
            {t('empty_medication_text') ||
              'Start managing your medications by scanning a prescription or adding manually'}
          </Text>

          <PrimaryButton
            title={t('scan_prescription') || 'Scan Prescription'}
            onPress={() => navigation.navigate('ScanPrescription')}
            variant="primary"
            size="large"
            icon={<Text style={styles.buttonIcon}>📷</Text>}
            style={styles.emptyButton}
          />

          <PrimaryButton
            title={t('add_manually') || 'Add Manually'}
            onPress={() => navigation.navigate('AddMedicine', {})}
            variant="outline"
            size="large"
            icon={<Text style={styles.buttonIcon}>➕</Text>}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <LinearGradient
          colors={[Colors.primary.main, Colors.primary.dark]}
          style={styles.header}
        >
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-MY', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Adherence Streak Card */}
          {todayDoses.length > 0 && (
            <StatCard
              title={t('adherence_today') || 'Today\'s Adherence'}
              value={`${adherenceStats.takenCount}/${adherenceStats.totalCount}`}
              icon="🎯"
              streak={adherenceStats.streak}
              gradient={
                adherenceStats.percentage >= 80
                  ? [Colors.status.success, Colors.status.successDark]
                  : adherenceStats.percentage >= 50
                  ? [Colors.status.warning, Colors.status.warningDark]
                  : [Colors.status.error, Colors.status.errorDark]
              }
              textColor="#FFFFFF"
            />
          )}

          {/* Pending Doses Section */}
          {pendingDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('next_doses') || 'Next Doses'} ({pendingDoses.length})
              </Text>
              {pendingDoses.map((dose) => (
                <View key={dose.id} style={styles.cardSpacing}>
                  <DoseCard
                    medicationName={dose.medication.mims.brandName || dose.medication.mims.genericName}
                    dosage={dose.medication.userDosage}
                    time={new Date(dose.scheduledTime).toLocaleTimeString('en-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    status={dose.status as DoseStatus}
                    foodInstructions={dose.medication.mims.foodInstructions || undefined}
                    onTakeDose={() => handleTakeDose(dose.id)}
                    onSkipDose={() => handleSkipDose(dose.id)}
                    onViewDetails={() =>
                      navigation.navigate('MedicineDetail', { medicationId: dose.medicationId })
                    }
                  />
                </View>
              ))}
            </View>
          )}

          {/* Quick Vitals Entry Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('quick_vitals') || 'Quick Vitals'}</Text>
            <View style={styles.vitalsGrid}>
              <TouchableOpacity style={styles.vitalButton} onPress={() => {}}>
                <Text style={styles.vitalIcon}>🩸</Text>
                <Text style={styles.vitalLabel}>{t('blood_pressure') || 'Blood Pressure'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.vitalButton} onPress={() => {}}>
                <Text style={styles.vitalIcon}>🩺</Text>
                <Text style={styles.vitalLabel}>{t('blood_sugar') || 'Blood Sugar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.vitalButton} onPress={() => {}}>
                <Text style={styles.vitalIcon}>⚖️</Text>
                <Text style={styles.vitalLabel}>{t('weight') || 'Weight'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.vitalButton} onPress={() => {}}>
                <Text style={styles.vitalIcon}>🌡️</Text>
                <Text style={styles.vitalLabel}>{t('temperature') || 'Temperature'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* All Medications Section */}
          {medications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('your_medications') || 'Your Medications'}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                  <Text style={styles.viewAllLink}>{t('view_all') || 'View All'}</Text>
                </TouchableOpacity>
              </View>

              {medications.slice(0, 3).map((med) => (
                <View key={med.id} style={styles.cardSpacing}>
                  <MedicationCard
                    medicationName={med.mims.brandName || med.mims.genericName}
                    dosage={med.userDosage}
                    frequency={`${med.frequency}x daily`}
                    times={med.times}
                    adherencePercentage={85} // TODO: Calculate from actual data
                    isActive={med.isActive}
                    onPress={() => navigation.navigate('MedicineDetail', { medicationId: med.id })}
                    onMenuPress={() => {}}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Completed Doses */}
          {completedDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('completed_today') || 'Completed Today'} ({completedDoses.length})
              </Text>
              {completedDoses.slice(0, 3).map((dose) => (
                <View key={dose.id} style={styles.cardSpacing}>
                  <DoseCard
                    medicationName={dose.medication.mims.brandName || dose.medication.mims.genericName}
                    dosage={dose.medication.userDosage}
                    time={new Date(dose.scheduledTime).toLocaleTimeString('en-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    status="taken"
                    onViewDetails={() =>
                      navigation.navigate('MedicineDetail', { medicationId: dose.medicationId })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicine', {})}
        accessibilityRole="button"
        accessibilityLabel={t('add_medication') || 'Add Medication'}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },

  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    minHeight: Layout.headerHeight,
  },

  greeting: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },

  headerDate: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.inverse,
    opacity: 0.9,
  },

  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
  },

  section: {
    marginBottom: Spacing.sectionSpacing,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  viewAllLink: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.main,
  },

  cardSpacing: {
    marginBottom: Spacing.md,
  },

  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  vitalButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    ...Shadows.sm,
  },

  vitalIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },

  vitalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },

  emptyTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing.md,
  },

  emptyButton: {
    marginBottom: Spacing.md,
    width: '100%',
  },

  buttonIcon: {
    fontSize: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: Layout.tabBarHeight,
    height: Layout.tabBarHeight,
    borderRadius: Layout.tabBarHeight / 2,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },

  fabText: {
    fontSize: 32,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
  },
});
