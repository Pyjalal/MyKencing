import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { checkDrugInteractions } from '../services/mims';

export default function MedicineDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MedicineDetail'>>();
  const medicationId = route.params?.medicationId;
  const { medications, loadMedications } = useMedicationStore();
  const [interactions, setInteractions] = useState<string[]>([]);

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
      const mimsIds = [med, ...coMeds].map(m => m.mimsId);
      const res = await checkDrugInteractions(mimsIds);
      setInteractions(res.interactions || []);
    })();
  }, [med, coMeds]);

  if (!med) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Medicine Details</Text>
        <Text style={styles.text}>Medication not found.</Text>
      </View>
    );
  }

  const m = med.mims;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.lg }}>
      <Text style={styles.title}>{m.brandName || m.genericName}</Text>
      <Text style={styles.subtitle}>{m.genericName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prescription</Text>
        <Text style={styles.text}>Dosage: {med.userDosage}</Text>
        <Text style={styles.text}>Frequency: {med.frequency}x daily</Text>
        <Text style={styles.text}>Times: {med.times.join(', ')}</Text>
        {med.notes ? <Text style={styles.text}>Notes: {med.notes}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>MIMS Information</Text>
        {m.instructions ? <Text style={styles.text}>Instructions: {m.instructions}</Text> : null}
        {m.foodInstructions ? <Text style={styles.text}>Food: {m.foodInstructions}</Text> : null}
        {m.warnings ? <Text style={styles.text}>Warnings: {m.warnings}</Text> : null}
        {m.sideEffects ? <Text style={styles.text}>Side Effects: {m.sideEffects}</Text> : null}
        {m.contraindications ? <Text style={styles.text}>Contraindications: {m.contraindications}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Interaction Check</Text>
        {interactions.length === 0 ? (
          <Text style={styles.text}>No known interactions with your other medications.</Text>
        ) : (
          interactions.map((line, idx) => (
            <Text key={idx} style={[styles.text, styles.warn]}>{line}</Text>
          ))
        )}
      </View>
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
});
