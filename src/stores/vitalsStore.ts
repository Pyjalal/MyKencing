import { create } from 'zustand';
import { Vital, VitalType, BloodPressureVital, GlucoseVital, WeightVital, VitalTrend } from '../types';
import { getDatabase } from '../services/database';

interface VitalsState {
  vitals: Vital[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadVitals: (type?: VitalType, days?: number) => Promise<void>;
  addBloodPressure: (systolic: number, diastolic: number, measuredAt?: string, notes?: string) => Promise<void>;
  addGlucose: (value: number, unit: 'mmol/L' | 'mg/dL', measuredAt?: string, notes?: string) => Promise<void>;
  addWeight: (value: number, unit: 'kg' | 'lb', measuredAt?: string, notes?: string) => Promise<void>;
  deleteVital: (id: string) => Promise<void>;
  getTrend: (type: VitalType, days: number) => Promise<VitalTrend[]>;
  getLatestByType: (type: VitalType) => Vital | undefined;
}

export const useVitalsStore = create<VitalsState>((set, get) => ({
  vitals: [],
  isLoading: false,
  error: null,

  loadVitals: async (type, days = 90) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let query = 'SELECT * FROM vitals WHERE measured_at >= ?';
      const params: any[] = [cutoffDate.toISOString()];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY measured_at DESC';

      const rows = await db.getAllAsync<any>(query, params);

      const vitals: Vital[] = rows.map((row) => {
        if (row.type === VitalType.BloodPressure) {
          return {
            id: row.id,
            type: VitalType.BloodPressure,
            systolic: row.systolic,
            diastolic: row.diastolic,
            unit: 'mmHg',
            measuredAt: row.measured_at,
            notes: row.notes,
            createdAt: row.created_at,
          } as BloodPressureVital;
        } else if (row.type === VitalType.Glucose) {
          return {
            id: row.id,
            type: VitalType.Glucose,
            value: row.value,
            unit: row.unit,
            measuredAt: row.measured_at,
            notes: row.notes,
            createdAt: row.created_at,
          } as GlucoseVital;
        } else {
          return {
            id: row.id,
            type: VitalType.Weight,
            value: row.value,
            unit: row.unit,
            measuredAt: row.measured_at,
            notes: row.notes,
            createdAt: row.created_at,
          } as WeightVital;
        }
      });

      set({ vitals, isLoading: false });
    } catch (error) {
      console.error('Error loading vitals:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addBloodPressure: async (systolic, diastolic, measuredAt, notes) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const id = `vital_bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const measured = measuredAt || now;

      await db.runAsync(
        `INSERT INTO vitals (id, type, systolic, diastolic, unit, measured_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, VitalType.BloodPressure, systolic, diastolic, 'mmHg', measured, notes || null, now]
      );

      await get().loadVitals();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error adding blood pressure:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addGlucose: async (value, unit, measuredAt, notes) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const id = `vital_glu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const measured = measuredAt || now;

      await db.runAsync(
        `INSERT INTO vitals (id, type, value, unit, measured_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, VitalType.Glucose, value, unit, measured, notes || null, now]
      );

      await get().loadVitals();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error adding glucose:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addWeight: async (value, unit, measuredAt, notes) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const id = `vital_wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const measured = measuredAt || now;

      await db.runAsync(
        `INSERT INTO vitals (id, type, value, unit, measured_at, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, VitalType.Weight, value, unit, measured, notes || null, now]
      );

      await get().loadVitals();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error adding weight:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteVital: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM vitals WHERE id = ?', [id]);
      await get().loadVitals();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error deleting vital:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getTrend: async (type, days) => {
    try {
      const db = getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const rows = await db.getAllAsync<any>(
        `SELECT
           DATE(measured_at) as date,
           AVG(value) as avg_value,
           AVG(systolic) as avg_systolic,
           AVG(diastolic) as avg_diastolic
         FROM vitals
         WHERE type = ? AND measured_at >= ?
         GROUP BY DATE(measured_at)
         ORDER BY date ASC`,
        [type, cutoffDate.toISOString()]
      );

      const trend: VitalTrend[] = rows.map((row) => ({
        date: row.date,
        value: row.avg_value,
        systolic: row.avg_systolic,
        diastolic: row.avg_diastolic,
      }));

      return trend;
    } catch (error) {
      console.error('Error getting trend:', error);
      return [];
    }
  },

  getLatestByType: (type) => {
    return get().vitals.find((vital) => vital.type === type);
  },
}));
