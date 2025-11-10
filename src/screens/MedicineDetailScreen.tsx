import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useInteractionStore } from '../stores/interactionStore';
import type { ApiInteraction } from '../services/api-client';

export default function MedicineDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MedicineDetail'>>();
  const medicationId = route.params?.medicationId;
  const { medications, loadMedications, removeMedication, acknowledgeInteractions } = useMedicationStore();
  const { getInteractions, getFoodInteractions } = useInteractionStore();
  const [interactions, setInteractions] = useState<ApiInteraction[]>([]);
  const [foodInteractions, setFoodInteractions] = useState<ApiInteraction[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

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
      console.log('[MedicineDetailScreen] Checking interactions for medication:', med.id);
      const registrationNos = [med, ...coMeds].map(m => m.registrationNo).filter(Boolean);
      console.log('[MedicineDetailScreen] Registration numbers:', registrationNos);
      
      // Use interaction store which handles caching
      const res = await getInteractions(registrationNos);
      console.log('[MedicineDetailScreen] Interaction result:', res);
      setInteractions(res.interactions || []);
    })();
  }, [med, coMeds]);

  // Fetch food interactions
  useEffect(() => {
    (async () => {
      if (!med) return;
      console.log('[MedicineDetailScreen] Checking food interactions for medication:', med.id);
      const registrationNos = [med.registrationNo].filter(Boolean);
      console.log('[MedicineDetailScreen] Registration numbers for food:', registrationNos);
      
      // Fetch food interactions
      const res = await getFoodInteractions(registrationNos);
      console.log('[MedicineDetailScreen] Food interaction result:', res);
      setFoodInteractions(res.interactions || []);
    })();
  }, [med]);

  // Separate high-risk interactions
  const highRiskInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      const severity = interaction.severityRating?.rating || interaction.severity || '';
      return severity.toLowerCase().includes('severe') || severity.toLowerCase().includes('high');
    });
  }, [interactions]);

  // Get unacknowledged high-risk interactions
  const unacknowledgedHighRiskInteractions = useMemo(() => {
    if (!med) return [];
    const acknowledgedIds = med.acknowledgedInteractionIds || [];
    return highRiskInteractions.filter(
      interaction => !acknowledgedIds.includes(interaction.interactionId)
    );
  }, [highRiskInteractions, med]);

  const handleAcknowledgeInteractions = async () => {
    if (!med || unacknowledgedHighRiskInteractions.length === 0) return;

    try {
      setIsAcknowledging(true);
      const interactionIds = unacknowledgedHighRiskInteractions.map(i => i.interactionId);
      
      await acknowledgeInteractions(medicationId, interactionIds);
      
      Alert.alert(
        t('medicine_detail.acknowledged_title', 'Interactions Acknowledged'),
        t('medicine_detail.acknowledged_message', 'You can now take or skip doses for this medication. Please follow your doctor\'s advice.')
      );
    } catch (error) {
      console.error('Error acknowledging interactions:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('medicine_detail.acknowledge_error', 'Failed to acknowledge interactions')
      );
    } finally {
      setIsAcknowledging(false);
    }
  };

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

      {/* Unacknowledged High-Risk Interactions */}
      {unacknowledgedHighRiskInteractions.length > 0 && (
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>⚠️ High-Risk Drug Interactions</Text>
          <Text style={styles.dangerSubtitle}>
            Please review these interactions and acknowledge that you understand the risks.
          </Text>
          
          {unacknowledgedHighRiskInteractions.map((interaction, index) => (
            <View key={interaction.interactionId} style={styles.interactionItem}>
              <Text style={styles.interactionDrugs}>
                {interaction.firstReactant} + {interaction.secondReactant}
              </Text>
              <Text style={styles.interactionSeverity}>
                Severity: {interaction.severityRating?.rating || interaction.severity || 'Unknown'}
              </Text>
              {interaction.explanation && (
                <Text style={styles.interactionExplanation}>{interaction.explanation}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.acknowledgeButton, isAcknowledging && styles.acknowledgeButtonDisabled]}
            onPress={handleAcknowledgeInteractions}
            disabled={isAcknowledging}
          >
            {isAcknowledging ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.acknowledgeButtonText}>
                I Understand - Acknowledge Interactions
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Acknowledged High-Risk Interactions (informational only) */}
      {highRiskInteractions.length > 0 && unacknowledgedHighRiskInteractions.length === 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Acknowledged Interactions</Text>
          <Text style={styles.infoSubtitle}>
            You have acknowledged these high-risk interactions. Please follow your doctor's advice.
          </Text>
          
          {highRiskInteractions.map((interaction, index) => (
            <View key={interaction.interactionId} style={styles.interactionItemInfo}>
              <Text style={styles.interactionDrugs}>
                {interaction.firstReactant} + {interaction.secondReactant}
              </Text>
              <Text style={styles.interactionSeverity}>
                Severity: {interaction.severityRating?.rating || interaction.severity || 'Unknown'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Food, Drink & Tobacco Interactions */}
      {foodInteractions.length > 0 && (
        <View style={styles.foodCard}>
          <Text style={styles.foodTitle}>Food, Drink & Tobacco Interactions</Text>
          <Text style={styles.foodSubtitle}>
            This medication may interact with certain foods, drinks, or tobacco.
          </Text>
          
          {foodInteractions.map((interaction, index) => (
            <View key={interaction.interactionId} style={styles.foodInteractionItem}>
              <Text style={styles.foodInteractionDrugs}>
                {interaction.firstReactant} + {interaction.secondReactant}
              </Text>
              {interaction.severityRating?.rating && (
                <Text style={styles.foodInteractionSeverity}>
                  Severity: {interaction.severityRating.rating}
                </Text>
              )}
              {interaction.explanation && (
                <Text style={styles.foodInteractionExplanation}>{interaction.explanation}</Text>
              )}
              {interaction.action && (
                <Text style={styles.foodInteractionAction}>
                  Recommendation: {interaction.action}
                </Text>
              )}
            </View>
          ))}
        </View>
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
  dangerCard: {
    marginTop: Spacing.lg,
    backgroundColor: '#FFE8E8',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.status.error,
  },
  dangerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.error,
    marginBottom: Spacing.xs,
  },
  dangerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    marginTop: Spacing.lg,
    backgroundColor: '#E3F2FD',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: '#1976D2',
    marginBottom: Spacing.xs,
  },
  infoSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  interactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  interactionItemInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  interactionDrugs: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  interactionSeverity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.error,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  interactionExplanation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  acknowledgeButton: {
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  acknowledgeButtonDisabled: {
    opacity: 0.6,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
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
  foodCard: {
    marginTop: Spacing.lg,
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  foodTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: '#F57C00',
    marginBottom: Spacing.xs,
  },
  foodSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  foodInteractionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  foodInteractionDrugs: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  foodInteractionSeverity: {
    fontSize: Typography.fontSize.sm,
    color: '#F57C00',
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  foodInteractionExplanation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginBottom: Spacing.xs,
  },
  foodInteractionAction: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    fontStyle: 'italic',
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
});