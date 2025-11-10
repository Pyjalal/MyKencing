import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../services/i18n';
import { clearAllData } from '../services/database';
import { clearAllSecureData } from '../services/encryption';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    i18n.changeLanguage(newLang);
    updateSettings({ language: newLang });
  };

  const handleDeleteAllData = async () => {
    try {
      await clearAllData();
      await clearAllSecureData();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      Alert.alert(t('settings.dataDeleted', 'All data has been deleted'));
    } catch (error) {
      console.error('Error deleting all data:', error);
      Alert.alert(t('settings.deleteError', 'Failed to delete data. Please try again.'));
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-purple-600 p-4 pt-12">
        <TouchableOpacity className="w-10 h-10 items-center justify-center mb-4" onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text className="text-2xl text-white">←</Text>
        </TouchableOpacity>
        <View className="flex-row items-center bg-white rounded-full px-4 py-2 mb-4">
          <Search size={20} color="gray" className="mr-2" />
          <TextInput
            placeholder={t('settings.searchPlaceholder')}
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base"
          />
        </View>
        <Text className="text-3xl font-bold text-white mb-2">{t('settings.title')}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <Card className="m-4">
          <CardHeader>
            <CardTitle>{t('settings.remindersSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
              <Text className="text-base">{t('settings.enableReminders')}</Text>
              <Switch
                value={settings.reminderEnabled}
                onValueChange={(value) => updateSettings({ reminderEnabled: value })}
              />
            </View>
            <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
              <Text className="text-base">{t('settings.sound')}</Text>
              <Switch
                value={settings.reminderSound}
                onValueChange={(value) => updateSettings({ reminderSound: value })}
                disabled={!settings.reminderEnabled}
              />
            </View>
            <View className="flex-row justify-between items-center py-4">
              <Text className="text-base">{t('settings.vibrate')}</Text>
              <Switch
                value={settings.reminderVibrate}
                onValueChange={(value) => updateSettings({ reminderVibrate: value })}
                disabled={!settings.reminderEnabled}
              />
            </View>
          </CardContent>
        </Card>

        <Card className="m-4">
          <CardHeader>
            <CardTitle>{t('settings.unitsSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
              <Text className="text-base">{t('settings.glucoseUnit')}</Text>
              <Text className="text-base text-gray-500">{settings.glucoseUnit}</Text>
            </View>
            <View className="flex-row justify-between items-center py-4">
              <Text className="text-base">{t('settings.weightUnit')}</Text>
              <Text className="text-base text-gray-500">{settings.weightUnit}</Text>
            </View>
          </CardContent>
        </Card>

        <Card className="m-4">
          <CardHeader>
            <CardTitle>{t('settings.languageSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onPress={handleLanguageChange}>
              <Text>{i18n.language === 'en' ? 'English' : 'Bahasa Melayu'}</Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="m-4">
          <CardHeader>
            <CardTitle>{t('settings.dataPrivacySection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="mb-2" onPress={() => navigation.navigate('Export')}>
              <Text>{t('settings.exportData')}</Text>
            </Button>
            <Button variant="outline" className="mb-2">
              <Text>{t('settings.viewPrivacyPolicy')}</Text>
            </Button>
            <Button variant="destructive" onPress={() => setShowDeleteConfirm(true)}>
              <Text>{t('settings.deleteAllData')}</Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="m-4">
          <CardHeader>
            <CardTitle>{t('settings.aboutSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
              <Text className="text-base">{t('settings.version')}</Text>
              <Text className="text-base text-gray-500">1.0.0</Text>
            </View>
            <Button variant="outline" className="mt-4" onPress={() => navigation.navigate('RamadanMode')}>
              <Text>{t('settings.ramadanMode')}</Text>
            </Button>
            <Button variant="outline" className="mt-2" onPress={() => navigation.navigate('Analytics')}>
              <Text>{t('settings.attributions')}</Text>
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('settings.deleteAllData')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('settings.deleteAllDataConfirm', 'This will permanently delete all your medications, doses, vitals, and settings. This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Text>{t('settings.cancel', 'Cancel')}</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={handleDeleteAllData}>
                <Text>{t('settings.delete', 'Delete')}</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ScrollView>
    </View>
  );
}
