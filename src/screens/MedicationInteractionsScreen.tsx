import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MedicationWithDetails } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useInteractionStore } from '../stores/interactionStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { format, parseISO, differenceInDays } from 'date-fns';

type MedicationInteractionsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicationInteractions'>;
};

interface DrugInteraction {
  drug1: string;
  drug2: string;
  risk: string;
  severity: 'low' | 'moderate' | 'high';
}

interface FoodInteraction {
  medication: string;
  food: string;
  recommendation: string;
  severity: 'low' | 'moderate' | 'high';
}

export default function MedicationInteractionsScreen({ navigation }: MedicationInteractionsScreenProps) {
  const { medications, loadMedications } = useMedicationStore();
  const { getInteractions } = useInteractionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);
  const [foodInteractions, setFoodInteractions] = useState<FoodInteraction[]>([]);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  useEffect(() => {
    loadMedications();
  }, []);

  // Check for interactions when medications load or change
  useEffect(() => {
    async function checkInteractions() {
      const activeMeds = medications.filter(m => m.isActive);

      // Need at least 1 medication to check interactions
      if (activeMeds.length === 0) {
        setDrugInteractions([]);
        setFoodInteractions([]);
        return;
      }

      setIsCheckingInteractions(true);
      setInteractionError(null);

      try {
        // Get registration numbers for API call
        const medIds = activeMeds
          .map(m => m.registrationNo)
          .filter(Boolean) as string[];

        if (medIds.length === 0) {
          console.warn('No valid registration numbers found for interaction checking');
          setDrugInteractions([]);
          setFoodInteractions([]);
          setIsCheckingInteractions(false);
          return;
        }

        console.log('Checking interactions for medications:', medIds);

        // Use interaction store which handles caching
        const result = await getInteractions(medIds);

        console.log('Interaction check result:', result);

        if (result.hasInteractions && result.interactions.length > 0) {
          // Process the interaction objects
          const drugDrugInteractions: DrugInteraction[] = [];
          const foodDrugInteractions: FoodInteraction[] = [];

          result.interactions.forEach((interaction) => {
            const drug1 = interaction.firstReactant;
            const drug2 = interaction.secondReactant;
            const severity = interaction.severityRating?.rating || interaction.severity || 'moderate';
            const explanation = interaction.explanation || 'Potential interaction detected';

            // Check if it's a food interaction by looking for food keywords
            const foodKeywords = ['food', 'alcohol', 'grapefruit', 'milk', 'dairy', 'tyramine', 'caffeine'];
            const isFoodInteraction = foodKeywords.some(keyword =>
              drug2.toLowerCase().includes(keyword) || drug1.toLowerCase().includes(keyword)
            );

            if (isFoodInteraction) {
              // This is a food-drug interaction
              const medication = foodKeywords.some(k => drug2.toLowerCase().includes(k)) ? drug1 : drug2;
              const food = foodKeywords.some(k => drug2.toLowerCase().includes(k)) ? drug2 : drug1;

              foodDrugInteractions.push({
                medication,
                food,
                recommendation: explanation,
                severity: severity.toLowerCase().includes('severe') || severity.toLowerCase().includes('high') 
                  ? 'high' 
                  : severity.toLowerCase().includes('moderate') 
                    ? 'moderate' 
                    : 'low',
              });
            } else {
              // This is a drug-drug interaction
              drugDrugInteractions.push({
                drug1,
                drug2,
                risk: explanation,
                severity: severity.toLowerCase().includes('severe') || severity.toLowerCase().includes('high') 
                  ? 'high' 
                  : severity.toLowerCase().includes('moderate') 
                    ? 'moderate' 
                    : 'low',
              });
            }
          });

          setDrugInteractions(drugDrugInteractions);
          setFoodInteractions(foodDrugInteractions);
        } else {
          setDrugInteractions([]);
          setFoodInteractions([]);
        }
      } catch (error) {
        console.error('Failed to check interactions:', error);
        setInteractionError('Unable to check interactions. Please try again later.');
        setDrugInteractions([]);
        setFoodInteractions([]);
      } finally {
        setIsCheckingInteractions(false);
      }
    }

    checkInteractions();
  }, [medications]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  }, [loadMedications]);

  const calculateDaysLeft = (medication: MedicationWithDetails): number | null => {
    if (!medication.endDate) return null;
    
    try {
      const endDate = parseISO(medication.endDate);
      const today = new Date();
      return differenceInDays(endDate, today);
    } catch {
      return null;
    }
  };

  const renderActiveMedication = (medication: MedicationWithDetails) => {
    const daysLeft = calculateDaysLeft(medication);
    const medName = medication.mims.brandName || medication.mims.genericName;
    const indication = medication.mims.instructions || 
      (medName.toLowerCase().includes('amlodipine') ? 'For high blood pressure' : 'As prescribed');
    
    // Calculate progress (assuming 30-day supply)
    const totalDays = 30;
    const progress = daysLeft !== null ? Math.max(0, Math.min(1, daysLeft / totalDays)) : 0;
    
    // Get first scheduled time
    const firstTime = medication.times.length > 0 ? medication.times[0] : '08:00';
    const formattedTime = format(parseISO(`2000-01-01T${firstTime}`), 'h:mm a');
    
    return (
      <View key={medication.id} style={styles.activeMedCard}>
        <Text style={styles.activeMedName}>{medName}</Text>
        <Text style={styles.activeMedIndication}>{indication}</Text>
        <Text style={styles.activeMedDose}>
          {medication.frequency} tablet{medication.frequency > 1 ? 's' : ''} daily at {formattedTime}
        </Text>
        
        {daysLeft !== null && (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.daysLeft}>{daysLeft} days left</Text>
          </>
        )}
        
        {medication.notes && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>Note: {medication.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.main}
          />
        }
      >
        {/* Active Medications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Medications</Text>
          
          {medications.filter(m => m.isActive).length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {medications.filter(m => m.isActive).map(renderActiveMedication)}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active medications</Text>
            </View>
          )}
        </View>

        {/* Drug-Drug Interactions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drug-Drug Interaction</Text>

          {isCheckingInteractions ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color={Colors.accent.main} />
              <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>
                Checking for interactions...
              </Text>
            </View>
          ) : interactionError ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: Colors.status.error }]}>
                {interactionError}
              </Text>
            </View>
          ) : drugInteractions.length > 0 ? (
            <View style={styles.interactionCard}>
              <Text style={styles.interactionWarning}>Possible interactions detected</Text>

              {drugInteractions.map((interaction, index) => (
                <View key={index} style={styles.interactionDetails}>
                  <View style={styles.drugBadgesContainer}>
                    <View style={[styles.drugBadge, { backgroundColor: Colors.secondary.main }]}>
                      <Text style={styles.drugBadgeText}>{interaction.drug1}</Text>
                    </View>
                    <Text style={styles.plusSign}>+</Text>
                    <View style={[styles.drugBadge, { backgroundColor: Colors.secondary.main }]}>
                      <Text style={styles.drugBadgeText}>{interaction.drug2}</Text>
                    </View>
                  </View>
                  <Text style={styles.riskText}>Risk:</Text>
                  <Text style={styles.riskDescription}>{interaction.risk}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No drug interactions detected</Text>
            </View>
          )}
        </View>

        {/* Food-Drug Interactions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food-Drug Interaction</Text>

          {isCheckingInteractions ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color={Colors.accent.main} />
              <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>
                Checking for interactions...
              </Text>
            </View>
          ) : interactionError ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: Colors.status.error }]}>
                {interactionError}
              </Text>
            </View>
          ) : foodInteractions.length > 0 ? (
            <>
              {foodInteractions.map((interaction, index) => (
                <View key={index} style={styles.foodInteractionCard}>
                  <Text style={styles.foodWarning}>
                    {interaction.food} may interact with {interaction.medication}
                  </Text>
                  <Text style={styles.recommendationLabel}>Recommendation:</Text>
                  <Text style={styles.recommendationText}>{interaction.recommendation}</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No food interactions detected</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5D7E3', // Light purple/lavender background
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  activeMedCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    width: 280,
    ...Shadows.sm,
  },
  activeMedName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent.main,
    marginBottom: Spacing.xs,
  },
  activeMedIndication: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  activeMedDose: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.main,
    borderRadius: 4,
  },
  daysLeft: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  noteContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  noteText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  interactionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  interactionWarning: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondary.main,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  interactionDetails: {
    alignItems: 'center',
  },
  drugBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  drugBadge: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 20,
    ...Shadows.sm,
  },
  drugBadgeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.inverse,
  },
  plusSign: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginHorizontal: Spacing.md,
  },
  riskText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  riskDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  foodInteractionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  foodWarning: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent.main,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  recommendationLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  recommendationText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
