import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../services/i18n';
import { clearAllData } from '../services/database';
import { clearAllSecureData } from '../services/encryption';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    i18n.changeLanguage(newLang);
    updateSettings({ language: newLang });
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      t('settings.deleteAllData'),
      t('settings.deleteAllDataConfirm', 'This will permanently delete all your medications, doses, vitals, and settings. This action cannot be undone.'),
      [
        {
          text: t('settings.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all database data
              await clearAllData();
              // Clear secure storage
              await clearAllSecureData();
              // Navigate back to home or restart app
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
              Alert.alert(t('settings.dataDeleted', 'All data has been deleted'));
            } catch (error) {
              console.error('Error deleting all data:', error);
              Alert.alert(t('settings.deleteError', 'Failed to delete data. Please try again.'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with background */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('settings.searchPlaceholder')}
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Title */}
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

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
            <Text style={styles.settingValue}>{i18n.language === 'en' ? 'English' : 'Bahasa Melayu'}</Text>
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
  header: {
    backgroundColor: Colors.background.profile,
    paddingTop: Spacing['2xl'] + 10,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.inverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
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