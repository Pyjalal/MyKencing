import { useCallback, useEffect, useState } from 'react';
import { FoodTiming, Medication, MIMSSearchResult } from '../../types';
import { useMedicationStore } from '../../stores/medicationStore';
import { scheduleMedicationReminders } from '../../services/notifications';
import { searchMedicines } from '../../services/mymedix-api';
import { FREQUENCY_OPTIONS } from './constants';
import {
  getDisplayName,
  parseDosageFromStrength,
  parseFormFromDosageForm,
  parseUnitFromStrength,
} from './utils';

type DatePickerType = 'start' | 'end' | null;

interface UseAddMedicineFormArgs {
  selectedMedicine?: MIMSSearchResult;
  onSuccess?: () => void;
}

interface UseAddMedicineFormReturn {
  formState: {
    medicationName: string;
    dosage: string;
    unit: string;
    form: string;
    startDate: Date;
    endDate: Date | null;
    frequency: string;
    selectedTimes: string[];
    notes: string;
  };
  searchState: {
    searchQuery: string;
    searchResults: MIMSSearchResult[];
    isSearching: boolean;
    showSearchResults: boolean;
    selectedMedicineFromSearch: MIMSSearchResult | null;
  };
  modalState: {
    showUnitPicker: boolean;
    showFormPicker: boolean;
    showFrequencyPicker: boolean;
    showDatePicker: DatePickerType;
  };
  isSaving: boolean;
  actions: {
    setMedicationName: (value: string) => void;
    setDosage: (value: string) => void;
    setUnit: (value: string) => void;
    setForm: (value: string) => void;
    setStartDate: (date: Date) => void;
    setEndDate: (date: Date | null) => void;
    setFrequency: (value: string) => void;
    setNotes: (value: string) => void;
    setSelectedTimes: (value: string[]) => void;
    toggleTime: (value: string) => void;
    addCustomTime: () => void;
    handleSave: () => Promise<void>;
    handleSearchChange: (value: string) => void;
    handleMedicineSelect: (medicine: MIMSSearchResult) => void;
    clearSelectedMedicine: () => void;
    openUnitPicker: () => void;
    closeUnitPicker: () => void;
    openFormPicker: () => void;
    closeFormPicker: () => void;
    openFrequencyPicker: () => void;
    closeFrequencyPicker: () => void;
    openDatePicker: (type: Exclude<DatePickerType, null>) => void;
    closeDatePicker: () => void;
  };
}

export const useAddMedicineForm = ({
  selectedMedicine,
  onSuccess,
}: UseAddMedicineFormArgs): UseAddMedicineFormReturn => {
  const { addMedication } = useMedicationStore();

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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MIMSSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedMedicineFromSearch, setSelectedMedicineFromSearch] =
    useState<MIMSSearchResult | null>(null);

  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showFormPicker, setShowFormPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<DatePickerType>(null);

  const resetForm = useCallback(() => {
    setMedicationName('');
    setDosage('');
    setUnit('tablet');
    setForm('');
    setStartDate(new Date());
    setEndDate(null);
    setFrequency('');
    setSelectedTimes([]);
    setNotes('');
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchResults(false);
    setSelectedMedicineFromSearch(null);
    setShowUnitPicker(false);
    setShowFormPicker(false);
    setShowFrequencyPicker(false);
    setShowDatePicker(null);
  }, []);

  const getTimesForFrequency = useCallback(
    (freqValue: string): string[] => {
      const option = FREQUENCY_OPTIONS.find((f) => f.value === freqValue);
      return option?.defaultTimes ?? FREQUENCY_OPTIONS[0].defaultTimes;
    },
    []
  );

  const prefillMedicineData = useCallback(
    (medicine: MIMSSearchResult) => {
      setSelectedMedicineFromSearch(medicine);

      const displayName = getDisplayName(medicine);
      setSearchQuery(displayName);
      setMedicationName(displayName);

      if (medicine.strength) {
        setDosage(parseDosageFromStrength(medicine.strength));
        setUnit(parseUnitFromStrength(medicine.strength));
      }

      if (medicine.dosageForm) {
        setForm(parseFormFromDosageForm(medicine.dosageForm));
      }

      const defaultFrequency = FREQUENCY_OPTIONS[0];
      setFrequency(defaultFrequency.value);
      setSelectedTimes(defaultFrequency.defaultTimes);
    },
    []
  );

  useEffect(() => {
    if (selectedMedicine) {
      prefillMedicineData(selectedMedicine);
    }
  }, [prefillMedicineData, selectedMedicine]);

  const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMedicines(trimmedQuery, 50);
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

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  const handleMedicineSelect = useCallback(
    (medicine: MIMSSearchResult) => {
      prefillMedicineData(medicine);
      setShowSearchResults(false);
    },
    [prefillMedicineData]
  );

  const clearSelectedMedicine = useCallback(() => {
    setSelectedMedicineFromSearch(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setMedicationName('');
  }, []);

  const toggleTime = useCallback((time: string) => {
    setSelectedTimes((prev) => {
      if (prev.includes(time)) {
        return prev.filter((t) => t !== time);
      }
      return [...prev, time];
    });
  }, []);

  const addCustomTime = useCallback(() => {
    const newTime = new Date();
    const timeString = `${newTime.getHours().toString().padStart(2, '0')}:${newTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    setSelectedTimes((prev) => {
      if (prev.includes(timeString)) {
        return prev;
      }
      return [...prev, timeString];
    });
  }, []);

  const handleSave = useCallback(async () => {
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
        registrationNo:
          selectedMedicineFromSearch?.id || selectedMedicine?.id || `custom_${Date.now()}`,
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

      resetForm();
      onSuccess?.();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [
    addMedication,
    dosage,
    endDate,
    frequency,
    getTimesForFrequency,
    medicationName,
    notes,
    onSuccess,
    resetForm,
    selectedMedicine,
    selectedMedicineFromSearch,
    selectedTimes,
    startDate,
    unit,
    form,
  ]);

  return {
    formState: {
      medicationName,
      dosage,
      unit,
      form,
      startDate,
      endDate,
      frequency,
      selectedTimes,
      notes,
    },
    searchState: {
      searchQuery,
      searchResults,
      isSearching,
      showSearchResults,
      selectedMedicineFromSearch,
    },
    modalState: {
      showUnitPicker,
      showFormPicker,
      showFrequencyPicker,
      showDatePicker,
    },
    isSaving,
    actions: {
      setMedicationName,
      setDosage,
      setUnit,
      setForm,
      setStartDate,
      setEndDate,
      setFrequency,
      setNotes,
      setSelectedTimes,
      toggleTime,
      addCustomTime,
      handleSave,
      handleSearchChange,
      handleMedicineSelect,
      clearSelectedMedicine,
      openUnitPicker: () => setShowUnitPicker(true),
      closeUnitPicker: () => setShowUnitPicker(false),
      openFormPicker: () => setShowFormPicker(true),
      closeFormPicker: () => setShowFormPicker(false),
      openFrequencyPicker: () => setShowFrequencyPicker(true),
      closeFrequencyPicker: () => setShowFrequencyPicker(false),
      openDatePicker: (type: Exclude<DatePickerType, null>) => setShowDatePicker(type),
      closeDatePicker: () => setShowDatePicker(null),
    },
  };
};

