/**
 * MedicationManagementScreen (Meds 2)
 * Complete medication management screen with carousel and interaction warnings
 * Based on Figma analysis from context/medication_screen_analysis.json
 *
 * Features:
 * - Horizontal swipeable medication carousel
 * - Drug-drug interaction alerts
 * - Food-drug interaction warnings
 * - Bottom navigation with active state
 * - Responsive design for 440px mobile viewport
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import MedicationCarousel from '../components/MedicationCarousel';
import DrugDrugInteractionAlert, {
  DrugInteraction,
} from '../components/DrugDrugInteractionAlert';
import FoodDrugInteractionAlert, {
  FoodInteraction,
} from '../components/FoodDrugInteractionAlert';
import { Home, Activity, Plus, Pill, User } from 'lucide-react-native';
import { cn } from '../lib/utils';

type MedicationManagementScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicationManagement'>;
};

// Sample medication data based on Figma design
const SAMPLE_MEDICATIONS = [
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
    notes: ['Take with evening meal'],
  },
  {
    id: 'med_003',
    name: 'Metformin',
    dosage: '500mg',
    indication: 'For type 2 diabetes',
    schedule: '2 tablets twice daily with meals',
    daysLeft: 7,
    totalDays: 30,
    notes: ['Take with food to reduce stomach upset'],
  },
];

// Sample drug-drug interaction
const SAMPLE_DRUG_INTERACTION: DrugInteraction = {
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

// Sample food-drug interaction
const SAMPLE_FOOD_INTERACTION: FoodInteraction = {
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

export default function MedicationManagementScreen({
  navigation,
}: MedicationManagementScreenProps) {
  const [activeTab, setActiveTab] = useState('meds');
  const [medications] = useState(SAMPLE_MEDICATIONS);
  const [drugInteraction] = useState(SAMPLE_DRUG_INTERACTION);
  const [foodInteraction] = useState(SAMPLE_FOOD_INTERACTION);

  const handleDrugPress = (drugId: string) => {
    console.log('Drug pressed:', drugId);
    // Navigate to medication detail screen
    // navigation.navigate('MedicineDetail', { medicationId: drugId });
  };

  const handleNavigationPress = (tab: string) => {
    setActiveTab(tab);

    // Navigate based on tab
    switch (tab) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'vitals':
        navigation.navigate('Vitals');
        break;
      case 'add':
        navigation.navigate('AddMedicine');
        break;
      case 'meds':
        // Already on this screen
        break;
      case 'profile':
        navigation.navigate('Settings');
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#EFF1FE" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Active Medications Section */}
        <View className="px-10 pt-10">
          <Text className="text-2xl font-semibold text-text-primary mb-6">
            Active Medications
          </Text>
        </View>

        {/* Medication Carousel */}
        <MedicationCarousel
          medications={medications}
          onCardPress={(medication) => {
            console.log('Medication card pressed:', medication.id);
            // navigation.navigate('MedicineDetail', { medicationId: medication.id });
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
            onDrugPress={handleDrugPress}
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
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        className="absolute bottom-8 left-8 right-8 bg-white rounded-[50px] shadow-lg"
        style={{
          height: 75,
          shadowColor: '#8FA2B9',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <View className="flex-1 flex-row items-center justify-around px-5">
          {/* Home */}
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => handleNavigationPress('home')}
            accessibilityRole="button"
            accessibilityLabel="Home"
            accessibilityState={{ selected: activeTab === 'home' }}
          >
            <Home
              size={20}
              color={activeTab === 'home' ? '#F0C400' : '#2C3442'}
              strokeWidth={2}
            />
            <Text
              className={cn(
                'text-[15px] font-medium mt-1',
                activeTab === 'home' ? 'text-warning' : 'text-text-primary'
              )}
            >
              Home
            </Text>
          </TouchableOpacity>

          {/* Vitals */}
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => handleNavigationPress('vitals')}
            accessibilityRole="button"
            accessibilityLabel="Vitals"
            accessibilityState={{ selected: activeTab === 'vitals' }}
          >
            <Activity
              size={20}
              color={activeTab === 'vitals' ? '#F0C400' : '#2C3442'}
              strokeWidth={2}
            />
            <Text
              className={cn(
                'text-[15px] font-medium mt-1',
                activeTab === 'vitals' ? 'text-warning' : 'text-text-primary'
              )}
            >
              Vitals
            </Text>
          </TouchableOpacity>

          {/* Add Button (Center) */}
          <TouchableOpacity
            className="w-11 h-11 bg-warning rounded-full items-center justify-center"
            onPress={() => handleNavigationPress('add')}
            accessibilityRole="button"
            accessibilityLabel="Add medication"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>

          {/* Meds (Active) */}
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => handleNavigationPress('meds')}
            accessibilityRole="button"
            accessibilityLabel="Medications"
            accessibilityState={{ selected: activeTab === 'meds' }}
            accessibilityCurrent={activeTab === 'meds' ? 'page' : undefined}
          >
            <Pill
              size={20}
              color={activeTab === 'meds' ? '#F0C400' : '#2C3442'}
              strokeWidth={2}
              fill={activeTab === 'meds' ? '#F0C400' : 'none'}
            />
            <Text
              className={cn(
                'text-[15px] font-medium mt-1',
                activeTab === 'meds' ? 'text-warning' : 'text-text-primary'
              )}
            >
              Meds
            </Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => handleNavigationPress('profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            accessibilityState={{ selected: activeTab === 'profile' }}
          >
            <User
              size={20}
              color={activeTab === 'profile' ? '#F0C400' : '#2C3442'}
              strokeWidth={2}
            />
            <Text
              className={cn(
                'text-[15px] font-medium mt-1',
                activeTab === 'profile' ? 'text-warning' : 'text-text-primary'
              )}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
