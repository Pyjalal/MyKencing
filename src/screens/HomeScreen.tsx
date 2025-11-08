import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DoseStatus, VitalType } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors } from '../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const { todayDoses, loadMedications, loadTodayDoses, markDose, isLoading: isLoadingMeds } = useMedicationStore();
  const { vitals, loadVitals, isLoading: isLoadingVitals } = useVitalsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMedications();
    loadTodayDoses();
    loadVitals();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMedications(), loadTodayDoses(), loadVitals()]);
    setRefreshing(false);
  }, [loadMedications, loadTodayDoses, loadVitals]);

  const nextDose = useMemo(() => {
    const pending = todayDoses.find(
      (d) => d.status === DoseStatus.Pending || d.status === DoseStatus.Late
    );
    if (pending) return pending;

    const upcoming = todayDoses.find((d) => d.status === DoseStatus.Upcoming);
    return upcoming;
  }, [todayDoses]);

  const handleTakeDose = async () => {
    if (nextDose) {
      try {
        await markDose(nextDose.id, DoseStatus.Taken);
        await loadTodayDoses();
      } catch (error) {
        console.error('HomeScreen: Error marking dose:', error);
      }
    }
  };

  const handleSkipDose = async () => {
    if (nextDose) {
      try {
        await markDose(nextDose.id, DoseStatus.Skipped);
        await loadTodayDoses();
      } catch (error) {
        console.error('HomeScreen: Error skipping dose:', error);
      }
    }
  };

  const timeUntilDose = useMemo(() => {
    if (!nextDose) return null;
    return formatDistanceToNow(new Date(nextDose.scheduledTime), { addSuffix: false });
  }, [nextDose]);

  const todayVitalsCount = useMemo(() => {
    const today = new Date().toDateString();
    return vitals.filter(v => new Date(v.measuredAt).toDateString() === today).length;
  }, [vitals]);

  const handleVitalsCardPress = () => {
    navigation.navigate('Vitals');
  };

  const handleDoseDetailsPress = () => {
    if (nextDose) {
      navigation.navigate('MedicineDetail', { medicationId: nextDose.medicationId });
    }
  };

  const isLoading = isLoadingMeds || isLoadingVitals;

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.main}
          />
        }
      >
        <TouchableOpacity className="w-10 h-10 items-center justify-center mb-4" onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text className="text-2xl text-black">←</Text>
        </TouchableOpacity>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl mb-4" />
        ) : (
          <Card className="mb-4 bg-white rounded-2xl shadow-md" onPress={handleVitalsCardPress}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-red-500">{t('home.todays_vitals')}</CardTitle>
            </CardHeader>
            <CardContent>
              {todayVitalsCount > 0 ? (
                <View className="items-center justify-center min-h-48">
                  <Text className="text-lg text-gray-500">{t('home.recorded_today', { count: todayVitalsCount })}</Text>
                  <Text className="text-sm text-gray-400 italic mt-2">{t('home.tap_to_view_details')}</Text>
                </View>
              ) : (
                <View className="items-center justify-center min-h-48">
                  <Text className="text-base text-gray-400">{t('home.no_vitals_recorded')}</Text>
                  <Text className="text-sm text-gray-400 italic mt-2">{t('home.tap_to_add_vitals')}</Text>
                </View>
              )}
            </CardContent>
            <CardFooter>
              <View className="w-full">
                <Text className="text-base font-semibold text-black mb-2">{t('home.quick_add')}</Text>
                <View className="flex-row gap-2">
                  <Button className="flex-1 bg-red-500 rounded-lg" onPress={() => navigation.navigate('AddVital', { type: VitalType.BloodPressure })}>
                    <Text className="text-white font-semibold">{t('home.bp')}</Text>
                  </Button>
                  <Button className="flex-1 bg-red-500 rounded-lg" onPress={() => navigation.navigate('AddVital', { type: VitalType.Glucose })}>
                    <Text className="text-white font-semibold">{t('home.glucose')}</Text>
                  </Button>
                  <Button className="flex-1 bg-red-500 rounded-lg" onPress={() => navigation.navigate('AddVital', { type: VitalType.Weight })}>
                    <Text className="text-white font-semibold">{t('home.weight')}</Text>
                  </Button>
                </View>
              </View>
            </CardFooter>
          </Card>
        )}

        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : nextDose ? (
          <Card className="bg-white rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-yellow-500">{t('home.next_dose')}</CardTitle>
            </CardHeader>
            <CardContent className="items-center">
              <Button variant="link" onPress={handleDoseDetailsPress}>
                <Text className="text-xl font-bold text-yellow-600">{nextDose.medication.mims.brandName || nextDose.medication.mims.genericName}</Text>
              </Button>
              <Text className="text-base text-black text-center mb-4">{t('home.in')} {timeUntilDose}</Text>
            </CardContent>
            <CardFooter className="flex-row gap-4 justify-center">
              <Button className="bg-yellow-500 min-w-[100px] rounded-lg" onPress={handleTakeDose}>
                <Text className="text-white font-semibold">{t('home.take')}</Text>
              </Button>
              <Button variant="outline" className="min-w-[100px] rounded-lg" onPress={handleSkipDose}>
                <Text className="text-black font-semibold">{t('home.skip')}</Text>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="bg-white rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-yellow-500">{t('home.next_dose')}</CardTitle>
            </CardHeader>
            <CardContent className="items-center p-10">
              <Text className="text-lg text-gray-400">{t('home.no_upcoming_doses')}</Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}