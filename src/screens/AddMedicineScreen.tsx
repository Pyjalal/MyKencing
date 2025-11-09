import React from 'react';
import { Keyboard, ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useNavigation, useRoute } from '@react-navigation/native';

import { MIMSSearchResult } from '../types';
import { useAddMedicineForm } from './add-medicine/useAddMedicineForm';
import { styles } from './add-medicine/styles';
import { FREQUENCY_OPTIONS, FORM_OPTIONS, UNIT_OPTIONS } from './add-medicine/constants';
import { MedicineSearchSection } from './add-medicine/components/MedicineSearchSection';
import { DosageUnitRow } from './add-medicine/components/DosageUnitRow';
import { LabeledDropdown } from './add-medicine/components/LabeledDropdown';
import { DurationSection } from './add-medicine/components/DurationSection';
import { TimeScheduleSection } from './add-medicine/components/TimeScheduleSection';
import { NotesSection } from './add-medicine/components/NotesSection';
import { SaveButton } from './add-medicine/components/SaveButton';
import { SelectionModal } from './add-medicine/components/SelectionModal';

interface RouteParams {
  selectedMedicine?: MIMSSearchResult;
}

export default function AddMedicineScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { selectedMedicine } = (route.params as RouteParams) || {};

  const { formState, searchState, modalState, isSaving, actions } = useAddMedicineForm({
    selectedMedicine,
    onSuccess: () => navigation.goBack(),
  });

  const { dosage, unit, form, startDate, endDate, frequency, selectedTimes, notes } = formState;
  const {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    selectedMedicineFromSearch,
  } = searchState;
  const { showUnitPicker, showFormPicker, showFrequencyPicker, showDatePicker } = modalState;

  const formLabel = FORM_OPTIONS.find((option) => option.value === form)?.label;
  const frequencyLabel = FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
        >
          <MedicineSearchSection
            searchQuery={searchQuery}
            onSearchChange={actions.handleSearchChange}
            isSearching={isSearching}
            showSearchResults={showSearchResults}
            searchResults={searchResults}
            onSelectResult={actions.handleMedicineSelect}
            onClearSelection={actions.clearSelectedMedicine}
            selectedMedicine={selectedMedicineFromSearch}
          />

          <DosageUnitRow
            dosage={dosage}
            unit={unit}
            onDosageChange={actions.setDosage}
            onUnitPress={actions.openUnitPicker}
          />

          <LabeledDropdown
            label="Form"
            valueLabel={formLabel}
            placeholder="Choose one option"
            onPress={actions.openFormPicker}
          />

          <DurationSection
            startDate={startDate}
            endDate={endDate}
            onStartPress={() => actions.openDatePicker('start')}
            onEndPress={() => actions.openDatePicker('end')}
          />

          <LabeledDropdown
            label="Frequency"
            valueLabel={frequencyLabel}
            placeholder="Choose one option"
            onPress={actions.openFrequencyPicker}
          />

          <TimeScheduleSection
            selectedTimes={selectedTimes}
            onToggleTime={actions.toggleTime}
            onAddCustomTime={actions.addCustomTime}
          />

          <NotesSection notes={notes} onChange={actions.setNotes} />

          <SaveButton isSaving={isSaving} onPress={actions.handleSave} />
        </ScrollView>

        <SelectionModal
          visible={showUnitPicker}
          title="Select Unit"
          options={UNIT_OPTIONS}
          onSelect={actions.setUnit}
          onClose={actions.closeUnitPicker}
        />
        <SelectionModal
          visible={showFormPicker}
          title="Select Form"
          options={FORM_OPTIONS}
          onSelect={actions.setForm}
          onClose={actions.closeFormPicker}
        />
        <SelectionModal
          visible={showFrequencyPicker}
          title="Select Frequency"
          options={FREQUENCY_OPTIONS}
          onSelect={actions.setFrequency}
          onClose={actions.closeFrequencyPicker}
        />

        {showDatePicker && (
          <DatePicker
            modal
            open
            date={showDatePicker === 'start' ? startDate : endDate || new Date()}
            mode="date"
            minimumDate={showDatePicker === 'end' ? startDate : undefined}
            onConfirm={(date) => {
              if (showDatePicker === 'start') {
                actions.setStartDate(date);
              } else {
                actions.setEndDate(date);
              }
              actions.closeDatePicker();
            }}
            onCancel={actions.closeDatePicker}
            title={showDatePicker === 'start' ? 'Select Start Date' : 'Select End Date'}
            confirmText="Confirm"
            cancelText="Cancel"
            theme="light"
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

