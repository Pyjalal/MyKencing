import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '../types';

// Placeholder screens (will be created next)
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import VitalsScreen from '../screens/VitalsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScanPrescriptionScreen from '../screens/ScanPrescriptionScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import ExportReportScreen from '../screens/ExportReportScreen';
import RamadanModeScreen from '../screens/RamadanModeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Main tab navigator (bottom tabs)
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D9F9F',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Today',
          // tabBarIcon will be added later with icons
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
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root stack navigator
 */
export default function AppNavigator() {
  // TODO: Check if onboarding has been completed
  const hasCompletedOnboarding = false; // Will be loaded from settings

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasCompletedOnboarding ? 'Home' : 'Onboarding'}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#2D9F9F',
          },
          headerTintColor: '#FFFFFF',
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
          options={{ title: 'Scan Prescription' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
