import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DoseStatus } from '../types';
import { useMedicationStore } from '../stores/medicationStore';
import { Colors } from '../constants/theme';
import { Scan } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

type MedicationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function MedicationsScreen({ navigation }: MedicationsScreenProps) {
  const { t } = useTranslation();
  const { weekDoses, loadMedications, loadWeekDoses, markDose, isLoading } = useMedicationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week days (Sun-Sat)
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  useEffect(() => {
    loadMedications();
    if (weekDays.length > 0) {
      loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1]);
    }
  }, [weekDays]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (weekDays.length > 0) {
      await Promise.all([loadMedications(), loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1])]);
    } else {
      await loadMedications();
    }
    setRefreshing(false);
  }, [loadMedications, loadWeekDoses, weekDays]);

  // Filter doses for selected day
  const selectedDayDoses = useMemo(() => {
    return weekDoses.filter((dose) => {
      const doseDate = parseISO(dose.scheduledTime);
      if (!isSameDay(doseDate, selectedDate)) {
        return false;
      }

      return ![DoseStatus.Taken, DoseStatus.Skipped].includes(dose.status);
    });
  }, [weekDoses, selectedDate]);

  // Filter by search query
  const filteredDoses = useMemo(() => {
    if (!searchQuery.trim()) return selectedDayDoses;
    const query = searchQuery.toLowerCase();
    return selectedDayDoses.filter((dose) => {
      const medName = (
        dose.medication.mims.brandName || dose.medication.mims.genericName
      ).toLowerCase();
      return medName.includes(query);
    });
  }, [selectedDayDoses, searchQuery]);

  const handleTakeDose = async (doseId: string) => {
    try {
      await markDose(doseId, DoseStatus.Taken);
      Alert.alert('Success', 'Dose marked as taken.');
      if (weekDays.length > 0) {
        await loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark dose as taken.');
    }
  };

  const handleSkipDose = async (doseId: string) => {
    try {
      await markDose(doseId, DoseStatus.Skipped);
      Alert.alert('Success', 'Dose marked as skipped.');
      if (weekDays.length > 0) {
        await loadWeekDoses(weekDays[0], weekDays[weekDays.length - 1]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark dose as skipped.');
    }
  };

  const handleScanPress = () => {
    navigation.navigate('ScanPrescription');
  };

  const handleManagePress = () => {
    navigation.navigate('MedicationInteractions');
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-yellow-400 p-4 pt-12">
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center mb-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-2xl text-white">←</Text>
        </TouchableOpacity>

        <Input
          placeholder="Search here"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-white rounded-full px-4 py-3 text-base mb-4"
        />

        <Text className="text-3xl font-bold text-white mb-4">Medications</Text>

        <Button onPress={handleManagePress} className="bg-white mb-2">
          <Text className="text-black">View Interactions</Text>
        </Button>

        <View className="absolute right-4 top-32">
          <Button onPress={handleScanPress} className="bg-white rounded-full w-14 h-14 items-center justify-center">
            <Scan size={24} color={Colors.accent.main} />
          </Button>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.main}
          />
        }
      >
        <Card className="m-4">
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between pt-2">
              {weekDays.map((day, index) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayName = format(day, 'EEE');
                const dayNumber = format(day, 'd');

                return (
                  <TouchableOpacity
                    key={index}
                    className="items-center flex-1"
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text className="text-sm text-gray-500 mb-1">{dayName}</Text>
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        isSelected ? 'bg-blue-500' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-base font-semibold ${
                          isSelected ? 'text-white' : 'text-black'
                        }`}
                      >
                        {dayNumber}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CardContent>
        </Card>

        {/* Medication List */}
        {isLoading ? (
          <View className="m-4 space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </View>
        ) : filteredDoses.length > 0 ? (
          filteredDoses.map((dose) => (
            <Card
              key={dose.id}
              className="m-4"
              onPress={() => navigation.navigate('MedicineDetail', { medicationId: dose.medicationId })}
            >
              <CardHeader>
                <CardTitle>{dose.medication.mims.brandName || dose.medication.mims.genericName}</CardTitle>
                <Text className="text-base text-gray-500">
                  {format(parseISO(dose.scheduledTime), 'h:mm a')}, {dose.medication.userDosage}
                </Text>
              </CardHeader>
              <CardFooter className="flex-row gap-4">
                <Button
                  onPress={(e) => {
                    e.stopPropagation();
                    handleTakeDose(dose.id);
                  }}
                  disabled={dose.status === DoseStatus.Taken}
                  className="flex-1"
                >
                  <Text>{dose.status === DoseStatus.Taken ? 'Taken' : 'Take'}</Text>
                </Button>
                <Button
                  variant="outline"
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSkipDose(dose.id);
                  }}
                  disabled={dose.status === DoseStatus.Skipped}
                  className="flex-1"
                >
                  <Text>Skip</Text>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <View className="p-10 items-center">
            <Text className="text-base text-gray-500 text-center">
              {searchQuery ? 'No medications found' : 'No medications scheduled for this day'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}