import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { getEventCounts, EventType, clearAnalyticsData } from '../services/analytics';
import UsageChart from '../components/UsageChart';

export default function AnalyticsDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ total: number; byType: Record<string, number>; byDay: { date: string; count: number }[] }>({ total: 0, byType: {}, byDay: [] });
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const refresh = useCallback(async (range: 7 | 30 | 90) => {
    setLoading(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - range);
      const res = await getEventCounts(start, end);
      setCounts(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(days); }, [days]);

  const onClear = useCallback(async () => {
    await clearAnalyticsData();
    refresh(days);
  }, [days, refresh]);

  if (loading) {
    return (
      <View style={styles.center}> 
        <Text style={styles.subtitle}>Loading usage...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}> 
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>Your Usage (Last {days} Days)</Text>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.chip, days === 7 && styles.chipActive]} onPress={() => setDays(7)}>
            <Text style={[styles.chipText, days === 7 && styles.chipTextActive]}>7d</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, days === 30 && styles.chipActive]} onPress={() => setDays(30)}>
            <Text style={[styles.chipText, days === 30 && styles.chipTextActive]}>30d</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, days === 90 && styles.chipActive]} onPress={() => setDays(90)}>
            <Text style={[styles.chipText, days === 90 && styles.chipTextActive]}>90d</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[styles.button, styles.danger]} onPress={onClear}>
            <Text style={[styles.buttonText, styles.dangerText]}>Clear Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <Text style={styles.row}>Total events: <Text style={styles.bold}>{counts.total}</Text></Text>
          <Text style={styles.row}>App opens: <Text style={styles.bold}>{counts.byType[EventType.AppOpened] || 0}</Text></Text>
          <Text style={styles.row}>Doses logged: <Text style={styles.bold}>{counts.byType[EventType.DoseLogged] || 0}</Text></Text>
          <Text style={styles.row}>Vitals logged: <Text style={styles.bold}>{counts.byType[EventType.VitalLogged] || 0}</Text></Text>
          <Text style={styles.row}>OCR scans: <Text style={styles.bold}>{counts.byType[EventType.OCRScanned] || 0}</Text></Text>
          <Text style={styles.row}>Reports generated: <Text style={styles.bold}>{counts.byType[EventType.ReportGenerated] || 0}</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily Activity</Text>
          <UsageChart data={counts.byDay} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.secondary },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.text.primary, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
  error: { color: Colors.status.error, fontSize: Typography.fontSize.base },
  card: { backgroundColor: Colors.background.card, borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.md },
  row: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, marginTop: 4 },
  bold: { color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.light, marginRight: 8 },
  chipActive: { backgroundColor: Colors.primary.light, borderColor: Colors.primary.main },
  chipText: { color: Colors.text.secondary, fontSize: Typography.fontSize.sm },
  chipTextActive: { color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border.main },
  buttonText: { color: Colors.text.primary },
  danger: { borderColor: Colors.status.error },
  dangerText: { color: Colors.status.error },
  rowContainer: { flexDirection: 'row', alignItems: 'center' },
});
