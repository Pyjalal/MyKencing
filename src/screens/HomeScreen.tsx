import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
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
  const { todayDoses, loadMedications, loadTodayDoses, markDose } = useMedicationStore();
  const { vitals, loadVitals } = useVitalsStore();
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.vitalsCard}
          onPress={handleVitalsCardPress}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitleVitals}>{t('home.todays_vitals')}</Text>
          {todayVitalsCount > 0 ? (
            <View style={styles.vitalsPlaceholder}>
              <Text style={styles.vitalsCountText}>{t('home.recorded_today', { count: todayVitalsCount })}</Text>
              <Text style={styles.tapHintText}>{t('home.tap_to_view_details')}</Text>
            </View>
          ) : (
            <View style={styles.vitalsPlaceholder}>
              <Text style={styles.emptyText}>{t('home.no_vitals_recorded')}</Text>
              <Text style={styles.tapHintText}>{t('home.tap_to_add_vitals')}</Text>
            </View>
          )}

          <View style={styles.quickVitalsContainer}>
            <Text style={styles.quickVitalsTitle}>{t('home.quick_add')}</Text>
            <View style={styles.quickVitalsRow}>
              <TouchableOpacity
                style={styles.quickVitalButton}
                onPress={() => navigation.navigate('AddVital', { type: VitalType.BloodPressure })}
              >
                <Text style={styles.quickVitalButtonText}>{t('home.bp')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickVitalButton}
                onPress={() => navigation.navigate('AddVital', { type: VitalType.Glucose })}
              >
                <Text style={styles.quickVitalButtonText}>{t('home.glucose')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickVitalButton}
                onPress={() => navigation.navigate('AddVital', { type: VitalType.Weight })}
              >
                <Text style={styles.quickVitalButtonText}>{t('home.weight')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {nextDose ? (
          <View style={styles.doseCard}>
            <Text style={styles.cardTitleDose}>{t('home.next_dose')}</Text>
            <TouchableOpacity
              style={styles.doseBadge}
              onPress={handleDoseDetailsPress}
              activeOpacity={0.8}
            >
              <Text style={styles.doseBadgeText}>
                {nextDose.medication.mims.brandName || nextDose.medication.mims.genericName}
              </Text>
            </TouchableOpacity>
            <Text style={styles.doseTime}>{t('home.in')} {timeUntilDose}</Text>
            <View style={styles.doseActions}>
              <TouchableOpacity style={styles.takeButton} onPress={handleTakeDose}>
                <Text style={styles.takeButtonText}>{t('home.take')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipDose}>
                <Text style={styles.skipButtonText}>{t('home.skip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.doseCard}>
            <Text style={styles.cardTitleDose}>{t('home.next_dose')}</Text>
            <View style={styles.noDoseContainer}>
              <Text style={styles.noDoseText}>{t('home.no_upcoming_doses')}</Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 20,
    paddingBottom: 100, // Space for bottom nav
  },
  vitalsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  doseCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  cardTitleVitals: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary.main, // Coral/red color
    marginBottom: Spacing.lg,
  },
  cardTitleDose: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent.main, // Yellow/gold color
    marginBottom: Spacing.md,
  },
  vitalsPlaceholder: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsCountText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  tapHintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  doseBadge: {
    backgroundColor: Colors.accent.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 28,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  doseBadgeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.contrast,
  },
  doseTime: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  foodInstructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.warningLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  foodInstructionsIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  foodInstructionsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  doseActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  takeButton: {
    backgroundColor: Colors.accent.main,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.xl + Spacing.md,
    borderRadius: 20,
    minWidth: 100,
  },
  takeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent.contrast,
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: Colors.neutral[300],
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.xl + Spacing.md,
    borderRadius: 20,
    minWidth: 100,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  noDoseContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  noDoseText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.tertiary,
  },
  quickVitalsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  quickVitalsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quickVitalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickVitalButton: {
    flex: 1,
    backgroundColor: Colors.secondary.main,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickVitalButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondary.contrast,
  },
});