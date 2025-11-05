import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList, ExtractedMedicine, Medication, FoodTiming } from '../types';
import { searchMIMS, getMIMSMedicine } from '../services/mims';
import { useMedicationStore } from '../stores/medicationStore';
import { MEDICATION_TIMING } from '../constants/clinical';
import { scheduleMedicationReminders, createDoseEntries } from '../services/notifications';
import DrugInteractionWarning from '../components/DrugInteractionWarning';

export default function AddMedicineScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddMedicine'>>();
  const scannedData = route.params?.scannedData || [];
  const { addMedication, medications } = useMedicationStore();

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; genericName: string; brandName?: string; strength?: string; dosageForm?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [interactions, setInteractions] = useState<string[]>([]);

  const derivedItems = useMemo(() => scannedData.map((m) => ({ ...m })), [scannedData]);

  const getTimesForFrequency = (freq: string | undefined): string[] => {
    if (!freq) return MEDICATION_TIMING.onceDailyMorning;
    if (freq === 'as needed') return MEDICATION_TIMING.onceDailyMorning;
    const n = parseInt(freq, 10);
    if (n === 1) return MEDICATION_TIMING.onceDailyMorning;
    if (n === 2) return MEDICATION_TIMING.twiceDaily;
    if (n === 3) return MEDICATION_TIMING.threeTimesDaily;
    if (n >= 4) return MEDICATION_TIMING.fourTimesDaily;
    return MEDICATION_TIMING.onceDailyMorning;
  };

  const checkForInteractions = useCallback(async (newMimsId: string) => {
    try {
      const newMed = await getMIMSMedicine(newMimsId);
      if (!newMed) {
        setInteractions([]);
        return;
      }

      const activeMeds = medications.filter(m => m.isActive);
      const foundInteractions: string[] = [];

      for (const med of activeMeds) {
        if (med.mims?.drugInteractions) {
          if (med.mims.drugInteractions.toLowerCase().includes(newMed.genericName.toLowerCase())) {
            foundInteractions.push(
              `${newMed.brandName || newMed.genericName} may interact with ${med.mims.brandName || med.mims.genericName}`
            );
          }
        }
      }

      if (newMed.drugInteractions) {
        for (const med of activeMeds) {
          const medName = med.mims?.genericName || '';
          if (newMed.drugInteractions.toLowerCase().includes(medName.toLowerCase())) {
            const interactionMsg = `${newMed.brandName || newMed.genericName} may interact with ${med.mims?.brandName || med.mims?.genericName}`;
            if (!foundInteractions.includes(interactionMsg)) {
              foundInteractions.push(interactionMsg);
            }
          }
        }
      }

      setInteractions(foundInteractions);
    } catch (error) {
      console.error('Error checking interactions:', error);
      setInteractions([]);
    }
  }, [medications]);

  const saveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      const allNewMimsIds: string[] = [];
      for (const item of derivedItems) {
        const matches = await searchMIMS(item.name, 5);
        if (matches && matches.length > 0) {
          allNewMimsIds.push(matches[0].id);
        }
      }

      const allInteractions: string[] = [];
      for (const mimsId of allNewMimsIds) {
        await checkForInteractions(mimsId);
        if (interactions.length > 0) {
          allInteractions.push(...interactions);
        }
      }

      if (allInteractions.length > 0) {
        setInteractions(allInteractions);
      }

      for (const item of derivedItems) {
        const matches = await searchMIMS(item.name, 5);
        if (!matches || matches.length === 0) continue;
        const best = matches[0];

        const times = getTimesForFrequency(item.frequency);
        const now = new Date().toISOString().slice(0, 10);
        const medInput: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
          mimsId: best.id,
          userDosage: item.dosage || item.strength || '1 tablet',
          frequency: parseInt(item.frequency || '1', 10) || 1,
          times,
          withFood: FoodTiming.NoPreference,
          startDate: now,
          endDate: undefined,
          refillDate: undefined,
          isActive: true,
          notes: undefined,
        } as any;

        const newId = await addMedication(medInput);
        await createDoseEntries(newId, times, now);
        await scheduleMedicationReminders({ ...(medInput as any), id: newId } as Medication);
      }

      setMessage(t('add_medicine.saved_successfully'));
      setInteractions([]);
      navigation.goBack();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [derivedItems, addMedication, navigation, checkForInteractions, interactions]);

  const onSearch = useCallback(async () => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await searchMIMS(query.trim(), 20);
      setResults(res as any);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const quickAdd = useCallback(async (mimsId: string, label: string) => {
    try {
      setIsSaving(true);
      await checkForInteractions(mimsId);

      const times = MEDICATION_TIMING.onceDailyMorning;
      const now = new Date().toISOString().slice(0, 10);
      const medInput: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
        mimsId,
        userDosage: '1 tablet',
        frequency: 1,
        times,
        withFood: FoodTiming.NoPreference,
        startDate: now,
        endDate: undefined,
        refillDate: undefined,
        isActive: true,
        notes: undefined,
      } as any;
      const newId = await addMedication(medInput);
      await createDoseEntries(newId, times, now);
      await scheduleMedicationReminders({ ...(medInput as any), id: newId } as Medication);
      setMessage(t('add_medicine.added_medication', { name: label }));

      setInteractions([]);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [addMedication, checkForInteractions]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('add_medicine.title')}</Text>
      {scannedData.length === 0 ? (
        <>
          <Text style={styles.subtitle}>{t('add_medicine.scan_or_search')}</Text>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('ScanPrescription') }>
            <Text style={styles.actionText}>{t('add_medicine.scan_prescription')}</Text>
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <TextInput
              placeholder={t('add_medicine.search_mims')}
              placeholderTextColor={Colors.text.tertiary}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
            <TouchableOpacity style={[styles.smallBtn]} onPress={onSearch} disabled={searching}>
              <Text style={styles.smallBtnText}>{searching ? '...' : t('add_medicine.search')}</Text>
            </TouchableOpacity>
          </View>
          {interactions.length > 0 && (
            <DrugInteractionWarning
              interactions={interactions}
              severity="high"
              testID="drug-interaction-warning"
            />
          )}
          <FlatList
            data={results}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.brandName || item.genericName}</Text>
                <Text style={styles.cardLine}>{item.genericName} {item.strength || ''} {item.dosageForm || ''}</Text>
                <TouchableOpacity style={[styles.smallBtn, styles.mt8]} onPress={() => quickAdd(item.id, item.brandName || item.genericName)}>
                  <Text style={styles.smallBtnText}>{t('add_medicine.add')}</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: Spacing.md, gap: 8 }}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>{t('add_medicine.review_extracted')}</Text>
          {interactions.length > 0 && (
            <DrugInteractionWarning
              interactions={interactions}
              severity="high"
              testID="drug-interaction-warning"
            />
          )}
          <FlatList
            data={derivedItems}
            keyExtractor={(it, idx) => `${it.name}-${idx}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLine}>{t('add_medicine.strength_dosage')}: {item.strength || item.dosage || '-'}</Text>
                <Text style={styles.cardLine}>{t('add_medicine.frequency')}: {item.frequency || '1'}x / {t('add_medicine.times_per_day')}</Text>
                <Text style={styles.cardLine}>{t('add_medicine.confidence')}: {Math.round((item.confidence || 0) * 100)}%</Text>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: Spacing.md, gap: 8 }}
          />
          <TouchableOpacity style={[styles.action, isSaving && styles.disabled]} disabled={isSaving} onPress={saveAll}>
            {isSaving ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={styles.actionText}>{t('add_medicine.save_all')}</Text>}
          </TouchableOpacity>
          {message && <Text style={styles.message}>{message}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  action: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  disabled: { opacity: 0.6 },
  message: { marginTop: Spacing.sm, color: Colors.text.secondary },
  card: { backgroundColor: Colors.background.card, borderRadius: 8, padding: Spacing.md },
  cardTitle: { color: Colors.text.primary, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold },
  cardLine: { color: Colors.text.secondary, marginTop: 4 },
  searchBox: { marginTop: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.light, borderRadius: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.text.primary },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Colors.primary.main, borderRadius: 8 },
  smallBtnText: { color: Colors.text.inverse, fontWeight: Typography.fontWeight.semibold },
  mt8: { marginTop: 8 },
});