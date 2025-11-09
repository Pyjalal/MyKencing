import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DoseStatus } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Search, MessageSquare, Scan } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { PillButton } from '../components/PillButton';

type MedicationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function MedicationsScreen({ navigation }: MedicationsScreenProps) {
  const { t } = useTranslation();
  const { weekDoses, loadMedications, loadWeekDoses, markDose } = useMedicationStore();
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

  const handleManagePress = () => {
    navigation.navigate('MedicationInteractions');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.meds} />
      <View style={styles.container}>
        {/* Header with golden background */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('common.back', 'Back')}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerTopActions}>
              <TouchableOpacity
                style={styles.roundAction}
                onPress={handleScanPress}
                accessibilityRole="button"
                accessibilityLabel={t('medications.scan_prescription', 'Scan prescription')}
              >
                <Scan size={20} color={Colors.accent.dark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search here"
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>

          <Text style={styles.title}>Medications</Text>

          <TouchableOpacity
            style={styles.headerBadge}
            onPress={handleManagePress}
            accessibilityRole="button"
            accessibilityLabel={t('medications.view_interactions', 'View interactions')}
          >
            <MessageSquare size={22} color={Colors.accent.main} />
          </TouchableOpacity>
        </View>

        {/* Content */}
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
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
            filteredDoses.map((dose) => {
              const medicationTitle = dose.medication.mims.brandName || dose.medication.mims.genericName;
              const scheduledTime = format(parseISO(dose.scheduledTime), 'h:mm a');

              return (
                <TouchableOpacity
                  key={dose.id}
                  style={styles.medicationCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('MedicineDetail', { medicationId: dose.medicationId })}
                  accessibilityRole="button"
                  accessibilityLabel={`${medicationTitle} ${dose.medication.userDosage}`}
                >
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medicationTitle}</Text>
                    <Text style={styles.medicationMeta}>
                      {scheduledTime} · {dose.medication.userDosage}
                    </Text>
                  </View>

                  <View style={styles.medicationActions}>
                    <PillButton
                      title={dose.status === DoseStatus.Taken ? 'Taken' : 'Take'}
                      variant="accent"
                      size="md"
                      onPress={() => handleTakeDose(dose.id)}
                      disabled={dose.status === DoseStatus.Taken}
                      style={[styles.actionPill, styles.takePill]}
                      textStyle={styles.actionPillText}
                    />
                    <PillButton
                      title="Skip"
                      variant="outline"
                      size="md"
                      onPress={() => handleSkipDose(dose.id)}
                      disabled={dose.status === DoseStatus.Skipped}
                      style={[styles.actionPill, styles.skipPill]}
                      textStyle={styles.skipPillText}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No medications found' : 'No medications scheduled for this day'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    backgroundColor: Colors.background.meds,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['3xl'] + 12,
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.inverse,
  },
  headerTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roundAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
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
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  headerBadge: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: -28,
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
  },
  remindersCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    borderTopLeftRadius: BorderRadius['3xl'] * 2,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
    backgroundColor: Colors.background.primary,
  },
  dayNumberSelected: {
    backgroundColor: Colors.accent.main,
    ...Shadows.sm,
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
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  medicationInfo: {
    marginBottom: Spacing.md,
  },
  medicationName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  medicationMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  medicationActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionPill: {
    flex: 1,
  },
  takePill: {
    ...Shadows.sm,
  },
  skipPill: {
    backgroundColor: Colors.background.primary,
    borderWidth: 0,
  },
  actionPillText: {
    fontSize: Typography.fontSize.sm,
  },
  skipPillText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.sm,
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