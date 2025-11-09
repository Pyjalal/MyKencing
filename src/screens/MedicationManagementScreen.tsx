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
  StyleSheet,
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
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

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
        navigation.navigate('Home', { screen: 'HomeTab' });
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFF1FE" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Active Medications Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
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
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>
            Drug-Drug Interaction
          </Text>

          <DrugDrugInteractionAlert
            interaction={drugInteraction}
            onDrugPress={handleDrugPress}
            containerStyle={styles.interactionCardSpacing}
          />
        </View>

        {/* Food-Drug Interaction Section */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>
            Food-Drug Interaction
          </Text>

          <FoodDrugInteractionAlert
            interaction={foodInteraction}
            containerStyle={styles.interactionCardSpacingSmall}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomNavInner}>
          {/* Home */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigationPress('home')}
            accessibilityRole="button"
            accessibilityLabel="Home"
            accessibilityState={{ selected: activeTab === 'home' }}
          >
            <Home
              size={20}
              color={activeTab === 'home' ? Colors.accent.main : '#2C3442'}
              strokeWidth={2}
            />
            <Text
              style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}
            >
              Home
            </Text>
          </TouchableOpacity>

          {/* Vitals */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigationPress('vitals')}
            accessibilityRole="button"
            accessibilityLabel="Vitals"
            accessibilityState={{ selected: activeTab === 'vitals' }}
          >
            <Activity
              size={20}
              color={activeTab === 'vitals' ? Colors.accent.main : '#2C3442'}
              strokeWidth={2}
            />
            <Text
              style={[styles.navLabel, activeTab === 'vitals' && styles.navLabelActive]}
            >
              Vitals
            </Text>
          </TouchableOpacity>

          {/* Add Button (Center) */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleNavigationPress('add')}
            accessibilityRole="button"
            accessibilityLabel="Add medication"
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>

          {/* Meds (Active) */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigationPress('meds')}
            accessibilityRole="button"
            accessibilityLabel="Medications"
            accessibilityState={{ selected: activeTab === 'meds' }}
          >
            <Pill
              size={20}
              color={activeTab === 'meds' ? Colors.accent.main : '#2C3442'}
              strokeWidth={2}
              fill={activeTab === 'meds' ? Colors.accent.main : 'none'}
            />
            <Text
              style={[styles.navLabel, activeTab === 'meds' && styles.navLabelActive]}
            >
              Meds
            </Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handleNavigationPress('profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            accessibilityState={{ selected: activeTab === 'profile' }}
          >
            <User
              size={20}
              color={activeTab === 'profile' ? Colors.accent.main : '#2C3442'}
              strokeWidth={2}
            />
            <Text
              style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFF1FE',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingHorizontal: 40,
    paddingTop: 40,
    marginBottom: 24,
  },
  sectionWrapper: {
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  interactionCardSpacing: {
    marginBottom: Spacing['2xl'],
  },
  interactionCardSpacingSmall: {
    marginBottom: Spacing.xl,
  },
  bottomNav: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 32,
    height: 75,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    shadowColor: '#8FA2B9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomNavInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  navLabelActive: {
    color: Colors.accent.main,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accent.main,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
