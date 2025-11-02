import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, VitalType } from '../types';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useVitalsStore } from '../stores/vitalsStore';

type AddVitalScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddVital'>;
  route: RouteProp<RootStackParamList, 'AddVital'>;
};

export default function AddVitalScreen({ navigation, route }: AddVitalScreenProps) {
  const { t } = useTranslation();
  const { type } = route.params;
  const { addBloodPressure, addGlucose, addWeight, isLoading } = useVitalsStore();

  // Blood Pressure fields
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');

  // Glucose fields
  const [glucoseValue, setGlucoseValue] = useState('');
  const [glucoseUnit, setGlucoseUnit] = useState<'mmol/L' | 'mg/dL'>('mmol/L');

  // Weight fields
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

  // Common fields
  const [notes, setNotes] = useState('');

  const getTitle = () => {
    switch (type) {
      case VitalType.BloodPressure:
        return t('blood_pressure');
      case VitalType.Glucose:
        return t('glucose');
      case VitalType.Weight:
        return t('weight');
      default:
        return t('add_vital');
    }
  };

  const isValid = () => {
    switch (type) {
      case VitalType.BloodPressure:
        return systolic !== '' && diastolic !== '' && !isNaN(Number(systolic)) && !isNaN(Number(diastolic));
      case VitalType.Glucose:
        return glucoseValue !== '' && !isNaN(Number(glucoseValue));
      case VitalType.Weight:
        return weightValue !== '' && !isNaN(Number(weightValue));
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (!isValid()) {
      return;
    }

    try {
      switch (type) {
        case VitalType.BloodPressure:
          await addBloodPressure(Number(systolic), Number(diastolic), undefined, notes || undefined);
          break;
        case VitalType.Glucose:
          await addGlucose(Number(glucoseValue), glucoseUnit, undefined, notes || undefined);
          break;
        case VitalType.Weight:
          await addWeight(Number(weightValue), weightUnit, undefined, notes || undefined);
          break;
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving vital:', error);
    }
  };

  const renderBloodPressureForm = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('systolic')} (mmHg)</Text>
        <TextInput
          style={styles.input}
          value={systolic}
          onChangeText={setSystolic}
          placeholder="120"
          keyboardType="numeric"
          accessibilityLabel={t('systolic')}
          accessibilityRole="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('diastolic')} (mmHg)</Text>
        <TextInput
          style={styles.input}
          value={diastolic}
          onChangeText={setDiastolic}
          placeholder="80"
          keyboardType="numeric"
          accessibilityLabel={t('diastolic')}
          accessibilityRole="none"
        />
      </View>
    </>
  );

  const renderGlucoseForm = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('value')}</Text>
        <TextInput
          style={styles.input}
          value={glucoseValue}
          onChangeText={setGlucoseValue}
          placeholder="5.5"
          keyboardType="decimal-pad"
          accessibilityLabel={t('value')}
          accessibilityRole="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('glucose_unit')}</Text>
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, glucoseUnit === 'mmol/L' && styles.unitButtonActive]}
            onPress={() => setGlucoseUnit('mmol/L')}
            accessibilityLabel="mmol/L"
            accessibilityRole="button"
            accessibilityState={{ selected: glucoseUnit === 'mmol/L' }}
          >
            <Text style={[styles.unitButtonText, glucoseUnit === 'mmol/L' && styles.unitButtonTextActive]}>
              mmol/L
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, glucoseUnit === 'mg/dL' && styles.unitButtonActive]}
            onPress={() => setGlucoseUnit('mg/dL')}
            accessibilityLabel="mg/dL"
            accessibilityRole="button"
            accessibilityState={{ selected: glucoseUnit === 'mg/dL' }}
          >
            <Text style={[styles.unitButtonText, glucoseUnit === 'mg/dL' && styles.unitButtonTextActive]}>
              mg/dL
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderWeightForm = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('value')}</Text>
        <TextInput
          style={styles.input}
          value={weightValue}
          onChangeText={setWeightValue}
          placeholder="70"
          keyboardType="decimal-pad"
          accessibilityLabel={t('value')}
          accessibilityRole="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('weight_unit')}</Text>
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
            onPress={() => setWeightUnit('kg')}
            accessibilityLabel="kg"
            accessibilityRole="button"
            accessibilityState={{ selected: weightUnit === 'kg' }}
          >
            <Text style={[styles.unitButtonText, weightUnit === 'kg' && styles.unitButtonTextActive]}>
              kg
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'lb' && styles.unitButtonActive]}
            onPress={() => setWeightUnit('lb')}
            accessibilityLabel="lb"
            accessibilityRole="button"
            accessibilityState={{ selected: weightUnit === 'lb' }}
          >
            <Text style={[styles.unitButtonText, weightUnit === 'lb' && styles.unitButtonTextActive]}>
              lb
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{getTitle()}</Text>

        {type === VitalType.BloodPressure && renderBloodPressureForm()}
        {type === VitalType.Glucose && renderGlucoseForm()}
        {type === VitalType.Weight && renderWeightForm()}

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('notes')} ({t('optional', { defaultValue: 'Optional' })})</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('notes')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel={t('notes')}
            accessibilityRole="none"
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('cancel')}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, !isValid() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid() || isLoading}
          accessibilityLabel={t('save')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid() || isLoading }}
        >
          <Text style={[styles.saveButtonText, !isValid() && styles.saveButtonTextDisabled]}>
            {isLoading ? t('loading') : t('save')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.main,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  unitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.main,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  unitButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  unitButtonTextActive: {
    color: Colors.primary.contrast,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.background.tertiary,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  saveButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
});
