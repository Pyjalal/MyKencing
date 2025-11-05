import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useMedicationStore } from '../stores/medicationStore';
import { adjustMedicationForRamadan, restoreOriginalSchedule, getRamadanDates } from '../utils/ramadanAdjustments';
import { cancelMedicationReminders, scheduleMedicationReminders } from '../services/notifications';
import { useTranslation } from 'react-i18next';

export default function RamadanModeScreen() {
  const { t } = useTranslation();
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { medications, loadMedications, updateMedication } = useMedicationStore();

  const [enabled, setEnabled] = useState(false);
  const [sahur, setSahur] = useState('05:30');
  const [iftar, setIftar] = useState('19:15');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      await loadSettings();
      await loadMedications();
    })();
  }, []);

  useEffect(() => {
    const r = settings.ramadan;
    if (r) {
      setEnabled(!!r.enabled);
      if (r.sahurTime) setSahur(r.sahurTime);
      if (r.iftarTime) setIftar(r.iftarTime);
      if (r.startDate) setStartDate(r.startDate);
      if (r.endDate) setEndDate(r.endDate);
    }
  }, [settings.ramadan]);

  const autoDates = useMemo(() => getRamadanDates(new Date().getFullYear()), []);

  const onAutoSetDates = () => {
    setStartDate(autoDates.start.toISOString().slice(0, 10));
    setEndDate(autoDates.end.toISOString().slice(0, 10));
  };

  const applyAdjustments = async () => {
    try {
      setBusy(true);
      const originalTimes: Record<string, string[]> = {};

      for (const med of medications) {
        originalTimes[med.id] = med.times.slice();
        const adjusted = adjustMedicationForRamadan(med, sahur, iftar);
        await updateMedication(med.id, { times: adjusted.times });
        await cancelMedicationReminders(med.id);
        await scheduleMedicationReminders({ ...med, times: adjusted.times } as any);
      }

      await updateSettings({
        ramadan: {
          enabled: true,
          startDate,
          endDate,
          sahurTime: sahur,
          iftarTime: iftar,
          originalTimes,
        },
      });
      Alert.alert(t('ramadan.ramadan_mode_alert_title'), t('ramadan.ramadan_mode_alert_message'));
    } catch (e) {
      Alert.alert(t('ramadan.error_alert_title'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const restoreSchedules = async () => {
    try {
      setBusy(true);
      const map = settings.ramadan?.originalTimes || {};
      for (const med of medications) {
        const restored = restoreOriginalSchedule(med, map);
        await updateMedication(med.id, { times: restored.times });
        await cancelMedicationReminders(med.id);
        await scheduleMedicationReminders({ ...med, times: restored.times } as any);
      }
      await updateSettings({ ramadan: { enabled: false, originalTimes: map } });
      Alert.alert(t('ramadan.ramadan_mode_alert_title'), t('ramadan.ramadan_mode_restored_alert_message'));
    } catch (e) {
      Alert.alert(t('ramadan.error_alert_title'), (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (value: boolean) => {
    setEnabled(value);
    if (value) await applyAdjustments();
    else await restoreSchedules();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('ramadan.ramadan_mode_title')}</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.label}>{t('ramadan.enable_ramadan_adjustments')}</Text>
        <Switch value={enabled} onValueChange={onToggle} disabled={busy} />
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.label}>{t('ramadan.sahur_time')}</Text>
        <TextInput style={styles.input} value={sahur} onChangeText={setSahur} placeholder="05:30" />
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>{t('ramadan.iftar_time')}</Text>
        <TextInput style={styles.input} value={iftar} onChangeText={setIftar} placeholder="19:15" />
      </View>

      <View style={styles.fieldRow}>
        <Text style={styles.label}>{t('ramadan.start_date')}</Text>
        <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>{t('ramadan.end_date')}</Text>
        <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
      </View>

      <TouchableOpacity style={styles.button} onPress={onAutoSetDates} disabled={busy}>
        <Text style={styles.buttonText}>{t('ramadan.auto_set_dates')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.primary]} onPress={applyAdjustments} disabled={busy}>
        <Text style={[styles.buttonText, styles.primaryText]}>{t('ramadan.apply_adjustments')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.danger]} onPress={restoreSchedules} disabled={busy}>
        <Text style={[styles.buttonText, styles.dangerText]}>{t('ramadan.restore_original')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary, padding: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  label: { color: Colors.text.primary, fontSize: Typography.fontSize.base },
  fieldRow: { marginTop: Spacing.md },
  input: { marginTop: Spacing.xs, backgroundColor: Colors.background.card, borderColor: Colors.border.light, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.text.primary },
  button: { marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.border.main, borderRadius: 8, paddingVertical: Spacing.md, alignItems: 'center' },
  buttonText: { color: Colors.text.primary, fontSize: Typography.fontSize.base },
  primary: { backgroundColor: Colors.primary.main, borderColor: Colors.primary.main },
  primaryText: { color: Colors.text.inverse },
  danger: { backgroundColor: 'transparent', borderColor: Colors.status.error },
  dangerText: { color: Colors.status.error },
})