import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../services/i18n';
import { clearAllData } from '../services/database';
import { clearAllSecureData } from '../services/encryption';
import { PillButton } from '../components/PillButton';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
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
      Alert.alert(t('settings.profileSaveError', 'Failed to save your name. Please try again.'));
    } finally {
      setIsSavingName(false);
    }
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.profile} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('common.back', 'Back')}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={Colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('settings.searchPlaceholder')}
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>

          <Text style={styles.headerTitle}>{t('settings.title', 'Profile & Settings')}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('settings.profileSection', 'Profile')}</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('settings.profileName', 'Your name')}</Text>
              <TextInput
                style={styles.textField}
                value={profileName}
                onChangeText={setProfileName}
                placeholder={t('settings.profileNamePlaceholder', 'Enter your name')}
                placeholderTextColor={Colors.text.tertiary}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSaveProfileName}
              />
            </View>
            <PillButton
              title={t('settings.save', 'Save')}
              variant="accent"
              onPress={handleSaveProfileName}
              disabled={!isProfileDirty || isSavingName}
              loading={isSavingName}
              style={styles.savePill}
              textStyle={styles.savePillText}
            />
          </View>

          <View style={styles.sectionCard}>
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

          <View style={styles.sectionCard}>
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

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('settings.languageSection')}</Text>
            <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
              <Text style={styles.settingLabel}>{t('settings.appLanguage')}</Text>
              <Text style={styles.settingValue}>{i18n.language === 'en' ? 'English' : 'Bahasa Melayu'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('settings.dataPrivacySection')}</Text>
            <TouchableOpacity style={styles.actionLink} onPress={() => navigation.navigate('Export')}>
              <Text style={styles.actionLinkText}>{t('settings.exportData')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionLink}>
              <Text style={styles.actionLinkText}>{t('settings.viewPrivacyPolicy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionLink} onPress={handleDeleteAllData}>
              <Text style={[styles.actionLinkText, styles.dangerText]}>{t('settings.deleteAllData')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('settings.aboutSection')}</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('settings.version')}</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
            <TouchableOpacity style={styles.actionLink} onPress={() => navigation.navigate('RamadanMode')}>
              <Text style={styles.actionLinkText}>{t('settings.ramadanMode')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionLink} onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.actionLinkText}>{t('settings.analytics')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.profile,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    backgroundColor: Colors.background.profile,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['3xl'] * 2,
    ...Shadows.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: Colors.text.inverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
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
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  textField: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  savePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
  },
  savePillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent.contrast,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  settingValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  actionLink: {
    paddingVertical: Spacing.sm,
  },
  actionLinkText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dangerText: {
    color: Colors.status.error,
  },
  bottomSpacing: {
    height: Spacing['3xl'],
  },
});