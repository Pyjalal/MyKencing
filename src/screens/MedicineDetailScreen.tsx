import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { checkDrugInteractions } from '../services/mymedix-api';
import DrugInteractionWarning from '../components/DrugInteractionWarning';

export default function MedicineDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MedicineDetail'>>();
  const medicationId = route.params?.medicationId;
  const { medications, loadMedications, removeMedication } = useMedicationStore();
  const [interactions, setInteractions] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!medications || medications.length === 0) await loadMedications();
    })();
  }, []);

  const med = useMemo(() => medications.find(m => m.id === medicationId), [medications, medicationId]);
  const coMeds = useMemo(() => medications.filter(m => m.id !== medicationId && m.isActive), [medications, medicationId]);

  useEffect(() => {
    (async () => {
      if (!med) return;
      const registrationNos = [med, ...coMeds].map(m => m.registrationNo).filter(Boolean);
      const res = await checkDrugInteractions(registrationNos);
      setInteractions(res.interactions || []);
    })();
  }, [med, coMeds]);

  const handleRemoveMedication = async () => {
    if (!med) return;

    Alert.alert(
      t('medicine_detail.remove_medicine'),
      t('medicine_detail.remove_medicine_confirmation', { name: med.mims.brandName || med.mims.genericName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRemoving(true);
              await removeMedication(medicationId);
              // Navigate back after successful removal
              navigation.goBack();
            } catch (error) {
              console.error('Error removing medication:', error);
              Alert.alert(
                t('common.error'),
                t('medicine_detail.remove_medicine_error')
              );
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  if (!med) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('medicine_detail.medicine_details')}</Text>
        <Text style={styles.text}>{t('medicine_detail.medication_not_found')}</Text>
      </View>
    );
  }

  const m = med.mims;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.lg }}>
      <Text style={styles.title}>{m.brandName || m.genericName}</Text>
      <Text style={styles.subtitle}>{m.genericName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('medicine_detail.prescription')}</Text>
        <Text style={styles.text}>{t('medicine_detail.dosage')}: {med.userDosage}</Text>
        <Text style={styles.text}>{t('add_medicine.frequency')}: {med.frequency}x {t('add_medicine.times_per_day')}</Text>
        <Text style={styles.text}>{t('medicine_detail.medication_times')}: {med.times.join(', ')}</Text>
        {med.notes ? <Text style={styles.text}>{t('add_vital.notes')}: {med.notes}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('medicine_detail.mims_information')}</Text>
        {m.instructions ? <Text style={styles.text}>{m.instructions}</Text> : null}
        {m.foodInstructions ? <Text style={styles.text}>{t('medicine_detail.food_instructions')}: {m.foodInstructions}</Text> : null}
        {m.warnings ? <Text style={styles.text}>{t('medicine_detail.warnings_label')}: {m.warnings}</Text> : null}
        {m.sideEffects ? <Text style={styles.text}>{t('medicine_detail.side_effects_label')}: {m.sideEffects}</Text> : null}
        {m.contraindications ? <Text style={styles.text}>{t('medicine_detail.contraindications_label')}: {m.contraindications}</Text> : null}
      </View>

      {interactions.length > 0 && (
        <DrugInteractionWarning interactions={interactions} severity="high" />
      )}

      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemoveMedication}
        disabled={isRemoving}
      >
        <Text style={styles.removeButtonText}>
          {isRemoving ? t('common.removing') : t('medicine_detail.remove_medicine_button')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: { marginTop: 4, color: Colors.text.secondary },
  card: { marginTop: Spacing.lg, backgroundColor: Colors.background.card, borderRadius: 8, padding: Spacing.md },
  cardTitle: { color: Colors.text.primary, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, marginBottom: 6 },
  text: { color: Colors.text.secondary, marginTop: 4, lineHeight: Typography.fontSize.base * Typography.lineHeight.normal },
  warn: { color: Colors.status.error },
  removeButton: {
    backgroundColor: Colors.status.error,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});