/**
 * ProfileScreen - Profile & Settings
 * Matches Figma design: Profile.png
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

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
            placeholder="Search here"
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Title */}
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Reminders</Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={(value) => updateSettings({ reminderEnabled: value })}
              trackColor={{ false: Colors.border.main, true: Colors.primary.light }}
              thumbColor={settings.reminderEnabled ? Colors.primary.main : Colors.background.card}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Switch
              value={settings.reminderSound}
              onValueChange={(value) => updateSettings({ reminderSound: value })}
              disabled={!settings.reminderEnabled}
              trackColor={{ false: Colors.border.main, true: Colors.primary.light }}
              thumbColor={settings.reminderSound ? Colors.primary.main : Colors.background.card}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibrate</Text>
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
          <Text style={styles.sectionTitle}>Units</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Glucose Unit</Text>
            <Text style={styles.settingValue}>{settings.glucoseUnit}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Weight Unit</Text>
            <Text style={styles.settingValue}>{settings.weightUnit}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('Export')}>
            <Text style={styles.settingButtonText}>Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>View Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingButton, styles.dangerButton]}>
            <Text style={[styles.settingButtonText, styles.dangerButtonText]}>Delete All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('RamadanMode')}>
            <Text style={styles.settingButtonText}>Ramadan Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingButton} onPress={() => navigation.navigate('Analytics')}>
            <Text style={styles.settingButtonText}>Attributions</Text>
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
