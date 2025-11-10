import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DoseStatus, VitalType } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const { todayDoses, loadMedications, loadTodayDoses, markDose, isLoading: isLoadingMeds } = useMedicationStore();
  const { vitals, loadVitals, isLoading: isLoadingVitals } = useVitalsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMedications();
    loadTodayDoses();
    loadVitals();
  }, []);

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

  const handleTakeDose = async () => {
    if (nextDose) {
      try {
        await markDose(nextDose.id, DoseStatus.Taken);
        await loadTodayDoses();
      } catch (error) {
        console.error('HomeScreen: Error marking dose:', error);
      }
    }
  };

  const handleSkipDose = async () => {
    if (nextDose) {
      try {
        await markDose(nextDose.id, DoseStatus.Skipped);
        await loadTodayDoses();
      } catch (error) {
        console.error('HomeScreen: Error skipping dose:', error);
      }
    }
  };

  const timeUntilDose = useMemo(() => {
    if (!nextDose) return null;
    return formatDistanceToNow(new Date(nextDose.scheduledTime), { addSuffix: false });
  }, [nextDose]);

  const todayVitalsCount = useMemo(() => {
    const today = new Date().toDateString();
    return vitals.filter(v => new Date(v.measuredAt).toDateString() === today).length;
  }, [vitals]);

  const handleVitalsCardPress = () => {
    navigation.navigate('Vitals');
  };

  const handleDoseDetailsPress = () => {
    if (nextDose) {
      navigation.navigate('MedicineDetail', { medicationId: nextDose.medicationId });
    }
  };

  const isLoading = isLoadingMeds || isLoadingVitals;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.main}
          />
        }
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Today's Vitals Card */}
        {isLoading ? (
          <View style={styles.skeletonCard}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={handleVitalsCardPress}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitleRed}>{t('home.todays_vitals')}</Text>
            </View>

            <View style={styles.cardContent}>
              {todayVitalsCount > 0 ? (
                <View style={styles.vitalsContentCenter}>
                  <Text style={styles.vitalsCountText}>
                    {t('home.recorded_today', { count: todayVitalsCount })}
                  </Text>
                  <Text style={styles.vitalsHintText}>
                    {t('home.tap_to_view_details')}
                  </Text>
                </View>
              ) : (
                <View style={styles.vitalsContentCenter}>
                  <Text style={styles.vitalsEmptyText}>
                    {t('home.no_vitals_recorded')}
                  </Text>
                  <Text style={styles.vitalsHintText}>
                    {t('home.tap_to_add_vitals')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.quickAddTitle}>{t('home.quick_add')}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => navigation.navigate('AddVital', { type: VitalType.BloodPressure })}
                >
                  <Text style={styles.quickAddButtonText}>{t('home.bp')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => navigation.navigate('AddVital', { type: VitalType.Glucose })}
                >
                  <Text style={styles.quickAddButtonText}>{t('home.glucose')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => navigation.navigate('AddVital', { type: VitalType.Weight })}
                >
                  <Text style={styles.quickAddButtonText}>{t('home.weight')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Next Dose Card */}
        {isLoading ? (
          <View style={styles.skeletonCard}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
          </View>
        ) : nextDose ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitleYellow}>{t('home.next_dose')}</Text>
            </View>

            <View style={styles.cardContentCenter}>
              <TouchableOpacity onPress={handleDoseDetailsPress}>
                <Text style={styles.medicationName}>
                  {nextDose.medication.mims.brandName || nextDose.medication.mims.genericName}
                </Text>
              </TouchableOpacity>
              <Text style={styles.doseTimeText}>
                {t('home.in')} {timeUntilDose}
              </Text>
            </View>

            <View style={styles.cardFooterRow}>
              <TouchableOpacity
                style={styles.takeDoseButton}
                onPress={handleTakeDose}
              >
                <Text style={styles.takeDoseButtonText}>{t('home.take')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipDoseButton}
                onPress={handleSkipDose}
              >
                <Text style={styles.skipDoseButtonText}>{t('home.skip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitleYellow}>{t('home.next_dose')}</Text>
            </View>
            <View style={styles.cardContentCenter}>
              <Text style={styles.noDosesText}>{t('home.no_upcoming_doses')}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
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
    color: Colors.text.primary,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  skeletonCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  cardHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cardTitleRed: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary.main,
  },
  cardTitleYellow: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: '#F5B800',
  },
  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  cardContentCenter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  vitalsContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  vitalsCountText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  vitalsEmptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  vitalsHintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  cardFooter: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  cardFooterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: 0,
  },
  quickAddTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: Colors.secondary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickAddButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  medicationName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: '#F5B800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  doseTimeText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  takeDoseButton: {
    backgroundColor: '#F5B800',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  takeDoseButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  skipDoseButton: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  skipDoseButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  noDosesText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.tertiary,
  },
});
