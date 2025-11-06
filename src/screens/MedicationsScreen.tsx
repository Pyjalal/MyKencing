import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DoseStatus } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Search, MessageSquare, Scan } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';

type MedicationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function MedicationsScreen({ navigation }: MedicationsScreenProps) {
  const { t } = useTranslation();
  const { todayDoses, loadMedications, loadWeekDoses, markDose } = useMedicationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week days (Sun-Sat)
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

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
    return todayDoses.filter((dose) => {
      const doseDate = parseISO(dose.scheduledTime);
      if (!isSameDay(doseDate, selectedDate)) {
        return false;
      }

      return ![DoseStatus.Taken, DoseStatus.Skipped].includes(dose.status);
    });
  }, [todayDoses, selectedDate]);

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

  const handleScanPress = () => {
    navigation.navigate('ScanPrescription');
  };

  return (
    <View style={styles.container}>
      {/* Header with yellow/gold background */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here"
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Medications</Text>

        {/* Scan Button */}
        <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
          <View style={styles.scanIconContainer}>
            <Scan size={24} color={Colors.accent.main} />
          </View>
        </TouchableOpacity>
      </View>

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
        {/* Reminders Card with Calendar */}
        <View style={styles.remindersCard}>
          <Text style={styles.cardTitle}>Reminders</Text>

          {/* Week Calendar */}
          <View style={styles.weekCalendar}>
            {weekDays.map((day, index) => {
              const isSelected = isSameDay(day, selectedDate);
              const dayName = format(day, 'EEE');
              const dayNumber = format(day, 'd');

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
        </View>

        {/* Medication List */}
        {filteredDoses.length > 0 ? (
          filteredDoses.map((dose) => (
            <TouchableOpacity
              key={dose.id}
              style={styles.medicationCard}
              activeOpacity={0.95}
              onPress={() => navigation.navigate('MedicineDetail', { medicationId: dose.medicationId })}
            >
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>
                  {dose.medication.mims.brandName || dose.medication.mims.genericName}
                </Text>
                <Text style={styles.medicationDetails}>
                  {format(parseISO(dose.scheduledTime), 'h:mm a')}, {dose.medication.userDosage}
                </Text>
              </View>

              <View style={styles.medicationActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.takeButton,
                    dose.status === DoseStatus.Taken && styles.takeButtonDisabled,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTakeDose(dose.id);
                  }}
                  disabled={dose.status === DoseStatus.Taken}
                >
                  <Text style={styles.takeButtonText}>
                    {dose.status === DoseStatus.Taken ? 'Taken' : 'Take'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.skipButton,
                    dose.status === DoseStatus.Skipped && styles.skipButtonDisabled,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSkipDose(dose.id);
                  }}
                  disabled={dose.status === DoseStatus.Skipped}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No medications found' : 'No medications scheduled for this day'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5D7E3', // Light purple/lavender background
  },
  header: {
    backgroundColor: Colors.background.meds, // Yellow/gold #F5B800
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
    borderRadius: 25,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.md,
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
  title: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.md,
  },
  scanButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing['2xl'] + 80,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  remindersCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  medicationInfo: {
    marginBottom: Spacing.md,
  },
  medicationName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  medicationDetails: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  medicationActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeButton: {
    backgroundColor: Colors.accent.main,
  },
  takeButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    opacity: 0.6,
  },
  takeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  skipButtonDisabled: {
    opacity: 0.5,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
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
});