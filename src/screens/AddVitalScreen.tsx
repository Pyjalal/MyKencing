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
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useVitalsStore } from '../stores/vitalsStore';
import { CONVERSIONS } from '../constants/clinical';

type AddVitalScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddVital'>;
  route: RouteProp<RootStackParamList, 'AddVital'>;
};

export default function AddVitalScreen({ navigation, route }: AddVitalScreenProps) {
  const { t } = useTranslation();
  const { type } = route.params || {};
  const {
    addBloodPressure,
    addGlucose,
    addWeight,
    addWaistCircumference,
    addTotalCholesterol,
    addHdlCholesterol,
    isLoading,
  } = useVitalsStore();

  // Blood Pressure fields
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');

  // Glucose fields
  const [glucoseValue, setGlucoseValue] = useState('');
  const [glucoseUnit, setGlucoseUnit] = useState<'mmol/L' | 'mg/dL'>('mmol/L');

  // Weight fields
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

  // Waist circumference fields
  const [waistValue, setWaistValue] = useState('');

  // Cholesterol fields
  const [cholesterolValue, setCholesterolValue] = useState('');

  // Common fields
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getTitle = () => {
    switch (type) {
      case VitalType.BloodPressure:
        return t('add_vital.blood_pressure');
      case VitalType.Glucose:
        return t('add_vital.glucose');
      case VitalType.Weight:
        return t('add_vital.weight');
      case VitalType.WaistCircumference:
        return t('add_vital.waist_circumference');
      case VitalType.TotalCholesterol:
        return t('add_vital.total_cholesterol');
      case VitalType.HDLCholesterol:
        return t('add_vital.hdl_cholesterol');
      default:
        return t('add_vital.add_vital');
    }
  };

  const ranges = {
    bloodPressure: { systolic: { min: 60, max: 220 }, diastolic: { min: 30, max: 120 } },
    glucoseMmol: { min: 2, max: 11 },
    weightKg: { min: 25, max: 220 },
    waistCm: { min: 30, max: 200 },
  };

  const isValid = () => {
    switch (type) {
      case VitalType.BloodPressure: {
        const systolicVal = Number(systolic);
        const diastolicVal = Number(diastolic);
        return (
          !isNaN(systolicVal) &&
          !isNaN(diastolicVal) &&
          systolicVal >= ranges.bloodPressure.systolic.min &&
          systolicVal <= ranges.bloodPressure.systolic.max &&
          diastolicVal >= ranges.bloodPressure.diastolic.min &&
          diastolicVal <= ranges.bloodPressure.diastolic.max
        );
      }
      case VitalType.Glucose: {
        const glucoseVal = Number(glucoseValue);
        if (isNaN(glucoseVal)) return false;
        const glucoseMmol =
          glucoseUnit === 'mmol/L'
            ? glucoseVal
            : glucoseVal * CONVERSIONS.glucoseMgdlToMmol;
        return (
          glucoseMmol >= ranges.glucoseMmol.min &&
          glucoseMmol <= ranges.glucoseMmol.max
        );
      }
      case VitalType.Weight: {
        const weightVal = Number(weightValue);
        if (isNaN(weightVal)) return false;
        const weightKg =
          weightUnit === 'kg' ? weightVal : weightVal * CONVERSIONS.lbToKg;
        return (
          weightKg >= ranges.weightKg.min &&
          weightKg <= ranges.weightKg.max
        );
      }
      case VitalType.WaistCircumference: {
        const waistVal = Number(waistValue);
        return (
          !isNaN(waistVal) &&
          waistVal >= ranges.waistCm.min &&
          waistVal <= ranges.waistCm.max
        );
      }
      case VitalType.TotalCholesterol:
      case VitalType.HDLCholesterol: {
        const cholVal = Number(cholesterolValue);
        return !isNaN(cholVal) && cholVal > 0;
      }
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (!isValid()) {
      setError(t('add_vital.error_invalid_input'));
      return;
    }

    try {
      switch (type) {
        case VitalType.BloodPressure: {
          const systolicVal = Number(systolic);
          const diastolicVal = Number(diastolic);
          if (
            systolicVal < 60 ||
            systolicVal > 220 ||
            diastolicVal < 30 ||
            diastolicVal > 120
          ) {
            setError(t('add_vital.error_bp_range'));
            return;
          }
          await addBloodPressure(systolicVal, diastolicVal, undefined, notes || undefined);
          break;
        }
        case VitalType.Glucose: {
          const glucoseVal = Number(glucoseValue);
          const glucoseMmol =
            glucoseUnit === 'mmol/L'
              ? glucoseVal
              : glucoseVal * CONVERSIONS.glucoseMgdlToMmol;
          if (glucoseMmol < 2 || glucoseMmol > 11) {
            setError(t('add_vital.error_glucose_range'));
            return;
          }
          await addGlucose(glucoseVal, glucoseUnit, undefined, notes || undefined);
          break;
        }
        case VitalType.Weight: {
          const weightVal = Number(weightValue);
          const weightKg =
            weightUnit === 'kg' ? weightVal : weightVal * CONVERSIONS.lbToKg;
          if (weightKg < 25 || weightKg > 220) {
            setError(t('add_vital.error_weight_range'));
            return;
          }
          await addWeight(weightVal, weightUnit, undefined, notes || undefined);
          break;
        }
        case VitalType.WaistCircumference: {
          const waistVal = Number(waistValue);
          if (waistVal < 30 || waistVal > 200) {
            setError(t('add_vital.error_waist_range'));
            return;
          }
          await addWaistCircumference(waistVal, undefined, notes || undefined);
          break;
        }
        case VitalType.TotalCholesterol:
          await addTotalCholesterol(Number(cholesterolValue), undefined, notes || undefined);
          break;
        case VitalType.HDLCholesterol:
          await addHdlCholesterol(Number(cholesterolValue), undefined, notes || undefined);
          break;
      }
      setError(null);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving vital:', error);
    }
  };

  const renderBloodPressureForm = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('add_vital.systolic')} (mmHg)</Text>
        <TextInput
          style={styles.input}
          value={systolic}
          onChangeText={(value) => {
            setError(null);
            setSystolic(value);
          }}
          placeholder="120"
          keyboardType="numeric"
          accessibilityLabel={t('add_vital.systolic')}
          accessibilityRole="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('add_vital.diastolic')} (mmHg)</Text>
        <TextInput
          style={styles.input}
          value={diastolic}
          onChangeText={(value) => {
            setError(null);
            setDiastolic(value);
          }}
          placeholder="80"
          keyboardType="numeric"
          accessibilityLabel={t('add_vital.diastolic')}
          accessibilityRole="none"
        />
      </View>
    </>
  );

  const renderGlucoseForm = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('add_vital.value')}</Text>
        <TextInput
          style={styles.input}
          value={glucoseValue}
          onChangeText={(value) => {
            setError(null);
            setGlucoseValue(value);
          }}
          placeholder="5.5"
          keyboardType="decimal-pad"
          accessibilityLabel={t('add_vital.value')}
          accessibilityRole="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('add_vital.glucose_unit')}</Text>
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, glucoseUnit === 'mmol/L' && styles.unitButtonActive]}
            onPress={() => {
              setError(null);
              setGlucoseUnit('mmol/L');
            }}
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
            onPress={() => {
              setError(null);
              setGlucoseUnit('mg/dL');
            }}
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
        <Text style={styles.label}>{t('add_vital.value')}</Text>
        <TextInput
          style={styles.input}
          value={weightValue}
          onChangeText={(value) => {
            setError(null);
            setWeightValue(value);
          }}
          placeholder="70"
          keyboardType="decimal-pad"
          accessibilityLabel={t('add_vital.value')}
          accessibilityRole="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('add_vital.weight_unit')}</Text>
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
            onPress={() => {
              setError(null);
              setWeightUnit('kg');
            }}
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
            onPress={() => {
              setError(null);
              setWeightUnit('lb');
            }}
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

  const renderWaistForm = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{t('add_vital.value')} (cm)</Text>
      <TextInput
        style={styles.input}
        value={waistValue}
        onChangeText={(value) => {
          setError(null);
          setWaistValue(value);
        }}
        placeholder="85"
        keyboardType="decimal-pad"
        accessibilityLabel={t('add_vital.value')}
        accessibilityRole="none"
      />
    </View>
  );

  const renderCholesterolForm = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{t('add_vital.value')} (mmol/L)</Text>
      <TextInput
        style={styles.input}
        value={cholesterolValue}
        onChangeText={(value) => {
          setError(null);
          setCholesterolValue(value);
        }}
        placeholder="4.8"
        keyboardType="decimal-pad"
        accessibilityLabel={t('add_vital.value')}
        accessibilityRole="none"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{getTitle()}</Text>

        {error && (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {type === VitalType.BloodPressure && renderBloodPressureForm()}
        {type === VitalType.Glucose && renderGlucoseForm()}
        {type === VitalType.Weight && renderWeightForm()}
        {type === VitalType.WaistCircumference && renderWaistForm()}
        {(type === VitalType.TotalCholesterol || type === VitalType.HDLCholesterol) &&
          renderCholesterolForm()}

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('add_vital.notes')} ({t('add_vital.optional')})</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={(value) => {
              setError(null);
              setNotes(value);
            }}
            placeholder={t('add_vital.notes')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel={t('add_vital.notes')}
            accessibilityRole="none"
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('add_vital.cancel')}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>{t('add_vital.cancel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, !isValid() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid() || isLoading}
          accessibilityLabel={t('add_vital.save')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid() || isLoading }}
        >
          <Text style={[styles.saveButtonText, !isValid() && styles.saveButtonTextDisabled]}>
            {isLoading ? t('add_vital.loading') : t('add_vital.save')}
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
  errorBanner: {
    backgroundColor: Colors.status.errorLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.status.errorDark,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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