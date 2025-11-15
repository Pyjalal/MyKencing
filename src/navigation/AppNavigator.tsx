import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../types';
import { CustomTabBar } from '../components/BottomNavBar';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors } from '../constants/theme';
import { updateI18nLanguage } from '../services/i18n';
import { User, BotMessageSquare, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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
import RiskOnboardingScreen from '../screens/RiskOnboardingScreen';
import RiskCalculatorScreen from '../screens/RiskCalculatorScreen';
import HealthProfileScreen from '../screens/HealthProfileScreen';
import DailyVitalsLogScreen from '../screens/DailyVitalsLogScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Dummy screen that navigates to the ChatBot screen.
 * Used as a placeholder for the custom chat action tab button.
 */
function ChatBotTabPlaceholder() {
  const navigation = useNavigation<any>();
  
  React.useEffect(() => {
    // Navigate to the stack screen immediately
    navigation.navigate('ChatBot');
  }, [navigation]);
  
  return null;
}

/**
 * Main tab navigator (bottom tabs)
 */
function MainTabs() {
  const { t } = useTranslation();
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
          tabBarLabel: t('navigation.home'),
        }}
        listeners={({ navigation }) => ({
          focus: () => {
            const parent = navigation.getParent();
            if (parent) {
              parent.setOptions({
                title: '',
                headerStyle: {
                  backgroundColor: Colors.primary.dark,
                },
                headerShadowVisible: false,
                headerTintColor: Colors.primary.contrast,
                headerTitleStyle: {
                  color: Colors.primary.contrast,
                },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.getParent()?.navigate('Settings')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                    style={{
                      padding: 6,
                      borderRadius: 999,
                    }}
                  >
                    <User size={24} color={Colors.primary.contrast} />
                  </TouchableOpacity>
                ),
                headerLeftContainerStyle: {
                  paddingRight: 16,
                },
                headerRight: undefined,
                headerRightContainerStyle: {
                  paddingRight: 16,
                },
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="VitalsTab"
        component={VitalsScreen}
        options={{
          tabBarLabel: t('navigation.vitals'),
        }}
        listeners={({ navigation }) => ({
          focus: () => {
            const parent = navigation.getParent();
            if (parent) {
              parent.setOptions({
                title: t('navigation.vitals_tracker'),
                headerStyle: {
                  backgroundColor: Colors.background.vitals,
                },
                headerShadowVisible: false,
                headerTintColor: Colors.primary.contrast,
                headerTitleStyle: {
                  color: Colors.primary.contrast,
                },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.getParent()?.navigate('Settings')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                    style={{
                      padding: 6,
                      borderRadius: 999,
                    }}
                  >
                    <User size={24} color={Colors.primary.contrast} />
                  </TouchableOpacity>
                ),
                headerLeftContainerStyle: {
                  paddingRight: 16,
                },
                headerRight: undefined,
                headerRightContainerStyle: {
                  paddingRight: 16,
                },
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="MedicationsTab"
        component={MedicationsScreen}
        options={{
          tabBarLabel: t('navigation.meds'),
        }}
        listeners={({ navigation }) => ({
          focus: () => {
            const parent = navigation.getParent();
            if (parent) {
              parent.setOptions({
                title: t('navigation.medications'),
                headerStyle: {
                  backgroundColor: Colors.background.meds,
                },
                headerShadowVisible: false,
                headerTintColor: Colors.text.primary,
                headerTitleStyle: {
                  color: Colors.text.primary,
                },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.getParent()?.navigate('Settings')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                    style={{
                      padding: 6,
                      borderRadius: 999,
                    }}
                  >
                    <User size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                ),
                headerLeftContainerStyle: {
                  paddingRight: 16,
                },
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => navigation.getParent()?.navigate('ScanPrescription')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                    style={{
                      padding: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Plus size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                ),
                headerRightContainerStyle: {
                  paddingRight: 16,
                },
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="ChatBotTab"
        component={ChatBotTabPlaceholder}
        options={{
          tabBarLabel: '',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ChatBot'); 
          },
        })}
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
  const { t } = useTranslation();

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
          headerShadowVisible: false,
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
          options={{
            headerShown: true,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="AddMedicine"
          component={AddMedicineScreen}
          options={{ title: t('navigation.add_medicine') }}
        />
        <Stack.Screen
          name="MedicineDetail"
          component={MedicineDetailScreen}
          options={{ title: t('navigation.medicine_details') }}
        />
        <Stack.Screen
          name="ScanPrescription"
          component={ScanPrescriptionScreen}
          options={{ 
            title: t('navigation.scan_medication'),
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="SelectScannedMedicine"
          component={SelectScannedMedicineScreen}
          options={{ title: t('navigation.select_medicine') }}
        />
        <Stack.Screen
          name="Export"
          component={ExportReportScreen}
          options={{ title: t('navigation.export_report') }}
        />
        <Stack.Screen
          name="Analytics"
          component={AnalyticsDashboardScreen}
          options={{ title: t('navigation.analytics') }}
        />
        <Stack.Screen
          name="RamadanMode"
          component={RamadanModeScreen}
          options={{ title: t('navigation.ramadan_mode') }}
        />
        <Stack.Screen
          name="AddVital"
          component={AddVitalScreen}
          options={{ title: t('navigation.add_vital') }}
        />
        <Stack.Screen
          name="ChatBot"
          component={ChatBotScreen}
          options={{
            title: 'Dhia',
            headerStyle: { backgroundColor: Colors.primary.dark },
            headerShadowVisible: false,
            headerTintColor: Colors.primary.contrast,
            headerTitleStyle: { color: Colors.primary.contrast },
          }}
        />
        <Stack.Screen
          name="MedicationManagement"
          component={MedicationManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MedicationInteractions"
          component={MedicationInteractionsScreen}
          options={{ title: t('navigation.medication_interactions') }}
        />
        <Stack.Screen
          name="RiskCalculators"
          component={RiskCalculatorScreen}
          options={{ title: t('navigation.risk_calculators') }}
        />
        <Stack.Screen
          name="RiskAssessment"
          component={RiskAssessmentScreen}
          options={{ title: t('navigation.risk_assessment') }}
        />
        <Stack.Screen
          name="RiskOnboarding"
          component={RiskOnboardingScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('navigation.profile_settings') }}
        />
        <Stack.Screen
          name="HealthProfile"
          component={HealthProfileScreen}
          options={{
            headerStyle: {
              backgroundColor: Colors.background.vitals,
            },
            headerShadowVisible: false,
            headerTintColor: Colors.primary.contrast,
            headerBackVisible: true,
            headerTitleStyle: {
              color: Colors.primary.contrast,
            },
          }}
        />
        <Stack.Screen
          name="DailyVitalsLog"
          component={DailyVitalsLogScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
