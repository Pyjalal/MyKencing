import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors, Typography, Spacing } from '../constants/theme';
import { VitalType } from '../types';

export default function VitalsScreen() {
  const { vitals, loadVitals } = useVitalsStore();

  useEffect(() => {
    loadVitals();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health Vitals</Text>
          <Text style={styles.headerSubtitle}>Track your health metrics</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.vitalButton}>
              <Text style={styles.vitalButtonText}>Blood Pressure</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.vitalButton}>
              <Text style={styles.vitalButtonText}>Glucose</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.vitalButton}>
              <Text style={styles.vitalButtonText}>Weight</Text>
            </TouchableOpacity>
          </View>
        </View>

        {vitals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No vitals logged yet</Text>
            <Text style={styles.emptyStateText}>
              Start tracking your health by logging your first vital
            </Text>
          </View>
        )}

        {vitals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Readings</Text>
            {vitals.slice(0, 10).map((vital) => (
              <View key={vital.id} style={styles.vitalCard}>
                <Text style={styles.vitalType}>{vital.type.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.vitalValue}>
                  {vital.type === VitalType.BloodPressure
                    ? `${vital.systolic}/${vital.diastolic} ${vital.unit}`
                    : `${vital.value} ${vital.unit}`}
                </Text>
                <Text style={styles.vitalDate}>
                  {new Date(vital.measuredAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  vitalButton: {
    flex: 1,
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary.main,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
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
  },
  vitalCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  vitalType: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  vitalDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});
