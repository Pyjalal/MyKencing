import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Medication, FoodTiming } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { MEDICATION_TIMING } from '../constants/clinical';
import { scheduleMedicationReminders, createDoseEntries } from '../services/notifications';
import { ChevronDown } from 'lucide-react-native';

// Frequency options
const FREQUENCY_OPTIONS = [
  { label: 'Once daily', value: 'once', times: 1 },
  { label: 'Twice daily', value: 'twice', times: 2 },
  { label: 'Three times daily', value: 'three', times: 3 },
  { label: 'Every 8 hours', value: 'every_8h', times: 3 },
  { label: 'Every 6 hours', value: 'every_6h', times: 4 },
  { label: 'Four times daily', value: 'four', times: 4 },
];

// Form options
const FORM_OPTIONS = [
  { label: 'Tablet', value: 'tablet' },
  { label: 'Capsule', value: 'capsule' },
  { label: 'Syrup', value: 'syrup' },
  { label: 'Injection', value: 'injection' },
  { label: 'Drops', value: 'drops' },
  { label: 'Inhaler', value: 'inhaler' },
  { label: 'Cream', value: 'cream' },
  { label: 'Ointment', value: 'ointment' },
];

// Unit options
const UNIT_OPTIONS = [
  { label: 'tablet', value: 'tablet' },
  { label: 'capsule', value: 'capsule' },
  { label: 'mg', value: 'mg' },
  { label: 'ml', value: 'ml' },
  { label: 'drops', value: 'drops' },
  { label: 'puff', value: 'puff' },
];

export default function AddMedicineScreen() {
  const navigation = useNavigation<any>();
  const { addMedication } = useMedicationStore();

  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('tablet');
  const [form, setForm] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [frequency, setFrequency] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showFormPicker, setShowFormPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  const getTimesForFrequency = (freqValue: string): string[] => {
    switch (freqValue) {
      case 'once':
        return MEDICATION_TIMING.onceDailyMorning;
      case 'twice':
        return MEDICATION_TIMING.twiceDaily;
      case 'three':
      case 'every_8h':
        return MEDICATION_TIMING.threeTimesDaily;
      case 'four':
      case 'every_6h':
        return MEDICATION_TIMING.fourTimesDaily;
      default:
        return MEDICATION_TIMING.onceDailyMorning;
    }
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) => {
      if (prev.includes(time)) {
        return prev.filter((t) => t !== time);
      }
      return [...prev, time];
    });
  };

  const addCustomTime = () => {
    const newTime = new Date();
    const timeString = `${newTime.getHours().toString().padStart(2, '0')}:${newTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    if (!selectedTimes.includes(timeString)) {
      setSelectedTimes([...selectedTimes, timeString]);
    }
  };

  const handleSave = useCallback(async () => {
    // Validation
    if (!medicationName.trim()) {
      alert('Please enter medication name');
      return;
    }
    if (!dosage.trim()) {
      alert('Please enter dosage');
      return;
    }
    if (!form) {
      alert('Please select medication form');
      return;
    }
    if (!frequency) {
      alert('Please select frequency');
      return;
    }
    if (selectedTimes.length === 0) {
      alert('Please add at least one time');
      return;
    }

    try {
      setIsSaving(true);

      const freqOption = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
      const times = selectedTimes.length > 0 ? selectedTimes : getTimesForFrequency(frequency);

      const medInput: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
        mimsId: `custom_${Date.now()}`,
        userDosage: `${dosage} ${unit}`,
        frequency: freqOption?.times || 1,
        times,
        withFood: FoodTiming.NoPreference,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        refillDate: undefined,
        isActive: true,
        notes: notes || undefined,
      } as any;

      const newId = await addMedication(medInput);
      await createDoseEntries(newId, times, medInput.startDate);
      await scheduleMedicationReminders({
        ...(medInput as any),
        id: newId,
        mims: { genericName: medicationName },
      } as any);

      navigation.goBack();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [
    medicationName,
    dosage,
    unit,
    form,
    frequency,
    selectedTimes,
    startDate,
    endDate,
    notes,
    addMedication,
    navigation,
    getTimesForFrequency,
  ]);

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: Array<{ label: string; value: string }>,
    onSelect: (value: string) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderDatePickerModal = () => {
    if (!showDatePicker) return null;

    const currentDate = showDatePicker === 'start' ? startDate : endDate || new Date();
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return (
      <Modal visible={true} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {showDatePicker === 'start' ? 'Select Start Date' : 'Select End Date'}
            </Text>
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateDisplay}>{currentDate.toLocaleDateString()}</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const newDate = new Date();
                  if (showDatePicker === 'start') {
                    setStartDate(newDate);
                  } else {
                    setEndDate(newDate);
                  }
                  setShowDatePicker(null);
                }}
              >
                <Text style={styles.dateButtonText}>Select Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonSecondary]}
                onPress={() => setShowDatePicker(null)}
              >
                <Text style={styles.dateButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Medication Name */}
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Medication Name"
            placeholderTextColor={Colors.text.tertiary}
            value={medicationName}
            onChangeText={setMedicationName}
          />
        </View>

        {/* Dosage and Unit */}
        <View style={styles.rowSection}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder="Insert dosage"
            placeholderTextColor={Colors.text.tertiary}
            value={dosage}
            onChangeText={setDosage}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowUnitPicker(true)}>
            <Text style={styles.dropdownButtonText}>{unit || 'Unit'}</Text>
            <ChevronDown size={20} color={Colors.accent.main} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.label}>Form</Text>
          <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowFormPicker(true)}>
            <Text style={[styles.dropdownInputText, !form && styles.placeholderText]}>
              {form ? FORM_OPTIONS.find((f) => f.value === form)?.label : 'Choose one option'}
            </Text>
            <ChevronDown size={20} color={Colors.accent.main} />
          </TouchableOpacity>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.rowSection}>
            <TouchableOpacity
              style={[styles.input, styles.flexInput, styles.dateInput]}
              onPress={() => setShowDatePicker('start')}
            >
              <Text style={styles.dateText}>
                {startDate ? startDate.toLocaleDateString() : 'Start date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.input, styles.flexInput, styles.dateInput]}
              onPress={() => setShowDatePicker('end')}
            >
              <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
                {endDate ? endDate.toLocaleDateString() : 'End date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.label}>Frequency</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setShowFrequencyPicker(true)}
          >
            <Text style={[styles.dropdownInputText, !frequency && styles.placeholderText]}>
              {frequency
                ? FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label
                : 'Choose one option'}
            </Text>
            <ChevronDown size={20} color={Colors.accent.main} />
          </TouchableOpacity>
        </View>

        {/* Time & Schedule */}
        <View style={styles.section}>
          <Text style={styles.label}>Time & Schedule</Text>
          <View style={styles.timeContainer}>
            {[
              { label: 'After Breakfast', value: '08:00' },
              { label: 'After Lunch', value: '13:00' },
              { label: 'After Dinner', value: '19:00' },
              { label: 'Before Bed', value: '22:00' },
            ].map((time) => {
              const isSelected = selectedTimes.includes(time.value);

              return (
                <TouchableOpacity
                  key={time.value}
                  style={[styles.timePill, isSelected && styles.timePillSelected]}
                  onPress={() => toggleTime(time.value)}
                >
                  <Text style={[styles.timePillText, isSelected && styles.timePillTextSelected]}>
                    {time.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addTimeButton} onPress={addCustomTime}>
              <Text style={styles.addTimeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Insert notes"
            placeholderTextColor={Colors.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Add Medication Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.text.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Add Medication</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Pickers */}
      {renderPickerModal(
        showUnitPicker,
        () => setShowUnitPicker(false),
        UNIT_OPTIONS,
        setUnit,
        'Select Unit'
      )}
      {renderPickerModal(
        showFormPicker,
        () => setShowFormPicker(false),
        FORM_OPTIONS,
        setForm,
        'Select Form'
      )}
      {renderPickerModal(
        showFrequencyPicker,
        () => setShowFrequencyPicker(false),
        FREQUENCY_OPTIONS,
        setFrequency,
        'Select Frequency'
      )}

      {/* Date Picker */}
      {renderDatePickerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5D7E3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  rowSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  flexInput: {
    flex: 1,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    minWidth: 120,
  },
  dropdownButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  dropdownInputText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timePill: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
  },
  timePillSelected: {
    backgroundColor: Colors.accent.main,
  },
  timePillText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  timePillTextSelected: {
    color: Colors.text.primary,
  },
  addTimeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  notesInput: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    minHeight: 120,
  },
  saveButton: {
    backgroundColor: Colors.accent.main,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  datePickerContainer: {
    gap: Spacing.md,
  },
  dateDisplay: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  dateButton: {
    backgroundColor: Colors.accent.main,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dateButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  dateButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  dateButtonTextSecondary: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
});
