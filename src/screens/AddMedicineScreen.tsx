import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Medication, FoodTiming, MIMSSearchResult } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { MEDICATION_TIMING } from '../constants/clinical';
import { scheduleMedicationReminders } from '../services/notifications';
import { searchMedicines } from '../services/mymedix-api';
import { ChevronDown, Search, X } from 'lucide-react-native';

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

interface RouteParams {
  selectedMedicine?: MIMSSearchResult;
}

export default function AddMedicineScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { selectedMedicine } = (route.params as RouteParams) || {};
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MIMSSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedMedicineFromSearch, setSelectedMedicineFromSearch] = useState<MIMSSearchResult | null>(null);

  // Search function
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMedicines(query, 50);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Helper functions for parsing medicine data
  const parseDosageFromStrength = (strength: string) => {
    const match = strength.match(/(\d+(?:\.\d+)?)/);
    return match ? match[1] : '';
  };

  const parseUnitFromStrength = (strength: string) => {
    const match = strength.match(/(MG|ML|MCG|G|IU)/i);
    if (match) {
      const unitValue = match[1].toLowerCase();
      if (unitValue === 'mg') return 'mg';
      if (unitValue === 'ml') return 'ml';
      if (unitValue === 'mcg') return 'mcg';
      if (unitValue === 'g') return 'g';
      if (unitValue === 'iu') return 'iu';
    }
    return 'tablet';
  };

  const parseFormFromDosageForm = (dosageForm: string) => {
    const formValue = dosageForm.toLowerCase();
    if (formValue.includes('tablet')) return 'tablet';
    if (formValue.includes('capsule')) return 'capsule';
    if (formValue.includes('syrup') || formValue.includes('liquid')) return 'syrup';
    if (formValue.includes('injection')) return 'injection';
    if (formValue.includes('cream') || formValue.includes('ointment')) return 'cream';
    if (formValue.includes('drop')) return 'drops';
    if (formValue.includes('inhaler') || formValue.includes('puff')) return 'inhaler';
    return '';
  };

  // Helper function to capitalize dosage form for display
  const capitalizeDosageForm = (dosageForm: string) => {
    return dosageForm.charAt(0).toUpperCase() + dosageForm.slice(1).toLowerCase();
  };

  // Extract medicine pre-filling logic to avoid duplication
  const prefillMedicineData = (medicine: MIMSSearchResult) => {
    setSelectedMedicineFromSearch(medicine);
    setSearchQuery(medicine.brandName || medicine.genericName);
    setMedicationName(medicine.brandName || medicine.genericName);

    // Pre-fill dosage and unit from structured strength field (parsed by backend)
    if (medicine.strength) {
      setDosage(parseDosageFromStrength(medicine.strength));
      setUnit(parseUnitFromStrength(medicine.strength));
    }

    // Pre-fill form from structured dosageForm field (parsed by backend)
    if (medicine.dosageForm) {
      setForm(medicine.dosageForm);
    }

    // Set default frequency to "once daily" for auto-filled medicines
    setFrequency('once');
    setSelectedTimes(MEDICATION_TIMING.onceDailyMorning);
  };

  // Handle medicine selection from search
  const handleMedicineSelect = (medicine: MIMSSearchResult) => {
    prefillMedicineData(medicine);
    setShowSearchResults(false);
  };

  // Clear selected medicine
  const clearSelectedMedicine = () => {
    setSelectedMedicineFromSearch(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setMedicationName('');
  };

  // Pre-fill form when medicine is selected from API (OCR)
  useEffect(() => {
    if (selectedMedicine) {
      prefillMedicineData(selectedMedicine);
    }
  }, [selectedMedicine]);

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
        registrationNo: selectedMedicineFromSearch?.id || selectedMedicine?.id || `custom_${Date.now()}`,
        userDosage: `${dosage} ${unit}`,
        frequency: freqOption?.times || 1,
        times,
        withFood: FoodTiming.NoPreference,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        refillDate: undefined,
        isActive: true,
        notes: notes || undefined,
      };

      const newId = await addMedication(medInput);
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
  }, [medicationName, dosage, unit, form, frequency, selectedTimes, startDate, endDate, notes, selectedMedicineFromSearch, selectedMedicine, addMedication, navigation]);

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

  const renderDatePicker = () => {
    const isOpen = showDatePicker !== null;
    const fallbackDate = endDate ?? startDate;
    const currentDate = showDatePicker === 'start' ? startDate : fallbackDate;
    const minimumDate = showDatePicker === 'end' ? startDate : undefined;

    return (
      <DatePicker
        modal
        mode="date"
        open={isOpen}
        date={currentDate}
        minimumDate={minimumDate}
        onConfirm={(selectedDate) => {
          if (showDatePicker === 'start') {
            setStartDate(selectedDate);
          } else {
            setEndDate(selectedDate);
          }
          setShowDatePicker(null);
        }}
        onCancel={() => setShowDatePicker(null)}
      />
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="always"
        >
        {/* Medicine Search */}
        <View style={styles.section}>
          <Text style={styles.label}>Search Medicine</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Type medicine name..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              autoCapitalize="words"
              onFocus={() => {
                // Don't auto-dismiss keyboard, but prepare for nested scrolling
              }}
            />
            {(selectedMedicineFromSearch || searchQuery.length > 0) && (
              <TouchableOpacity
                onPress={clearSelectedMedicine}
                style={styles.clearButton}
              >
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {showSearchResults && (
            <View style={styles.searchResultsInline}>
              {isSearching ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary.main} />
                  <Text style={styles.searchingText}>Searching...</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.searchResultsList}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                >
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleMedicineSelect(item);
                      }}
                    >
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultName}>
                          {item.brandName || item.genericName}
                        </Text>
                        <Text style={styles.searchResultDetails}>
                          {item.strength && `${item.strength} • `}
                          {item.dosageForm && `${capitalizeDosageForm(item.dosageForm)} • `}
                          {item.activeIngredients.slice(0, 2).join(', ')}
                          {item.activeIngredients.length > 2 && '...'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Selected Medicine Display */}
          {selectedMedicineFromSearch && (
            <View style={styles.selectedMedicineContainer}>
              <Text style={styles.selectedMedicineLabel}>Selected Medicine:</Text>
              <Text style={styles.selectedMedicineName}>
                {selectedMedicineFromSearch.brandName || selectedMedicineFromSearch.genericName}
              </Text>
              <Text style={styles.selectedMedicineDetails}>
                Registration: {selectedMedicineFromSearch.id}
              </Text>
            </View>
          )}
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
      {renderDatePicker()}
      </View>
    </TouchableWithoutFeedback>
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
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  searchResultsContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.card,
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  searchingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  searchResultsInline: {
    marginTop: Spacing.sm,
    height: 300,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchResultContent: {
    padding: Spacing.lg,
  },
  searchResultName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  searchResultDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  selectedMedicineContainer: {
    backgroundColor: Colors.accent.light,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  selectedMedicineLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.accent.main,
    marginBottom: Spacing.xs,
  },
  selectedMedicineName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  selectedMedicineDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});
