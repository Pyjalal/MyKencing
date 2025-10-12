import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { generateAndShareReport } from '../services/export';
import { logEvent, EventType } from '../services/analytics';

export default function ExportReportScreen() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const doExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await generateAndShareReport(period);
      if (!result.success) {
        setMessage(result.error || 'Failed to generate report');
      } else {
        setMessage('Report generated. Choose an app to share.');
        try { await logEvent(EventType.ReportGenerated, { period }); } catch {}
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export Medication & Vitals Report</Text>

      <Text style={styles.subtitle}>Select period</Text>
      <View style={styles.row}>
        {[7, 30, 90].map((p) => (
          <TouchableOpacity key={p} style={[styles.chip, period === p ? styles.chipActive : null]} onPress={() => setPeriod(p as 7 | 30 | 90)}>
            <Text style={[styles.chipText, period === p ? styles.chipTextActive : null]}>{p} days</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={doExport} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Generating...' : 'Generate & Share'}</Text>
      </TouchableOpacity>

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary, padding: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, marginTop: Spacing.lg },
  row: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.light },
  chipActive: { backgroundColor: Colors.primary.light, borderColor: Colors.primary.main },
  chipText: { color: Colors.text.secondary },
  chipTextActive: { color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold },
  button: { marginTop: Spacing['2xl'], backgroundColor: Colors.primary.main, paddingVertical: Spacing.md, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.text.inverse, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  message: { marginTop: Spacing.md, color: Colors.text.secondary },
});
