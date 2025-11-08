/**
 * USAGE EXAMPLE: Medication Management Screen Components
 *
 * This file demonstrates how to use the medication carousel and interaction
 * components in your React Native application.
 *
 * DO NOT IMPORT THIS FILE - It's for documentation purposes only.
 * Copy the relevant code snippets to your actual screens.
 */

import React from 'react';
import { View } from 'react-native';
import {
  MedicationCarousel,
  DrugDrugInteractionAlert,
  FoodDrugInteractionAlert,
  DrugInteraction,
  FoodInteraction,
} from './src/components';

// =============================================================================
// EXAMPLE 1: Basic Medication Carousel
// =============================================================================

function BasicCarouselExample() {
  const medications = [
    {
      id: 'med_001',
      name: 'Amlodipine',
      dosage: '5mg',
      indication: 'For high blood pressure',
      schedule: '1 tablet daily at 10:00 AM',
      daysLeft: 14,
      totalDays: 30,
      notes: ['Take on an empty stomach'],
    },
    {
      id: 'med_002',
      name: 'Simvastatin',
      dosage: '20mg',
      indication: 'For cholesterol',
      schedule: '1 tablet daily at bedtime',
      daysLeft: 22,
      totalDays: 30,
    },
  ];

  return (
    <View>
      <MedicationCarousel
        medications={medications}
        onCardPress={(medication) => {
          console.log('Medication card pressed:', medication);
        }}
      />
    </View>
  );
}

// =============================================================================
// EXAMPLE 2: Carousel with Navigation Integration
// =============================================================================

function CarouselWithNavigationExample({ navigation }: any) {
  const medications = [
    /* ... medication data ... */
  ];

  return (
    <MedicationCarousel
      medications={medications}
      onCardPress={(medication) => {
        // Navigate to medication detail screen
        navigation.navigate('MedicineDetail', {
          medicationId: medication.id
        });
      }}
      containerStyle={{ marginBottom: 20 }}
    />
  );
}

// =============================================================================
// EXAMPLE 3: Drug-Drug Interaction Alert
// =============================================================================

function DrugInteractionExample({ navigation }: any) {
  const interaction: DrugInteraction = {
    id: 'interaction_001',
    drug1: {
      id: 'med_001',
      name: 'Amlodipine',
    },
    drug2: {
      id: 'med_002',
      name: 'Simvastatin',
    },
    riskDescription: 'May increase muscle pain',
    severity: 'high',
  };

  const handleDrugPress = (drugId: string) => {
    // Navigate to drug detail screen
    navigation.navigate('MedicineDetail', { medicationId: drugId });
  };

  return (
    <View className="px-10">
      <DrugDrugInteractionAlert
        interaction={interaction}
        onDrugPress={handleDrugPress}
      />
    </View>
  );
}

// =============================================================================
// EXAMPLE 4: Food-Drug Interaction Alert
// =============================================================================

function FoodInteractionExample() {
  const interaction: FoodInteraction = {
    id: 'interaction_002',
    drug: {
      id: 'med_001',
      name: 'Amlodipine',
    },
    foodItem: 'Grapefruit juice',
    riskDescription: 'Grapefruit juice may increase Amlodipine levels',
    recommendation: 'Avoid consuming grapefruit while on this medication',
    severity: 'medium',
  };

  return (
    <View className="px-10">
      <FoodDrugInteractionAlert interaction={interaction} />
    </View>
  );
}

// =============================================================================
// EXAMPLE 5: Complete Screen Layout
// =============================================================================

function CompleteScreenExample({ navigation }: any) {
  const medications = [
    {
      id: 'med_001',
      name: 'Amlodipine',
      dosage: '5mg',
      indication: 'For high blood pressure',
      schedule: '1 tablet daily at 10:00 AM',
      daysLeft: 14,
      totalDays: 30,
      notes: ['Take on an empty stomach'],
    },
  ];

  const drugInteraction: DrugInteraction = {
    id: 'interaction_001',
    drug1: { id: 'med_001', name: 'Amlodipine' },
    drug2: { id: 'med_002', name: 'Simvastatin' },
    riskDescription: 'May increase muscle pain',
    severity: 'high',
  };

  const foodInteraction: FoodInteraction = {
    id: 'interaction_002',
    drug: { id: 'med_001', name: 'Amlodipine' },
    foodItem: 'Grapefruit juice',
    riskDescription: 'Grapefruit juice may increase Amlodipine levels',
    recommendation: 'Avoid consuming grapefruit while on this medication',
    severity: 'medium',
  };

  return (
    <View className="flex-1 bg-background">
      {/* Active Medications Section */}
      <View className="px-10 pt-10">
        <Text className="text-2xl font-semibold text-text-primary mb-6">
          Active Medications
        </Text>
      </View>

      <MedicationCarousel
        medications={medications}
        onCardPress={(medication) => {
          navigation.navigate('MedicineDetail', {
            medicationId: medication.id
          });
        }}
        containerStyle={{ marginBottom: 47 }}
      />

      {/* Drug-Drug Interaction Section */}
      <View className="px-10">
        <Text className="text-2xl font-semibold text-text-primary mb-6">
          Drug-Drug Interaction
        </Text>

        <DrugDrugInteractionAlert
          interaction={drugInteraction}
          onDrugPress={(drugId) => {
            navigation.navigate('MedicineDetail', { medicationId: drugId });
          }}
          containerClassName="mb-12"
        />
      </View>

      {/* Food-Drug Interaction Section */}
      <View className="px-10">
        <Text className="text-2xl font-semibold text-text-primary mb-6">
          Food-Drug Interaction
        </Text>

        <FoodDrugInteractionAlert
          interaction={foodInteraction}
          containerClassName="mb-8"
        />
      </View>
    </View>
  );
}

// =============================================================================
// EXAMPLE 6: Integration with Medication Store
// =============================================================================

import { useMedicationStore } from './src/stores/medicationStore';

function StoreIntegrationExample() {
  const { medications } = useMedicationStore();

  // Transform store medications to carousel format
  const carouselMedications = medications.map((med) => ({
    id: med.id,
    name: med.mims.genericName || med.mims.brandName || 'Unknown',
    dosage: med.userDosage,
    indication: med.mims.instructions || 'Medication',
    schedule: `${med.frequency}x daily at ${med.times.join(', ')}`,
    daysLeft: calculateDaysLeft(med),
    totalDays: 30, // Calculate from refill date or start date
    notes: med.notes ? [med.notes] : [],
  }));

  return (
    <MedicationCarousel
      medications={carouselMedications}
      onCardPress={(medication) => {
        console.log('Medication:', medication);
      }}
    />
  );
}

// Helper function to calculate days left
function calculateDaysLeft(medication: any): number {
  // Implement based on your data model
  // Example: Calculate from refill date or pill count
  if (medication.refillDate) {
    const refill = new Date(medication.refillDate);
    const now = new Date();
    const diff = refill.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }
  return 30; // Default
}

// =============================================================================
// EXAMPLE 7: Dynamic Interaction Detection
// =============================================================================

import { useEffect, useState } from 'react';

function DynamicInteractionsExample() {
  const { medications } = useMedicationStore();
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);
  const [foodInteractions, setFoodInteractions] = useState<FoodInteraction[]>([]);

  useEffect(() => {
    // Check for interactions when medications change
    async function checkInteractions() {
      // Implement your interaction checking logic
      // This could call a service that checks against MIMS database
      const drugChecks = await checkDrugDrugInteractions(medications);
      const foodChecks = await checkFoodDrugInteractions(medications);

      setDrugInteractions(drugChecks);
      setFoodInteractions(foodChecks);
    }

    if (medications.length > 0) {
      checkInteractions();
    }
  }, [medications]);

  return (
    <View>
      {/* Show interactions if any exist */}
      {drugInteractions.length > 0 && (
        <View className="px-10 mb-8">
          <Text className="text-2xl font-semibold text-text-primary mb-6">
            Drug-Drug Interactions
          </Text>
          {drugInteractions.map((interaction) => (
            <DrugDrugInteractionAlert
              key={interaction.id}
              interaction={interaction}
              onDrugPress={(drugId) => {
                console.log('View drug:', drugId);
              }}
              containerClassName="mb-4"
            />
          ))}
        </View>
      )}

      {foodInteractions.length > 0 && (
        <View className="px-10 mb-8">
          <Text className="text-2xl font-semibold text-text-primary mb-6">
            Food-Drug Interactions
          </Text>
          {foodInteractions.map((interaction) => (
            <FoodDrugInteractionAlert
              key={interaction.id}
              interaction={interaction}
              containerClassName="mb-4"
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Placeholder functions for interaction checking
async function checkDrugDrugInteractions(medications: any[]): Promise<DrugInteraction[]> {
  // Implement interaction checking logic
  // Example: Compare medications against interaction database
  return [];
}

async function checkFoodDrugInteractions(medications: any[]): Promise<FoodInteraction[]> {
  // Implement food interaction checking logic
  return [];
}

// =============================================================================
// EXAMPLE 8: Responsive Carousel (Different Screen Sizes)
// =============================================================================

import { Dimensions } from 'react-native';

function ResponsiveCarouselExample() {
  const screenWidth = Dimensions.get('window').width;

  // Adjust card size based on screen width
  const cardWidth = screenWidth < 400 ? 260 : 300;

  const medications = [
    /* ... medication data ... */
  ];

  return (
    <MedicationCarousel
      medications={medications}
      onCardPress={(medication) => console.log(medication)}
      containerStyle={{
        marginBottom: 20,
        // Add any responsive styling here
      }}
    />
  );
}

// =============================================================================
// EXAMPLE 9: Error Handling and Loading States
// =============================================================================

function LoadingStateExample() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medications, setMedications] = useState<any[]>([]);

  useEffect(() => {
    async function loadMedications() {
      try {
        setLoading(true);
        const data = await fetchMedications(); // Your API call
        setMedications(data);
        setError(null);
      } catch (err) {
        setError('Failed to load medications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMedications();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-base text-text-secondary">Loading medications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-base text-error">{error}</Text>
      </View>
    );
  }

  if (medications.length === 0) {
    return (
      <View className="items-center justify-center py-12">
        <Text className="text-base text-text-secondary">
          No active medications. Add one to get started!
        </Text>
      </View>
    );
  }

  return (
    <MedicationCarousel
      medications={medications}
      onCardPress={(medication) => console.log(medication)}
    />
  );
}

// Placeholder for API call
async function fetchMedications(): Promise<any[]> {
  // Implement your API call
  return [];
}

export {
  BasicCarouselExample,
  CarouselWithNavigationExample,
  DrugInteractionExample,
  FoodInteractionExample,
  CompleteScreenExample,
  StoreIntegrationExample,
  DynamicInteractionsExample,
  ResponsiveCarouselExample,
  LoadingStateExample,
};
