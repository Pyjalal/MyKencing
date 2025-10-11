import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors, Typography, Spacing } from '../constants/theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { todayDoses, medications, loadMedications, loadTodayDoses, markDose } =
    useMedicationStore();

  useEffect(() => {
    loadMedications();
    loadTodayDoses();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Medications</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-MY', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {todayDoses.length === 0 && medications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No medications yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first medication by scanning a prescription or searching manually
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddMedicine', {})}
            >
              <Text style={styles.addButtonText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        )}

        {todayDoses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Doses</Text>
            {todayDoses.map((dose) => (
              <View key={dose.id} style={styles.doseCard}>
                <View style={styles.doseInfo}>
                  <Text style={styles.doseMedName}>
                    {dose.medication.mims.brandName || dose.medication.mims.genericName}
                  </Text>
                  <Text style={styles.doseDosage}>{dose.medication.userDosage}</Text>
                  <Text style={styles.doseTime}>
                    {new Date(dose.scheduledTime).toLocaleTimeString('en-MY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.doseActions}>
                  <Text style={styles.doseStatus}>{dose.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Medications</Text>
            {medications.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={styles.medCard}
                onPress={() => navigation.navigate('MedicineDetail', { medicationId: med.id })}
              >
                <Text style={styles.medName}>
                  {med.mims.brandName || med.mims.genericName}
                </Text>
                <Text style={styles.medDetails}>
                  {med.userDosage} • {med.frequency}x daily
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {medications.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddMedicine', {})}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary.main,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  addButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  doseCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doseInfo: {
    flex: 1,
  },
  doseMedName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  doseDosage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  doseTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    marginTop: 4,
  },
  doseActions: {
    alignItems: 'flex-end',
  },
  doseStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },
  medCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  medName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  medDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
  },
});
