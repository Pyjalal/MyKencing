import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useVitalsStore } from '../stores/vitalsStore';
import { Colors } from '../constants/theme';
import { VitalType } from '../types';
import { Search, BotMessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Hard-coded demo data for 14 days
const DEMO_DATA = {
  bloodPressure: [
    { day: 1, systolic: 110, diastolic: 95 },
    { day: 2, systolic: 115, diastolic: 100 },
    { day: 3, systolic: 118, diastolic: 98 },
    { day: 4, systolic: 125, diastolic: 105 },
    { day: 5, systolic: 130, diastolic: 110 },
    { day: 6, systolic: 122, diastolic: 102 },
    { day: 7, systolic: 115, diastolic: 96 },
    { day: 8, systolic: 120, diastolic: 100 },
    { day: 9, systolic: 128, diastolic: 108 },
    { day: 10, systolic: 118, diastolic: 99 },
    { day: 11, systolic: 115, diastolic: 97 },
    { day: 12, systolic: 112, diastolic: 95 },
    { day: 13, systolic: 118, diastolic: 100 },
    { day: 14, systolic: 120, diastolic: 102 },
  ],
  weight: [
    { day: 1, weight: 58.2, bmi: 21.1 },
    { day: 2, weight: 58.3, bmi: 21.1 },
    { day: 3, weight: 58.5, bmi: 21.2 },
    { day: 4, weight: 58.8, bmi: 21.3 },
    { day: 5, weight: 59.0, bmi: 21.4 },
    { day: 6, weight: 58.9, bmi: 21.3 },
    { day: 7, weight: 58.7, bmi: 21.3 },
    { day: 8, weight: 58.5, bmi: 21.2 },
    { day: 9, weight: 58.4, bmi: 21.2 },
    { day: 10, weight: 58.6, bmi: 21.2 },
    { day: 11, weight: 58.8, bmi: 21.3 },
    { day: 12, weight: 59.1, bmi: 21.4 },
    { day: 13, weight: 58.9, bmi: 21.3 },
    { day: 14, weight: 58.4, bmi: 21.2 },
  ],
  glucose: [
    { day: 1, value: 7.5 },
    { day: 2, value: 7.2 },
    { day: 3, value: 6.8 },
    { day: 4, value: 6.5 },
    { day: 5, value: 8.2 },
    { day: 6, value: 8.5 },
    { day: 7, value: 7.8 },
    { day: 8, value: 7.5 },
    { day: 9, value: 7.9 },
    { day: 10, value: 8.1 },
    { day: 11, value: 8.8 },
    { day: 12, value: 9.0 },
    { day: 13, value: 8.5 },
    { day: 14, value: 8.3 },
  ],
  cholesterol: [
    { day: 1, value: 5.0 },
    { day: 2, value: 4.9 },
    { day: 3, value: 5.2 },
    { day: 4, value: 5.5 },
    { day: 5, value: 6.8 },
    { day: 6, value: 7.0 },
    { day: 7, value: 6.2 },
    { day: 8, value: 5.8 },
    { day: 9, value: 5.5 },
    { day: 10, value: 5.2 },
    { day: 11, value: 5.0 },
    { day: 12, value: 6.5 },
    { day: 13, value: 6.8 },
    { day: 14, value: 5.9 },
  ],
};

export default function VitalsScreen() {
  const { t } = useTranslation();
  const { vitals, loadVitals } = useVitalsStore();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true); // Toggle for demo data

  useEffect(() => {
    loadVitals();
  }, []);

  // Calculate averages from demo data
  const bpAvg = {
    systolic: Math.round(DEMO_DATA.bloodPressure.reduce((sum, d) => sum + d.systolic, 0) / 14),
    diastolic: Math.round(DEMO_DATA.bloodPressure.reduce((sum, d) => sum + d.diastolic, 0) / 14),
  };
  const weightAvg = DEMO_DATA.weight[13].weight; // Latest weight
  const bmiAvg = DEMO_DATA.weight[13].bmi;
  const glucoseAvg = (DEMO_DATA.glucose.reduce((sum, d) => sum + d.value, 0) / 14).toFixed(1);
  const cholesterolAvg = (DEMO_DATA.cholesterol.reduce((sum, d) => sum + d.value, 0) / 14).toFixed(2);

  const handleChatPress = () => {
    navigation.navigate('ChatBot');
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-blue-500 p-4 pt-12">
        <TouchableOpacity className="w-10 h-10 items-center justify-center mb-4" onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text className="text-2xl text-white">←</Text>
        </TouchableOpacity>
        <View className="flex-row items-center bg-white rounded-full px-4 py-2 mb-4">
          <Search size={20} color="gray" className="mr-2" />
          <TextInput
            placeholder={t('vitals.search_here')}
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base"
          />
        </View>
        <Text className="text-3xl font-bold text-white mb-2">{t('vitals.vitals_tracker')}</Text>
        <Button variant="ghost" className="absolute right-4 top-32 bg-white rounded-full w-14 h-14 items-center justify-center" onPress={handleChatPress}>
          <BotMessageSquare size={24} color={Colors.secondary.main} />
        </Button>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-4">
          <Button variant={isDemoMode ? 'default' : 'outline'} onPress={() => setIsDemoMode(!isDemoMode)}>
            <Text>{isDemoMode ? t('vitals.demo_mode_on') : t('vitals.real_data')}</Text>
          </Button>
        </View>

        {isDemoMode ? (
          <View className="p-4">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t('vitals.summary_title')}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t('vitals.blood_pressure_card_title')}</CardTitle>
                <Text className="text-sm text-gray-500">{t('vitals.bp_normal_range')}</Text>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-end h-32 gap-1">
                  {DEMO_DATA.bloodPressure.map((data, index) => (
                    <View key={index} className="flex-1 items-center justify-end">
                      <View className={`w-full rounded ${data.systolic > 130 ? 'bg-red-400' : 'bg-gray-300'}`} style={{ height: (data.systolic - 60) * 1.5 }} />
                    </View>
                  ))}
                </View>
                <View className="flex-row justify-center gap-4 mt-2">
                  <View className="flex-row items-center gap-1">
                    <View className="w-3 h-3 rounded-full bg-blue-800" />
                    <Text className="text-sm text-gray-500">{t('vitals.systolic')}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <View className="w-3 h-3 rounded-full bg-blue-400" />
                    <Text className="text-sm text-gray-500">{t('vitals.diastolic')}</Text>
                  </View>
                </View>
                <Text className="text-base text-gray-500 mt-2 text-center">
                  {t('vitals.avg_bp', { systolic: bpAvg.systolic, diastolic: bpAvg.diastolic })} — <Text className="text-green-500 font-semibold">{t('vitals.stable')}</Text>
                </Text>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t('vitals.weight_card_title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-center gap-4 mb-1">
                  <Text className="text-5xl font-bold">{weightAvg} kg</Text>
                  <Badge className="bg-green-500"><Text className="text-white font-bold">{t('vitals.bmi', { bmi: bmiAvg })}</Text></Badge>
                </View>
                <Text className="text-sm text-gray-500 mb-2">{t('vitals.weight_change_since_last_week')}</Text>
                <View className="flex-row items-end h-32 gap-1">
                  {DEMO_DATA.weight.map((data, index) => (
                    <View key={index} className="flex-1 items-center justify-end">
                      <View className={`w-full rounded ${index % 2 === 0 ? 'bg-blue-800' : 'bg-blue-400'}`} style={{ height: (data.weight - 40) * 3 }} />
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t('vitals.glucose_card_title')}</CardTitle>
                <Text className="text-sm text-gray-500">{t('vitals.glucose_normal_range')}</Text>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-end h-32 gap-1">
                  {DEMO_DATA.glucose.map((data, index) => (
                    <View key={index} className="flex-1 items-center justify-end">
                      <View className={`w-full rounded ${data.value > 7 ? 'bg-red-400' : 'bg-gray-300'}`} style={{ height: data.value * 15 }} />
                    </View>
                  ))}
                </View>
                <Text className="text-base text-gray-500 mt-2 text-center">
                  {t('vitals.avg_glucose', { avg: glucoseAvg })} — <Text className="text-yellow-500 font-semibold">{t('vitals.slightly_elevated')}</Text>
                </Text>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t('vitals.cholesterol_card_title')}</CardTitle>
                <Text className="text-sm text-gray-500">{t('vitals.cholesterol_normal_range')}</Text>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-end h-32 gap-1">
                  {DEMO_DATA.cholesterol.map((data, index) => (
                    <View key={index} className="flex-1 items-center justify-end">
                      <View className={`w-full rounded ${index % 2 === 0 ? 'bg-blue-800' : 'bg-blue-400'}`} style={{ height: data.value * 15 }} />
                    </View>
                  ))}
                </View>
                <Text className="text-base text-gray-500 mt-2 text-center">
                  {t('vitals.avg_cholesterol', { avg: cholesterolAvg })} — <Text className="text-green-500 font-semibold">{t('vitals.healthy')}</Text>
                </Text>
              </CardContent>
            </Card>
          </View>
        ) : (
          <View className="p-4">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t('home.quick_add')}</CardTitle>
              </CardHeader>
              <CardContent className="flex-row gap-2">
                <Button className="flex-1" onPress={() => navigation.navigate('AddVital', { type: VitalType.BloodPressure })}>
                  <Text className="text-white">{t('add_vital.blood_pressure')}</Text>
                </Button>
                <Button className="flex-1" onPress={() => navigation.navigate('AddVital', { type: VitalType.Glucose })}>
                  <Text className="text-white">{t('add_vital.glucose')}</Text>
                </Button>
                <Button className="flex-1" onPress={() => navigation.navigate('AddVital', { type: VitalType.Weight })}>
                  <Text className="text-white">{t('add_vital.weight')}</Text>
                </Button>
              </CardContent>
            </Card>

            {vitals.length === 0 && (
              <Card>
                <CardContent className="p-10 items-center">
                  <Text className="text-xl font-semibold mb-2">{t('vitals.no_vitals_yet')}</Text>
                  <Text className="text-base text-gray-500 text-center">{t('vitals.start_tracking_vitals')}</Text>
                </CardContent>
              </Card>
            )}

            {vitals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('vitals.recent_readings')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {vitals.slice(0, 10).map((vital) => (
                    <View key={vital.id} className="p-4 border-b border-gray-200">
                      <Text className="text-xs font-semibold text-gray-400 uppercase">{vital.type.replace('_', ' ')}</Text>
                      <Text className="text-xl font-bold text-black">
                        {vital.type === VitalType.BloodPressure
                          ? `${vital.systolic}/${vital.diastolic} ${vital.unit}`
                          : `${vital.value} ${vital.unit}`}
                      </Text>
                      <Text className="text-sm text-gray-500">{new Date(vital.measuredAt).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}