import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '../services/i18n';
import { clearAllData } from '../services/database';
import { clearAllSecureData } from '../services/encryption';
import { cancelAllScheduledNotifications } from '../services/notifications';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const [profileName, setProfileName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setProfileName(settings.userName || '');
  }, [settings.userName]);

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    i18n.changeLanguage(newLang);
    updateSettings({ language: newLang });
  };

  const trimmedProfileName = profileName.trim();
  const currentProfileName = settings.userName?.trim() || '';
  const isProfileDirty = trimmedProfileName !== currentProfileName;

  const handleSaveProfileName = async () => {
    if (!isProfileDirty) return;
    try {
      setIsSavingName(true);
      await updateSettings({ userName: trimmedProfileName });
    } catch (error) {
      console.error('Error saving profile name:', error);
      Alert.alert(t('settings.profileSaveError'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      t('settings.deleteAllData'),
      t('settings.deleteAllDataConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel all scheduled notifications
              await cancelAllScheduledNotifications();
              // Clear all database data
              await clearAllData();
              // Clear secure storage
              await clearAllSecureData();
              // Reset onboarding to show onboarding screen
              await updateSettings({ onboardingCompleted: false });
              // Navigate to onboarding
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
              Alert.alert(t('settings.dataDeleted'));
            } catch (error) {
              console.error('Error deleting all data:', error);
              Alert.alert(t('settings.deleteError'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profileSection')}</Text>
          <View style={styles.settingRowAligned}>
            <Text style={styles.settingLabel}>{t('settings.profileName')}</Text>
          </View>
          <TextInput
            style={styles.nameInput}
            value={profileName}
            onChangeText={setProfileName}
            placeholder={t('settings.profileNamePlaceholder')}
            placeholderTextColor={Colors.text.tertiary}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSaveProfileName}
          />
          <TouchableOpacity
            style={[styles.saveButton, (!isProfileDirty || isSavingName) && styles.saveButtonDisabled]}
            onPress={handleSaveProfileName}
            disabled={!isProfileDirty || isSavingName}
          >
            <Text style={styles.saveButtonText}>
              {isSavingName ? t('common.saving') : t('settings.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.remindersSection')}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.enableReminders')}</Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={(value) => updateSettings({ reminderEnabled: value })}
              trackColor={{ false: Colors.border.main, true: Colors.primary.light }}
              thumbColor={settings.reminderEnabled ? Colors.primary.main : Colors.background.card}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.sound')}</Text>
            <Switch
              value={settings.reminderSound}
              onValueChange={(value) => updateSettings({ reminderSound: value })}
              disabled={!settings.reminderEnabled}
              trackColor={{ false: Colors.border.main, true: Colors.primary.light }}
              thumbColor={settings.reminderSound ? Colors.primary.main : Colors.background.card}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.vibrate')}</Text>
            <Switch
              value={settings.reminderVibrate}
              onValueChange={(value) => updateSettings({ reminderVibrate: value })}
              disabled={!settings.reminderEnabled}
              trackColor={{ false: Colors.border.main, true: Colors.primary.light }}
              thumbColor={settings.reminderVibrate ? Colors.primary.main : Colors.background.card}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.unitsSection')}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.glucoseUnit')}</Text>
            <Text style={styles.settingValue}>{settings.glucoseUnit}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.weightUnit')}</Text>
            <Text style={styles.settingValue}>{settings.weightUnit}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.languageSection')}</Text>
          <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
            <Text style={styles.settingLabel}>{t('settings.appLanguage')}</Text>
            <Text style={styles.settingValue}>{i18n.language === 'en' ? t('settings.languageEnglish') : t('settings.languageMalay')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataPrivacySection')}</Text>
          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('Export')}>
            <Text style={styles.settingButtonText}>{t('settings.exportData')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>{t('settings.viewPrivacyPolicy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingButton, styles.dangerButton]} onPress={handleDeleteAllData}>
            <Text style={[styles.settingButtonText, styles.dangerButtonText]}>{t('settings.deleteAllData')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.aboutSection')}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.version')}</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('RamadanMode')}>
            <Text style={styles.settingButtonText}>{t('settings.ramadanMode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('Analytics')}>
            <Text style={styles.settingButtonText}>{t('settings.attributions')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.background.card,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  settingValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  settingRowAligned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
  },
  nameInput: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  saveButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  saveButtonText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  settingButton: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary.main,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerButtonText: {
    color: Colors.status.error,
  },
});