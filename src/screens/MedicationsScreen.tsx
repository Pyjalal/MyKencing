import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DoseStatus } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTranslation } from 'react-i18next';
import { ScreenLayout, PillButton } from '../components';
import { addDays, startOfWeek, format, isSameDay, parseISO, getYear, isToday, isTomorrow, isYesterday } from 'date-fns';
import { enUS, ms as msLocale } from 'date-fns/locale';

type MedicationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function MedicationsScreen({ navigation }: MedicationsScreenProps) {
  const { t, i18n } = useTranslation();
  const { weekDoses, loadMedications, loadWeekDoses, markDose } = useMedicationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get current locale for date-fns
  const dateLocale = i18n.language === 'ms' ? msLocale : enUS;

  // Generate week days (Sun-Sat)
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Navigate to previous week
  const goToPreviousWeek = React.useCallback(() => {
    setSelectedDate((current) => addDays(current, -7));
  }, []);

  // Navigate to next week
  const goToNextWeek = React.useCallback(() => {
    setSelectedDate((current) => addDays(current, 7));
  }, []);

  // Create pan gesture for swipe navigation
  const panGesture = useMemo(() => 
    Gesture.Pan()
      .activeOffsetX([-10, 10]) // Require horizontal movement to activate
      .failOffsetY([-10, 10]) // Cancel if vertical movement is too large
      .onEnd((event) => {
        'worklet';
        const SWIPE_THRESHOLD = 50;
        const horizontalSwipe = event.translationX;

        if (Math.abs(horizontalSwipe) > SWIPE_THRESHOLD && Math.abs(event.velocityX || 0) > 100) {
          if (horizontalSwipe > 0) {
            // Swipe right - go to previous week
            runOnJS(goToPreviousWeek)();
          } else {
            // Swipe left - go to next week
            runOnJS(goToNextWeek)();
          }
        }
      })
  , [goToPreviousWeek, goToNextWeek]);

  useEffect(() => {
    loadMedications();
    if (weekDays.length > 0) {
      loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1]);
    }
  }, [weekDays]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (weekDays.length > 0) {
      await Promise.all([loadMedications(), loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1])]);
    } else {
      await loadMedications();
    }
    setRefreshing(false);
  }, [loadMedications, loadWeekDoses, weekDays]);

  // Filter doses for selected day
  const selectedDayDoses = useMemo(() => {
    return weekDoses.filter((dose) => {
      const doseDate = parseISO(dose.scheduledTime);
      if (!isSameDay(doseDate, selectedDate)) {
        return false;
      }

      return ![DoseStatus.Taken, DoseStatus.Skipped].includes(dose.status);
    });
  }, [weekDoses, selectedDate]);

  // Filter by search query
  const filteredDoses = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayDoses;
    const query = searchQuery.toLowerCase();
    return selectedDayDoses.filter((dose) => {
      const medName = (
        dose.medication.mims.brandName || dose.medication.mims.genericName
      ).toLowerCase();
      return medName.includes(query);
    });
  }, [selectedDayDoses, searchQuery]);

  // Format date display with relative labels
  const getFormattedDateDisplay = React.useCallback((date: Date): string => {
    let dayPart: string;
    if (isToday(date)) {
      dayPart = t('medications.today');
    } else if (isTomorrow(date)) {
      dayPart = t('medications.tomorrow');
    } else if (isYesterday(date)) {
      dayPart = t('medications.yesterday');
    } else {
      dayPart = format(date, 'EEEE', { locale: dateLocale });
    }

    // Use a universal date format that works well in both languages
    const datePart = format(date, 'd MMMM', { locale: dateLocale });
    const yearPart = getYear(date) === getYear(new Date()) ? '' : ` ${format(date, 'yyyy', { locale: dateLocale })}`;

    return `${dayPart}, ${datePart}${yearPart}`;
  }, [t, dateLocale]);

  const handleTakeDose = async (doseId: string) => {
    try {
      console.log('Marking dose as taken:', doseId);
      await markDose(doseId, DoseStatus.Taken);
      // Reload doses after marking
      if (weekDays.length > 0) {
        await loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1]);
      }
      console.log('Dose marked and reloaded successfully');
    } catch (error) {
      console.error('Error marking dose as taken:', error);
    }
  };

  const handleSkipDose = async (doseId: string) => {
    try {
      console.log('Marking dose as skipped:', doseId);
      await markDose(doseId, DoseStatus.Skipped);
      // Reload doses after marking
      if (weekDays.length > 0) {
        await loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1]);
      }
      console.log('Dose skipped and reloaded successfully');
    } catch (error) {
      console.error('Error marking dose as skipped:', error);
    }
  };

  const handleManagePress = () => {
    navigation.navigate('MedicationInteractions');
  };

  return (
    <ScreenLayout
      backgroundColor={Colors.background.meds}
      contentBackgroundColor="#EFF1FE"
      title="Medications"
      searchPlaceholder="Search here"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onBackPress={() => navigation.goBack()}
      headerSlot={
        <PillButton
          title="View Interactions"
          onPress={handleManagePress}
          variant="white"
          style={styles.manageButton}
        />
      }
    >
      {/* Calendar at the top - outside scroll */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.remindersCard}>
          {/* Week Calendar */}
          <View style={styles.weekCalendar}>
            {weekDays.map((day, index) => {
              const isSelected = isSameDay(day, selectedDate);
              const dayName = format(day, 'EEE', { locale: dateLocale });
              const dayNumber = format(day, 'd', { locale: dateLocale });

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayContainer}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={styles.dayName}>{dayName}</Text>
                  <View style={[styles.dayNumberContainer, isSelected && styles.dayNumberSelected]}>
                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberTextSelected]}>
                      {dayNumber}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Selected Date Display */}
          <Text style={styles.selectedDateText}>
            {getFormattedDateDisplay(selectedDate)}
          </Text>
        </View>
      </GestureDetector>

      {/* Content with light purple background */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.main}
          />
        }
      >
        {/* Medication List */}
        {filteredDoses.length > 0 ? (
          filteredDoses.map((dose) => (
            <View
              key={dose.id}
              style={styles.medicationCard}
            >
              <TouchableOpacity
                style={styles.medicationInfo}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MedicineDetail', { medicationId: dose.medicationId })}
              >
                <Text style={styles.medicationName}>
                  {dose.medication.mims.brandName || dose.medication.mims.genericName}
                </Text>
                <Text style={styles.medicationDetails}>
                  {format(parseISO(dose.scheduledTime), 'h:mm a', { locale: dateLocale })}, {dose.medication.userDosage}
                </Text>
              </TouchableOpacity>

              <View style={styles.medicationActions}>
                <PillButton
                  title={dose.status === DoseStatus.Taken ? 'Taken' : 'Take'}
                  onPress={() => handleTakeDose(dose.id)}
                  variant="yellow"
                  minWidth={80}
                  disabled={dose.status === DoseStatus.Taken}
                />
                <PillButton
                  title="Skip"
                  onPress={() => handleSkipDose(dose.id)}
                  variant="light"
                  minWidth={80}
                  disabled={dose.status === DoseStatus.Skipped}
                />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No medications found' : 'No medications scheduled for this day'}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  manageButton: {
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.md,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayNumberSelected: {
    backgroundColor: Colors.accent.main,
  },
  dayNumber: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  dayNumberTextSelected: {
    color: Colors.text.inverse,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  medicationInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  medicationName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  medicationActions: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  emptyState: {
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  remindersCard: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  selectedDateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});