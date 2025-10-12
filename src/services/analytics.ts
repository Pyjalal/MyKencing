/**
 * Analytics Service (Privacy-safe, local only)
 * Tracks non-PHI app usage events in SQLite `events` table
 */

import { getDatabase } from './database';

export enum EventType {
  AppOpened = 'app_opened',
  FeatureUsed = 'feature_used',
  MedicationAdded = 'medication_added',
  DoseLogged = 'dose_logged',
  VitalLogged = 'vital_logged',
  OCRScanned = 'ocr_scanned',
  ReportGenerated = 'report_generated',
  LanguageChanged = 'language_changed',
}

export interface EventCounts {
  total: number;
  byType: Record<string, number>;
  byDay: { date: string; count: number }[];
}

export async function logEvent(
  eventType: EventType,
  properties?: Record<string, any>
): Promise<void> {
  const db = getDatabase();
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO events (id, type, properties, created_at) VALUES (?, ?, ?, ?)`,
    [id, eventType, properties ? JSON.stringify(properties) : null, createdAt]
  );
}

export async function getEventCounts(
  startDate: Date,
  endDate: Date
): Promise<EventCounts> {
  const db = getDatabase();

  const totalRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM events WHERE created_at BETWEEN ? AND ?`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const byTypeRows = await db.getAllAsync<{ type: string; count: number }>(
    `SELECT type, COUNT(*) as count FROM events WHERE created_at BETWEEN ? AND ? GROUP BY type`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const byDayRows = await db.getAllAsync<{ date: string; count: number }>(
    `SELECT DATE(created_at) as date, COUNT(*) as count FROM events WHERE created_at BETWEEN ? AND ? GROUP BY DATE(created_at) ORDER BY date ASC`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const byType: Record<string, number> = {};
  byTypeRows.forEach((r) => (byType[r.type] = r.count));

  return {
    total: totalRow?.total || 0,
    byType,
    byDay: byDayRows || [],
  };
}

export async function clearAnalyticsData(): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM events');
}
