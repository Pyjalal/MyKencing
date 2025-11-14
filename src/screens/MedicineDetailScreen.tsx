import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useInteractionStore } from '../stores/interactionStore';
import type { ApiInteraction } from '../services/api-client';
import { isHighRiskInteraction, isMedicationInvolvedInInteraction } from '../utils/interactionFilters';
import { Trash2, Clock } from 'lucide-react-native';
import DatePicker from 'react-native-date-picker';
import { TimePickerPill } from '../components';

export default function MedicineDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MedicineDetail'>>();
  const medicationId = route.params?.medicationId;
  const { medications, loadMedications, removeMedication, acknowledgeInteractions, rescheduleMedication } = useMedicationStore();
  const { getInteractions, getFoodInteractions } = useInteractionStore();
  const [interactions, setInteractions] = useState<ApiInteraction[]>([]);
  const [foodInteractions, setFoodInteractions] = useState<ApiInteraction[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleOption, setRescheduleOption] = useState<'today' | 'all' | null>(null);
  const [newTimes, setNewTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isRescheduling, setIsRescheduling] = useState(false);

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
    return interactions.filter(isHighRiskInteraction);
  }, [interactions]);

  // Get unacknowledged high-risk interactions involving this medicine's active ingredients
  const unacknowledgedHighRiskInteractions = useMemo(() => {
    if (!med) return [];
    const acknowledgedIds = med.acknowledgedInteractionIds || [];
    const activeIngredients = med.mims.activeIngredients || [];
    
    return highRiskInteractions.filter(interaction => {
      // Must not be acknowledged
      if (acknowledgedIds.includes(interaction.interactionId)) return false;
      
      // Check if this medicine's active ingredients are involved in the interaction
      return isMedicationInvolvedInInteraction(activeIngredients, interaction);
    });
  }, [highRiskInteractions, med]);

  // Filter acknowledged interactions to only show ones involving this medicine's active ingredients
  const acknowledgedHighRiskInteractions = useMemo(() => {
    if (!med) return [];
    const acknowledgedIds = med.acknowledgedInteractionIds || [];
    const activeIngredients = med.mims.activeIngredients || [];
    
    return highRiskInteractions.filter(interaction => {
      // Must be acknowledged
      if (!acknowledgedIds.includes(interaction.interactionId)) return false;
      
      // Check if this medicine's active ingredients are involved in the interaction
      return isMedicationInvolvedInInteraction(activeIngredients, interaction);
    });
  }, [highRiskInteractions, med]);

  const handleAcknowledgeInteractions = async () => {
    if (!med || unacknowledgedHighRiskInteractions.length === 0) return;

    try {
      setIsAcknowledging(true);
      const interactionIds = unacknowledgedHighRiskInteractions.map(i => i.interactionId);
      
      await acknowledgeInteractions(medicationId, interactionIds);
      
      Alert.alert(
        t('medicine_detail.acknowledged_title'),
        t('medicine_detail.acknowledged_message')
      );
    } catch (error) {
      console.error('Error acknowledging interactions:', error);
      Alert.alert(
        t('common.error'),
        t('medicine_detail.acknowledge_error')
      );
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleReschedule = () => {
    if (!med) return;
    setNewTimes([...med.times]);
    setShowRescheduleModal(true);
  };

  const handleRescheduleOptionSelect = (option: 'today' | 'all') => {
    setRescheduleOption(option);
  };

  const handleAddTime = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setNewTimes([...newTimes, timeStr]);
  };

  const handleRemoveTime = (index: number) => {
    setNewTimes(newTimes.filter((_, i) => i !== index));
  };

  const handleTimeChange = (selectedDate: Date) => {
    const timeStr = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
    const updatedTimes = [...newTimes];
    updatedTimes[currentTimeIndex] = timeStr;
    setNewTimes(updatedTimes);
    setShowTimePicker(false);
  };

  const handleEditTime = (index: number) => {
    setCurrentTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleOption || newTimes.length === 0) {
      Alert.alert(
        t('common.error'),
        rescheduleOption ? 'Please add at least one time' : t('medicine_detail.reschedule_subtitle')
      );
      return;
    }

    try {
      setIsRescheduling(true);
      await rescheduleMedication(medicationId, newTimes, rescheduleOption === 'all');
      
      setShowRescheduleModal(false);
      setRescheduleOption(null);
      
      Alert.alert(
        t('medicine_detail.rescheduled_success'),
        t('medicine_detail.rescheduled_success_message')
      );
    } catch (error) {
      console.error('Error rescheduling medication:', error);
      Alert.alert(
        t('common.error'),
        t('medicine_detail.reschedule_error')
      );
    } finally {
      setIsRescheduling(false);
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

  // Parse time for time picker
  const getDateFromTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
        <Text style={styles.title}>{m.brandName || m.genericName}</Text>
        <Text style={styles.subtitle}>{m.genericName}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('medicine_detail.prescription')}</Text>
        <Text style={styles.text}>{t('medicine_detail.dosage')}: {med.userDosage}</Text>
        <Text style={styles.text}>{t('add_medicine.frequency')}: {med.frequency}x {t('add_medicine.times_per_day')}</Text>
        <Text style={styles.text}>{t('medicine_detail.medication_times')}: {med.times.join(', ')}</Text>
        {med.notes ? <Text style={styles.text}>{t('add_vital.notes')}: {med.notes}</Text> : null}
      </View>

      {/* Unacknowledged High-Risk Interactions */}
      {unacknowledgedHighRiskInteractions.length > 0 && (
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>High-Risk Drug Interactions</Text>
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
      {acknowledgedHighRiskInteractions.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Acknowledged Interactions</Text>
          <Text style={styles.infoSubtitle}>
            You have acknowledged these high-risk interactions. Please follow your doctor's advice.
          </Text>
          
          {acknowledgedHighRiskInteractions.map((interaction, index) => (
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
      </ScrollView>

      {/* Bottom Action Menu */}
      <View style={styles.bottomMenu}>
        <View style={styles.bottomMenuBar}>
          <TouchableOpacity
            style={styles.bottomMenuItem}
            onPress={handleReschedule}
            disabled={isRemoving || isRescheduling}
          >
            <Clock size={24} color={Colors.primary.main} />
            <Text style={styles.bottomMenuLabel}>{t('medicine_detail.reschedule')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomMenuItem}
            onPress={handleRemoveMedication}
            disabled={isRemoving || isRescheduling}
          >
            <Trash2 size={24} color={Colors.status.error} />
            <Text style={[styles.bottomMenuLabel, { color: Colors.status.error }]}>
              {t('common.remove')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('medicine_detail.reschedule_title')}</Text>
            <Text style={styles.modalSubtitle}>{t('medicine_detail.reschedule_subtitle')}</Text>

            {/* Reschedule Options */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                rescheduleOption === 'today' && styles.optionCardSelected
              ]}
              onPress={() => handleRescheduleOptionSelect('today')}
            >
              <Text style={styles.optionTitle}>{t('medicine_detail.reschedule_today_only')}</Text>
              <Text style={styles.optionDesc}>{t('medicine_detail.reschedule_today_only_desc')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                rescheduleOption === 'all' && styles.optionCardSelected
              ]}
              onPress={() => handleRescheduleOptionSelect('all')}
            >
              <Text style={styles.optionTitle}>{t('medicine_detail.reschedule_all_future')}</Text>
              <Text style={styles.optionDesc}>{t('medicine_detail.reschedule_all_future_desc')}</Text>
            </TouchableOpacity>

            {rescheduleOption && (
              <>
                <Text style={styles.timesTitle}>{t('medicine_detail.select_new_times')}</Text>
                
                <TimePickerPill
                  times={newTimes}
                  onEditTime={(time) => {
                    const index = newTimes.indexOf(time);
                    handleEditTime(index);
                  }}
                  onRemoveTime={(time) => {
                    const index = newTimes.indexOf(time);
                    handleRemoveTime(index);
                  }}
                  onAddTime={handleAddTime}
                />
              </>
            )}

            {/* Time Picker Modal */}
            <DatePicker
              modal
              open={showTimePicker}
              date={newTimes[currentTimeIndex] ? getDateFromTime(newTimes[currentTimeIndex]) : new Date()}
              mode="time"
              onConfirm={handleTimeChange}
              onCancel={() => setShowTimePicker(false)}
            />

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRescheduleModal(false);
                  setRescheduleOption(null);
                }}
                disabled={isRescheduling}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, isRescheduling && styles.modalButtonDisabled]}
                onPress={handleConfirmReschedule}
                disabled={isRescheduling || !rescheduleOption}
              >
                {isRescheduling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
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
  bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: Spacing.md + 4,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  bottomMenuBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 100,
    height: 70,
    ...Shadows.lg,
  },
  bottomMenuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  bottomMenuLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.primary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  optionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },
  optionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  timesTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.text.tertiary,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary.main,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextCancel: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalButtonTextConfirm: {
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