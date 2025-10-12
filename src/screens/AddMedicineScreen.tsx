import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList, ExtractedMedicine, Medication, FoodTiming } from '../types';
import { searchMIMS } from '../services/mims';
import { useMedicationStore } from '../stores/medicationStore';
import { MEDICATION_TIMING } from '../constants/clinical';
import { scheduleMedicationReminders, createDoseEntries } from '../services/notifications';

export default function AddMedicineScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddMedicine'>>();
  const scannedData = route.params?.scannedData || [];
  const { addMedication } = useMedicationStore();

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; genericName: string; brandName?: string; strength?: string; dosageForm?: string }>>([]);
  const [searching, setSearching] = useState(false);

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

  const saveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      for (const item of derivedItems) {
        // Match to MIMS (best single match)
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

      setMessage('Saved medications successfully');
      navigation.goBack();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [derivedItems, addMedication, navigation]);

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
      setMessage(`Added ${label}`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [addMedication]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Medicine</Text>
      {scannedData.length === 0 ? (
        <>
          <Text style={styles.subtitle}>Scan prescription or search manually</Text>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('ScanPrescription') }>
            <Text style={styles.actionText}>Scan Prescription</Text>
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search MIMS (name or brand)"
              placeholderTextColor={Colors.text.tertiary}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
            <TouchableOpacity style={[styles.smallBtn]} onPress={onSearch} disabled={searching}>
              <Text style={styles.smallBtnText}>{searching ? '...' : 'Search'}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={results}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.brandName || item.genericName}</Text>
                <Text style={styles.cardLine}>{item.genericName} {item.strength || ''} {item.dosageForm || ''}</Text>
                <TouchableOpacity style={[styles.smallBtn, styles.mt8]} onPress={() => quickAdd(item.id, item.brandName || item.genericName)}>
                  <Text style={styles.smallBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: Spacing.md, gap: 8 }}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Review extracted medications</Text>
          <FlatList
            data={derivedItems}
            keyExtractor={(it, idx) => `${it.name}-${idx}`}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLine}>Strength/Dosage: {item.strength || item.dosage || '-'}</Text>
                <Text style={styles.cardLine}>Frequency: {item.frequency || '1'}x / day</Text>
                <Text style={styles.cardLine}>Confidence: {Math.round((item.confidence || 0) * 100)}%</Text>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: Spacing.md, gap: 8 }}
          />
          <TouchableOpacity style={[styles.action, isSaving && styles.disabled]} disabled={isSaving} onPress={saveAll}>
            {isSaving ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={styles.actionText}>Save All</Text>}
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
