import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, DoseStatus, VitalType } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { useSettingsStore } from '../stores/settingsStore';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HEART_ICON = require('../../assets/home_calculator_icon.png');
const GLUCOSE_ICON = require('../../assets/home_glucose_icon.png');

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const { todayDoses, loadMedications, loadTodayDoses, markDose, getUnacknowledgedHighRiskInteractions } = useMedicationStore();
  const { vitals, loadVitals } = useVitalsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnacknowledgedInteraction, setHasUnacknowledgedInteraction] = useState(false);

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
  }, [nextDose?.id, nextDose?.medicationId, nextDose?.medication?.acknowledgedInteractionIds?.length]);

  const timeUntilDose = useMemo(() => {
    if (!nextDose) return null;
    return formatDistanceToNow(new Date(nextDose.scheduledTime), { addSuffix: false });
  }, [nextDose]);

  const todayVitalsCount = useMemo(() => {
    const today = new Date().toDateString();
    return vitals.filter(v => new Date(v.measuredAt).toDateString() === today).length;
  }, [vitals]);

  const handleDoseDetailsPress = () => {
    if (nextDose) {
      navigation.navigate('MedicineDetail', { medicationId: nextDose.medicationId });
    }
  };

  const handleSearchPress = () => {
    navigation.navigate('AddMedicine', {} as any);
  };

  const handleCalculatorPress = (type: 'heart' | 'diabetes') => {
    if (type === 'heart') {
      navigation.navigate('RiskAssessment');
    } else {
      navigation.navigate('Vitals');
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchBar} activeOpacity={0.8} onPress={handleSearchPress}>
            <Search size={20} color={Colors.primary.dark} />
            <Text style={styles.searchPlaceholder}>{t('home.search_placeholder', 'Search here')}</Text>
          </TouchableOpacity>

          <Text style={styles.greetingText}>
            {greeting},{'\n'}{t('home.user_name', 'Friend')}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('home.health_risk_calculators', 'Health Risk Calculators')}</Text>
          <View style={styles.calculatorRow}>
            <TouchableOpacity
              style={styles.calculatorCard}
              activeOpacity={0.85}
              onPress={() => handleCalculatorPress('heart')}
            >
              <View style={styles.calculatorIconWrapper}>
                <Image source={HEART_ICON} style={styles.calculatorIcon} resizeMode="contain" />
              </View>
              <Text style={styles.calculatorTitle}>Framingham{ '\n' }Heart Disease Risk</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calculatorCard}
              activeOpacity={0.85}
              onPress={() => handleCalculatorPress('diabetes')}
            >
              <View style={styles.calculatorIconWrapper}>
                <Image source={GLUCOSE_ICON} style={styles.calculatorIcon} resizeMode="contain" />
              </View>
              <Text style={styles.calculatorTitle}>FINDRISC{ '\n' }Diabetes Risk</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.nextDoseLabel}>{t('home.next_dose_label', 'Next Dose:')}</Text>
          
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
  },
  heroSection: {
    backgroundColor: Colors.primary.dark,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl * 1.5,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  backIcon: {
    fontSize: 26,
    color: Colors.primary.contrast,
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
    marginBottom: Spacing.lg,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  calculatorCard: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    borderRadius: 24,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF0FD',
  },
  calculatorIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FFEDED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  calculatorIcon: {
    width: 32,
    height: 32,
  },
  calculatorTitle: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    lineHeight: 18,
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