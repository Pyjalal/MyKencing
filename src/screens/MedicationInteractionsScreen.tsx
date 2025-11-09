import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MedicationWithDetails } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors } from '../constants/theme';
import { format, parseISO, differenceInDays } from 'date-fns';
import { checkDrugInteractions as checkDrugInteractionsAPI } from '../services/mymedix-api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';

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

// Helper function to summarize long risk descriptions
const summarizeRisk = (riskText: string, maxLength: number = 50): string => {
  if (!riskText) return 'Interaction detected';
  
  // If text is short enough, return as-is
  if (riskText.length <= maxLength) return riskText;
  
  // Try to get first sentence
  const firstSentence = riskText.split(/[.!?]/)[0];
  if (firstSentence.length <= maxLength) {
    return firstSentence.trim();
  }
  
  // Truncate and add ellipsis
  return riskText.substring(0, maxLength).trim() + '...';
};

export default function MedicationInteractionsScreen({ navigation }: MedicationInteractionsScreenProps) {
  const { medications, loadMedications, isLoading } = useMedicationStore();
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
          setDrugInteractions([]);
          setFoodInteractions([]);
          setIsCheckingInteractions(false);
          return;
        }

        // Call the MyMedix API for comprehensive interaction data
        const result = await checkDrugInteractionsAPI(medIds);

        if (result.hasInteractions && result.interactions.length > 0) {
          // Parse the interaction strings and categorize them
          const drugDrugInteractions: DrugInteraction[] = [];
          const foodDrugInteractions: FoodInteraction[] = [];

          result.interactions.forEach((interactionText) => {
            // Parse interaction text format: "Drug1 and Drug2 (severity): explanation"
            const match = interactionText.match(/^(.+?) and (.+?) \((.+?) severity\)(?:: (.+))?$/);

            if (match) {
              const [, drug1, drug2, severity, explanation] = match;

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
                  recommendation: explanation || 'Consult your healthcare provider',
                  severity: (severity.toLowerCase() as 'low' | 'moderate' | 'high') || 'moderate',
                });
              } else {
                // This is a drug-drug interaction
                drugDrugInteractions.push({
                  drug1,
                  drug2,
                  risk: explanation || 'Potential interaction detected',
                  severity: (severity.toLowerCase() as 'low' | 'moderate' | 'high') || 'moderate',
                });
              }
            }
          });

          setDrugInteractions(drugDrugInteractions);
          setFoodInteractions(foodDrugInteractions);
        } else {
          setDrugInteractions([]);
          setFoodInteractions([]);
        }
      } catch (error) {
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
      <Card key={medication.id} className="w-72">
        <CardHeader>
          <CardTitle className="text-blue-600">{medName}</CardTitle>
          <Text className="text-gray-500">{indication}</Text>
        </CardHeader>
        <CardContent>
          <Text className="text-black mb-2">{medication.frequency} tablet{medication.frequency > 1 ? 's' : ''} daily at {formattedTime}</Text>
          
          {daysLeft !== null && (
            <>
              <Progress value={progress * 100} className="h-2 bg-gray-200" />
              <Text className="text-xs text-gray-500 text-center mt-1">{daysLeft} days left</Text>
            </>
          )}
          
          {medication.notes && (
            <View className="bg-yellow-100 p-2 rounded-md mt-2">
              <Text className="text-xs text-gray-800">Note: {medication.notes}</Text>
            </View>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
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
        <View className="mb-8">
          <Text className="text-xl font-bold text-black mx-4 mb-4">Active Medications</Text>
          
          {isLoading ? (
            <View className="px-4">
              <Skeleton className="h-48 w-full rounded-lg" />
            </View>
          ) : medications.filter(m => m.isActive).length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
            >
              {medications.filter(m => m.isActive).map(renderActiveMedication)}
            </ScrollView>
          ) : (
            <Card className="mx-4">
              <CardContent className="p-6 items-center">
                <Text className="text-gray-500">No active medications</Text>
              </CardContent>
            </Card>
          )}
        </View>

        <Separator className="my-4" />

        {/* Drug-Drug Interactions Section */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-black mx-4 mb-4">Drug-Drug Interaction</Text>

          {isCheckingInteractions ? (
            <Card className="mx-4">
              <CardContent className="p-6 items-center">
                <ActivityIndicator size="large" color={Colors.accent.main} />
                <Text className="text-gray-500 mt-4">Checking for interactions...</Text>
              </CardContent>
            </Card>
          ) : interactionError ? (
            <Card className="mx-4 bg-red-100">
              <CardContent className="p-6 items-center">
                <Text className="text-red-600">{interactionError}</Text>
              </CardContent>
            </Card>
          ) : drugInteractions.length > 0 ? (
            <>
              {drugInteractions.map((interaction, index) => (
                <Card key={index} className="mx-4 mb-4">
                  <CardHeader>
                    <CardTitle className="text-red-600 text-center">Possible interactions detected</CardTitle>
                  </CardHeader>
                  <CardContent className="items-center">
                    <View className="flex-row items-center justify-center mb-4">
                      <Badge variant="destructive" className="p-2 max-w-36"><Text className="text-white text-center">{interaction.drug1}</Text></Badge>
                      <Text className="text-xl font-bold mx-4">+</Text>
                      <Badge variant="destructive" className="p-2 max-w-36"><Text className="text-white text-center">{interaction.drug2}</Text></Badge>
                    </View>
                    <Text className="text-base font-semibold text-black mb-1">Risk:</Text>
                    <Text className="text-base text-gray-500 text-center px-2">{summarizeRisk(interaction.risk)}</Text>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card className="mx-4">
              <CardContent className="p-6 items-center">
                <Text className="text-gray-500">No drug interactions detected</Text>
              </CardContent>
            </Card>
          )}
        </View>

        <Separator className="my-4" />

        {/* Food-Drug Interactions Section */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-black mx-4 mb-4">Food-Drug Interaction</Text>

          {isCheckingInteractions ? (
            <Card className="mx-4">
              <CardContent className="p-6 items-center">
                <ActivityIndicator size="large" color={Colors.accent.main} />
                <Text className="text-gray-500 mt-4">Checking for interactions...</Text>
              </CardContent>
            </Card>
          ) : interactionError ? (
            <Card className="mx-4 bg-red-100">
              <CardContent className="p-6 items-center">
                <Text className="text-red-600">{interactionError}</Text>
              </CardContent>
            </Card>
          ) : foodInteractions.length > 0 ? (
            <>
              {foodInteractions.map((interaction, index) => (
                <Card key={index} className="mx-4 mb-4">
                  <CardHeader>
                    <CardTitle className="text-blue-600 text-center">{interaction.food} may interact with {interaction.medication}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Text className="text-base font-semibold text-black mb-1">Recommendation:</Text>
                    <Text className="text-base text-gray-500 text-center">{summarizeRisk(interaction.recommendation, 80)}</Text>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card className="mx-4">
              <CardContent className="p-6 items-center">
                <Text className="text-gray-500">No food interactions detected</Text>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

