import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from '../types';
import { CustomTabBar } from '../components/BottomNavBar';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors } from '../constants/theme';
import { updateI18nLanguage } from '../services/i18n';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import PrivacyConsentScreen from '../screens/PrivacyConsentScreen';
import HomeScreen from '../screens/HomeScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import VitalsScreen from '../screens/VitalsScreen';
import AddVitalScreen from '../screens/AddVitalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScanPrescriptionScreen from '../screens/ScanPrescriptionScreen';
import SelectScannedMedicineScreen from '../screens/SelectScannedMedicineScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import ExportReportScreen from '../screens/ExportReportScreen';
import RamadanModeScreen from '../screens/RamadanModeScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import ChatBotScreen from '../screens/ChatBotScreen';
import MedicationManagementScreen from '../screens/MedicationManagementScreen';
import MedicationInteractionsScreen from '../screens/MedicationInteractionsScreen';
import RiskAssessmentScreen from '../screens/RiskAssessmentScreen';
import RiskCalculatorScreen from '../screens/RiskCalculatorScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Dummy screen that navigates to ScanPrescription
 * Used as a placeholder for the center tab button
 */
function ScanPrescriptionTabPlaceholder() {
  const navigation = useNavigation<any>();
  
  React.useEffect(() => {
    // Navigate to the stack screen immediately
    navigation.navigate('ScanPrescription');
  }, [navigation]);
  
  return null;
}

/**
 * Main tab navigator (bottom tabs)
 */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="VitalsTab"
        component={VitalsScreen}
        options={{
          tabBarLabel: 'Vitals',
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanPrescriptionTabPlaceholder}
        options={{
          tabBarLabel: '',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default tab navigation
            e.preventDefault();
            // Navigate to the stack screen instead
            navigation.navigate('ScanPrescription');
          },
        })}
      />
      <Tab.Screen
        name="MedicationsTab"
        component={MedicationsScreen}
        options={{
          tabBarLabel: 'Meds',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root stack navigator
 */
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const settings = useSettingsStore((state) => state.settings);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    async function init() {
      await loadSettings();
      // Update i18n language after settings are loaded
      await updateI18nLanguage();
      setIsLoading(false);
    }
    init();
  }, [loadSettings]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary }}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  const hasCompletedOnboarding = settings.onboardingCompleted;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasCompletedOnboarding ? 'Home' : 'Onboarding'}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.primary.main,
          },
          headerTintColor: Colors.primary.contrast,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacyConsent"
          component={PrivacyConsentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddMedicine"
          component={AddMedicineScreen}
          options={{ title: 'Add Medicine' }}
        />
        <Stack.Screen
          name="MedicineDetail"
          component={MedicineDetailScreen}
          options={{ title: 'Medicine Details' }}
        />
        <Stack.Screen
          name="ScanPrescription"
          component={ScanPrescriptionScreen}
          options={{ 
            title: 'Scan Prescription',
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="SelectScannedMedicine"
          component={SelectScannedMedicineScreen}
          options={{ title: 'Select Medicine' }}
        />
        <Stack.Screen
          name="Export"
          component={ExportReportScreen}
          options={{ title: 'Export Report' }}
        />
        <Stack.Screen
          name="Analytics"
          component={AnalyticsDashboardScreen}
          options={{ title: 'Analytics' }}
        />
        <Stack.Screen
          name="RamadanMode"
          component={RamadanModeScreen}
          options={{ title: 'Ramadan Mode' }}
        />
        <Stack.Screen
          name="AddVital"
          component={AddVitalScreen}
          options={{ title: 'Add Vital' }}
        />
        <Stack.Screen
          name="ChatBot"
          component={ChatBotScreen}
          options={{ title: 'Chatbot' }}
        />
        <Stack.Screen
          name="MedicationManagement"
          component={MedicationManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MedicationInteractions"
          component={MedicationInteractionsScreen}
          options={{ title: 'Medication Interactions' }}
        />
        <Stack.Screen
          name="RiskCalculators"
          component={RiskCalculatorScreen}
          options={{ title: 'Risk Calculators' }}
        />
        <Stack.Screen
          name="RiskAssessment"
          component={RiskAssessmentScreen}
          options={{ title: 'Risk Assessment' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
