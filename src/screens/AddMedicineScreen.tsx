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
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Medication, FoodTiming, MIMSSearchResult } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { scheduleMedicationReminders } from '../services/notifications';
import { searchMedicines } from '../services/mymedix-api';
import { ChevronDown, Search, X, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';


interface RouteParams {
  selectedMedicine?: MIMSSearchResult;
}

export default function AddMedicineScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { selectedMedicine } = (route.params as RouteParams) || {};
  const { addMedication } = useMedicationStore();

  // Form options
  const FORM_OPTIONS = [
    { label: t('add_medicine.form_tablet'), value: 'tablet' },
    { label: t('add_medicine.form_capsule'), value: 'capsule' },
    { label: t('add_medicine.form_syrup'), value: 'syrup' },
    { label: t('add_medicine.form_injection'), value: 'injection' },
    { label: t('add_medicine.form_drops'), value: 'drops' },
    { label: t('add_medicine.form_inhaler'), value: 'inhaler' },
    { label: t('add_medicine.form_cream'), value: 'cream' },
    { label: t('add_medicine.form_ointment'), value: 'ointment' },
  ];

  // Unit options
  const UNIT_OPTIONS = [
    { label: t('add_medicine.unit_tablet'), value: 'tablet' },
    { label: t('add_medicine.unit_capsule'), value: 'capsule' },
    { label: t('add_medicine.unit_mg'), value: 'mg' },
    { label: t('add_medicine.unit_ml'), value: 'ml' },
    { label: t('add_medicine.unit_drops'), value: 'drops' },
    { label: t('add_medicine.unit_puff'), value: 'puff' },
  ];

  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('tablet');
  const [form, setForm] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
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
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [editingTime, setEditingTime] = useState<string | null>(null);

  const removeTime = (time: string) => {
    setSelectedTimes((prev) => prev.filter((t) => t !== time));
  };

  const editTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setEditingTime(time);
    setShowTimePicker(true);
  };

  const addOrUpdateTime = (date: Date) => {
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    
    if (editingTime) {
      // Update existing time
      setSelectedTimes((prev) => 
        prev.map((t) => (t === editingTime ? timeString : t)).sort()
      );
      setEditingTime(null);
    } else {
      // Add new time
      if (!selectedTimes.includes(timeString)) {
        setSelectedTimes([...selectedTimes, timeString].sort());
      }
    }
  };

  const handleSave = useCallback(async () => {
    // Validation
    if (!medicationName.trim()) {
      alert(t('add_medicine.error_name_required'));
      return;
    }
    if (!dosage.trim()) {
      alert(t('add_medicine.error_dosage_required'));
      return;
    }
    if (!form) {
      alert(t('add_medicine.error_form_required'));
      return;
    }
    if (selectedTimes.length === 0) {
      alert(t('add_medicine.error_time_required'));
      return;
    }

    try {
      setIsSaving(true);

      const medInput: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
        registrationNo: selectedMedicineFromSearch?.id || selectedMedicine?.id || `custom_${Date.now()}`,
        userDosage: `${dosage} ${unit}`,
        frequency: selectedTimes.length,
        times: selectedTimes,
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
  }, [t, medicationName, dosage, unit, form, selectedTimes, startDate, endDate, notes, selectedMedicineFromSearch, selectedMedicine, addMedication, navigation]);

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

  const renderTimePicker = () => (
    <DatePicker
      modal
      mode="time"
      open={showTimePicker}
      date={tempTime}
      onConfirm={(selectedTime) => {
        addOrUpdateTime(selectedTime);
        setShowTimePicker(false);
      }}
      onCancel={() => {
        setShowTimePicker(false);
        setEditingTime(null);
      }}
    />
  );

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
          <Text style={styles.label}>{t('add_medicine.medicine_name')}</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('add_medicine.search_placeholder')}
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
                  <Text style={styles.searchingText}>{t('add_medicine.searching')}</Text>
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
              <Text style={styles.selectedMedicineLabel}>{t('add_medicine.selected_medicine')}</Text>
              <Text style={styles.selectedMedicineName}>
                {selectedMedicineFromSearch.brandName || selectedMedicineFromSearch.genericName}
              </Text>
              <Text style={styles.selectedMedicineDetails}>
                {t('add_medicine.registration')} {selectedMedicineFromSearch.id}
              </Text>
            </View>
          )}
        </View>

        {/* Dosage and Unit */}
        <View style={styles.rowSection}>
          <TextInput
            style={[styles.input, styles.flexInput]}
            placeholder={t('add_medicine.insert_dosage')}
            placeholderTextColor={Colors.text.tertiary}
            value={dosage}
            onChangeText={setDosage}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowUnitPicker(true)}>
            <Text style={styles.dropdownButtonText}>{unit || t('add_medicine.unit')}</Text>
            <ChevronDown size={20} color={Colors.accent.main} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('add_medicine.form')}</Text>
          <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowFormPicker(true)}>
            <Text style={[styles.dropdownInputText, !form && styles.placeholderText]}>
              {form ? FORM_OPTIONS.find((f) => f.value === form)?.label : t('add_medicine.choose_option')}
            </Text>
            <ChevronDown size={20} color={Colors.accent.main} />
          </TouchableOpacity>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('add_medicine.duration')}</Text>
          <View style={styles.rowSection}>
            <TouchableOpacity
              style={[styles.input, styles.flexInput, styles.dateInput]}
              onPress={() => setShowDatePicker('start')}
            >
              <Text style={styles.dateText}>
                {startDate ? startDate.toLocaleDateString() : t('add_medicine.start_date')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.input, styles.flexInput, styles.dateInput]}
              onPress={() => setShowDatePicker('end')}
            >
              <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
                {endDate ? endDate.toLocaleDateString() : t('add_medicine.end_date')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Schedule */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('add_medicine.time_schedule')}</Text>
          <View style={styles.timeContainer}>
            {selectedTimes.map((time) => (
              <View key={time} style={styles.timePillWithRemove}>
                <TouchableOpacity
                  onPress={() => editTime(time)}
                  style={styles.timeTextButton}
                >
                  <Text style={styles.timePillText}>{time}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeTime(time)}
                  style={styles.removeTimeButton}
                >
                  <X size={16} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={selectedTimes.length === 0 ? styles.addTimeButtonWithText : styles.addTimeButton}
              onPress={() => {
                setTempTime(new Date());
                setEditingTime(null);
                setShowTimePicker(true);
              }}
            >
              {selectedTimes.length === 0 ? (
                <View style={styles.addTimeButtonContent}>
                  <Plus size={20} color={Colors.text.primary} />
                  <Text style={styles.addTimeButtonTextWithLabel}>Add Time</Text>
                </View>
              ) : (
                <Plus size={24} color={Colors.text.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('add_medicine.notes')}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder={t('add_medicine.insert_notes')}
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
            <Text style={styles.saveButtonText}>{t('add_medicine.add_medication')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Pickers */}
      {renderPickerModal(
        showUnitPicker,
        () => setShowUnitPicker(false),
        UNIT_OPTIONS,
        setUnit,
        t('add_medicine.select_unit')
      )}
      {renderPickerModal(
        showFormPicker,
        () => setShowFormPicker(false),
        FORM_OPTIONS,
        setForm,
        t('add_medicine.select_form')
      )}

      {/* Date Picker */}
      {renderDatePicker()}

      {/* Time Picker */}
      {renderTimePicker()}
      </View>
    </TouchableWithoutFeedback>
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
  timePillWithRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.main,
    borderRadius: 20,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  timeTextButton: {
    // Makes the time text tappable
  },
  timePillText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  removeTimeButton: {
    padding: 2,
  },
  addTimeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeButtonWithText: {
    backgroundColor: Colors.accent.main,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addTimeButtonTextWithLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
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
