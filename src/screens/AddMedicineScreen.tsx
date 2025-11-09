import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Medication, FoodTiming, MIMSSearchResult } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { MEDICATION_TIMING } from '../constants/clinical';
import { scheduleMedicationReminders, createDoseEntries } from '../services/notifications';
import { searchMedicines } from '../services/mymedix-api';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

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
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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

  // Extract medicine pre-filling logic to avoid duplication
  const prefillMedicineData = (medicine: MIMSSearchResult) => {
    setSelectedMedicineFromSearch(medicine);
    setSearchQuery(medicine.brandName || medicine.genericName);
    setMedicationName(medicine.brandName || medicine.genericName);

    if (medicine.strength) {
      setDosage(parseDosageFromStrength(medicine.strength));
      setUnit(parseUnitFromStrength(medicine.strength));
    }

    if (medicine.dosageForm) {
      setForm(medicine.dosageForm);
    }

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

  const handleSave = () => {
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter medication name');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Error', 'Please enter dosage');
      return;
    }
    if (!form) {
      Alert.alert('Error', 'Please select medication form');
      return;
    }
    if (!frequency) {
      Alert.alert('Error', 'Please select frequency');
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert('Error', 'Please add at least one time');
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = useCallback(async () => {
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
      await createDoseEntries(newId, times, medInput.startDate);
      await scheduleMedicationReminders({
        ...(medInput as any),
        id: newId,
        mims: { genericName: medicationName },
      } as any);

      Alert.alert('Success', 'Medication added successfully.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
    }
  }, [medicationName, dosage, unit, form, frequency, selectedTimes, startDate, endDate, notes, selectedMedicineFromSearch, selectedMedicine, addMedication, navigation]);

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    const currentDate = showDatePicker === 'start' ? startDate : endDate || new Date();
    const minimumDate = showDatePicker === 'end' ? startDate : undefined;

    return (
      <DateTimePicker
        value={currentDate}
        mode="date"
        display="default"
        minimumDate={minimumDate}
        onChange={(event, selectedDate) => {
          if (Platform.OS === 'android') {
            setShowDatePicker(null);
          }
          if (event.type === 'set' && selectedDate) {
            if (showDatePicker === 'start') {
              setStartDate(selectedDate);
            } else {
              setEndDate(selectedDate);
            }
            if (Platform.OS === 'ios') {
              setShowDatePicker(null);
            }
          }
          if (event.type === 'dismissed') {
            setShowDatePicker(null);
          }
        }}
      />
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-100">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingTop: 40, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="always"
        >
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Search Medicine</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center">
                <Search size={20} color="gray" className="absolute left-3 z-10" />
                <Input
                  placeholder="Type medicine name..."
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    handleSearch(text);
                  }}
                  autoCapitalize="words"
                  className="pl-10"
                />
                {(selectedMedicineFromSearch || searchQuery.length > 0) && (
                  <Button variant="ghost" onPress={clearSelectedMedicine} className="absolute right-0">
                    <X size={20} color="gray" />
                  </Button>
                )}
              </View>

              {showSearchResults && (
                <View className="mt-2 h-72 border border-gray-200 rounded-lg">
                  {isSearching ? (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator size="small" />
                      <Text className="mt-2 text-gray-500">Searching...</Text>
                    </View>
                  ) : (
                    <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                      {searchResults.map((item) => (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className="justify-start p-4 border-b border-gray-200"
                          onPress={() => {
                            Keyboard.dismiss();
                            handleMedicineSelect(item);
                          }}
                        >
                          <View>
                            <Text className="font-semibold">{item.brandName || item.genericName}</Text>
                            <Text className="text-xs text-gray-500">
                              {item.strength && `${item.strength} • `}
                              {item.dosageForm && `${item.dosageForm} • `}
                              {item.activeIngredients.slice(0, 2).join(', ')}
                              {item.activeIngredients.length > 2 && '...'}
                            </Text>
                          </View>
                        </Button>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {selectedMedicineFromSearch && (
                <View className="mt-2 p-4 bg-blue-100 rounded-lg">
                  <Text className="text-sm font-semibold text-blue-600">Selected Medicine:</Text>
                  <Text className="text-lg font-bold">{selectedMedicineFromSearch.brandName || selectedMedicineFromSearch.genericName}</Text>
                  <Text className="text-xs text-gray-500">Registration: {selectedMedicineFromSearch.id}</Text>
                </View>
              )}
            </CardContent>
          </Card>

          <View className="flex-row gap-4 mb-4">
            <Input
              placeholder="Insert dosage"
              value={dosage}
              onChangeText={setDosage}
              keyboardType="numeric"
              className="flex-1"
            />
            <Select onValueChange={setUnit} value={unit}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map(option => <SelectItem key={option.value} label={option.label} value={option.value} />)}
              </SelectContent>
            </Select>
          </View>

          <View className="mb-4">
            <Text className="text-lg font-bold text-black mb-2">Form</Text>
            <Select onValueChange={setForm} value={form}>
              <SelectTrigger>
                <SelectValue placeholder="Choose one option" />
              </SelectTrigger>
              <SelectContent>
                {FORM_OPTIONS.map(option => <SelectItem key={option.value} label={option.label} value={option.value} />)}
              </SelectContent>
            </Select>
          </View>

          <View className="mb-4">
            <Text className="text-lg font-bold text-black mb-2">Duration</Text>
            <View className="flex-row gap-4">
              <Button variant="outline" className="flex-1" onPress={() => setShowDatePicker('start')}>
                <Text>{startDate ? startDate.toLocaleDateString() : 'Start date'}</Text>
              </Button>
              <Button variant="outline" className="flex-1" onPress={() => setShowDatePicker('end')}>
                <Text>{endDate ? endDate.toLocaleDateString() : 'End date'}</Text>
              </Button>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-lg font-bold text-black mb-2">Frequency</Text>
            <Select onValueChange={setFrequency} value={frequency}>
              <SelectTrigger>
                <SelectValue placeholder="Choose one option" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map(option => <SelectItem key={option.value} label={option.label} value={option.value} />)}
              </SelectContent>
            </Select>
          </View>

          <View className="mb-4">
            <Text className="text-lg font-bold text-black mb-2">Time & Schedule</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'After Breakfast', value: '08:00' },
                { label: 'After Lunch', value: '13:00' },
                { label: 'After Dinner', value: '19:00' },
                { label: 'Before Bed', value: '22:00' },
              ].map((time) => {
                const isSelected = selectedTimes.includes(time.value);
                return (
                  <Button
                    key={time.value}
                    variant={isSelected ? 'default' : 'outline'}
                    onPress={() => toggleTime(time.value)}
                  >
                    <Text>{time.label}</Text>
                  </Button>
                );
              })}
              <Button variant="outline" className="w-12 h-12 rounded-full" onPress={addCustomTime}>
                <Text className="text-2xl">+</Text>
              </Button>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-lg font-bold text-black mb-2">Notes</Text>
            <Input
              placeholder="Insert notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              className="h-32"
              textAlignVertical="top"
            />
          </View>

          <Button onPress={handleSave} disabled={isSaving} className="mt-4">
            {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Add Medication</Text>}
          </Button>
        </ScrollView>

        <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Medication</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add this medication?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Text>Cancel</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={confirmSave}>
                <Text>Confirm</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {renderDatePicker()}
      </View>
    </TouchableWithoutFeedback>
  );
}

