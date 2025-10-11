import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

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
          <TouchableOpacity style={styles.settingButton}>
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
          <TouchableOpacity style={styles.settingButton}>
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
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary.main,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
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
