import { create } from 'zustand';
import { Medication, MedicationWithDetails, Dose, DoseWithMedication, DoseStatus } from '../types';
import { getDatabase } from '../services/database';
import { logEvent, EventType } from '../services/analytics';

interface MedicationState {
  medications: MedicationWithDetails[];
  todayDoses: DoseWithMedication[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMedications: () => Promise<void>;
  loadTodayDoses: () => Promise<void>;
  loadWeekDoses: (startDate: Date, endDate: Date) => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMedication: (id: string, medication: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  markDose: (doseId: string, status: DoseStatus, actualTime?: string) => Promise<void>;
  getMedicationById: (id: string) => MedicationWithDetails | undefined;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayDoses: [],
  isLoading: false,
  error: null,

  loadMedications: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();

      const medications = await db.getAllAsync<any>(`
        SELECT
          m.*,
          mc.generic_name,
          mc.brand_name,
          mc.strength,
          mc.dosage_form,
          mc.instructions,
          mc.timing,
          mc.food_instructions,
          mc.warnings,
          mc.side_effects,
          mc.contraindications,
          mc.drug_interactions,
          mc.food_interactions,
          mc.source,
          mc.last_updated as mims_last_updated
        FROM medications m
        JOIN mims_cache mc ON m.mims_id = mc.id
        WHERE m.is_active = 1
        ORDER BY m.created_at DESC
      `);

      const formatted: MedicationWithDetails[] = medications.map((row) => ({
        id: row.id,
        mimsId: row.mims_id,
        userDosage: row.user_dosage,
        frequency: row.frequency,
        times: JSON.parse(row.times),
        withFood: row.with_food,
        startDate: row.start_date,
        endDate: row.end_date,
        refillDate: row.refill_date,
        isActive: row.is_active === 1,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        mims: {
          id: row.mims_id,
          genericName: row.generic_name,
          brandName: row.brand_name,
          strength: row.strength,
          dosageForm: row.dosage_form,
          instructions: row.instructions,
          timing: row.timing,
          foodInstructions: row.food_instructions,
          warnings: row.warnings,
          sideEffects: row.side_effects,
          contraindications: row.contraindications,
          drugInteractions: row.drug_interactions,
          foodInteractions: row.food_interactions,
          source: row.source,
          lastUpdated: row.mims_last_updated,
          createdAt: row.created_at,
        },
      }));

      set({ medications: formatted, isLoading: false });
    } catch (error) {
      console.error('Error loading medications:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadTodayDoses: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const today = new Date().toISOString().split('T')[0];

      const doses = await db.getAllAsync<any>(`
        SELECT
          d.id AS dose_id,
          d.medication_id,
          d.scheduled_time,
          d.actual_time,
          d.status,
          d.notes AS dose_notes,
          d.created_at AS dose_created_at,
          m.id AS medication_id_real,
          m.mims_id,
          m.user_dosage,
          m.frequency,
          m.times,
          m.with_food,
          m.start_date,
          m.end_date,
          m.refill_date,
          m.is_active,
          m.notes AS medication_notes,
          m.created_at AS medication_created_at,
          m.updated_at AS medication_updated_at,
          mc.generic_name,
          mc.brand_name,
          mc.strength,
          mc.dosage_form,
          mc.food_instructions,
          mc.last_updated AS mims_last_updated
        FROM doses d
        JOIN medications m ON d.medication_id = m.id
        JOIN mims_cache mc ON m.mims_id = mc.id
        WHERE DATE(d.scheduled_time) = ?
        ORDER BY d.scheduled_time ASC
      `, [today]);

      const formatted: DoseWithMedication[] = doses.map((row) => ({
        id: row.dose_id,
        medicationId: row.medication_id,
        scheduledTime: row.scheduled_time,
        actualTime: row.actual_time,
        status: row.status as DoseStatus,
        notes: row.dose_notes,
        createdAt: row.dose_created_at,
        medication: {
          id: row.medication_id,
          mimsId: row.mims_id,
          userDosage: row.user_dosage,
          frequency: row.frequency,
          times: JSON.parse(row.times),
          withFood: row.with_food,
          startDate: row.start_date,
          endDate: row.end_date,
          refillDate: row.refill_date,
          isActive: row.is_active === 1,
          notes: row.medication_notes,
          createdAt: row.medication_created_at,
          updatedAt: row.medication_updated_at,
          mims: {
            id: row.mims_id,
            genericName: row.generic_name,
            brandName: row.brand_name,
            strength: row.strength,
            dosageForm: row.dosage_form,
            foodInstructions: row.food_instructions,
            source: 'MIMS',
            lastUpdated: row.mims_last_updated || new Date().toISOString(),
            createdAt: row.medication_created_at,
          },
        },
      }));

      set({ todayDoses: formatted, isLoading: false });
    } catch (error) {
      console.error('Error loading today doses:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadWeekDoses: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const doses = await db.getAllAsync<any>(`
        SELECT
          d.id AS dose_id,
          d.medication_id,
          d.scheduled_time,
          d.actual_time,
          d.status,
          d.notes AS dose_notes,
          d.created_at AS dose_created_at,
          m.id AS medication_id_real,
          m.mims_id,
          m.user_dosage,
          m.frequency,
          m.times,
          m.with_food,
          m.start_date,
          m.end_date,
          m.refill_date,
          m.is_active,
          m.notes AS medication_notes,
          m.created_at AS medication_created_at,
          m.updated_at AS medication_updated_at,
          mc.generic_name,
          mc.brand_name,
          mc.strength,
          mc.dosage_form,
          mc.food_instructions,
          mc.last_updated AS mims_last_updated
        FROM doses d
        JOIN medications m ON d.medication_id = m.id
        JOIN mims_cache mc ON m.mims_id = mc.id
        WHERE DATE(d.scheduled_time) BETWEEN ? AND ?
        ORDER BY d.scheduled_time ASC
      `, [start, end]);

      const formatted: DoseWithMedication[] = doses.map((row) => ({
        id: row.dose_id,
        medicationId: row.medication_id,
        scheduledTime: row.scheduled_time,
        actualTime: row.actual_time,
        status: row.status as DoseStatus,
        notes: row.dose_notes,
        createdAt: row.dose_created_at,
        medication: {
          id: row.medication_id,
          mimsId: row.mims_id,
          userDosage: row.user_dosage,
          frequency: row.frequency,
          times: JSON.parse(row.times),
          withFood: row.with_food,
          startDate: row.start_date,
          endDate: row.end_date,
          refillDate: row.refill_date,
          isActive: row.is_active === 1,
          notes: row.medication_notes,
          createdAt: row.medication_created_at,
          updatedAt: row.medication_updated_at,
          mims: {
            id: row.mims_id,
            genericName: row.generic_name,
            brandName: row.brand_name,
            strength: row.strength,
            dosageForm: row.dosage_form,
            foodInstructions: row.food_instructions,
            source: 'MIMS',
            lastUpdated: row.mims_last_updated || new Date().toISOString(),
            createdAt: row.medication_created_at,
          },
        },
      }));

      set({ todayDoses: formatted, isLoading: false });
    } catch (error) {
      console.error('Error loading week doses:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addMedication: async (medication) => {
    try {
      const db = getDatabase();
      const id = `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Optimistic update: reload from database to get MIMS data
      // (We need the JOIN data, so a full reload is necessary here)
      await db.runAsync(
        `INSERT INTO medications (
          id, mims_id, user_dosage, frequency, times, with_food,
          start_date, end_date, refill_date, is_active, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          medication.mimsId,
          medication.userDosage,
          medication.frequency,
          JSON.stringify(medication.times),
          medication.withFood,
          medication.startDate,
          medication.endDate || null,
          medication.refillDate || null,
          medication.isActive ? 1 : 0,
          medication.notes || null,
          now,
          now,
        ]
      );

      // Reload only medications (no loading state flicker)
      await get().loadMedications();
      try { await logEvent(EventType.MedicationAdded); } catch {}
      return id;
    } catch (error) {
      console.error('Error adding medication:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateMedication: async (id, updates) => {
    // Optimistically update the state immediately
    const currentMedications = get().medications;
    const index = currentMedications.findIndex((med) => med.id === id);

    if (index !== -1) {
      const updatedMedications = [...currentMedications];
      updatedMedications[index] = {
        ...updatedMedications[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      set({ medications: updatedMedications });
    }

    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      // Build dynamic update query (ignore undefined fields)
      const definedEntries = Object.entries(updates).filter(([, v]) => v !== undefined);
      const fields = definedEntries.map(([k]) => k);
      const setClause = fields
        .map((field) => {
          // Convert camelCase to snake_case
          const snakeField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          return `${snakeField} = ?`;
        })
        .join(', ');

      const values = fields.map((field) => {
        const value = (updates as any)[field as keyof Medication];
        if (field === 'times') return JSON.stringify(value);
        if (typeof value === 'boolean') return value ? 1 : 0;
        return value ?? null;
      });

      await db.runAsync(
        `UPDATE medications SET ${setClause}, updated_at = ? WHERE id = ?`,
        [...values, now, id]
      );
    } catch (error) {
      console.error('Error updating medication:', error);
      set({ error: (error as Error).message });
      // Rollback: reload from database on error
      await get().loadMedications();
    }
  },

  deleteMedication: async (id) => {
    // Optimistically remove from state immediately
    const currentMedications = get().medications;
    const updatedMedications = currentMedications.filter((med) => med.id !== id);
    set({ medications: updatedMedications });

    try {
      const db = getDatabase();

      // Soft delete (set is_active to 0)
      await db.runAsync(
        'UPDATE medications SET is_active = 0, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
    } catch (error) {
      console.error('Error deleting medication:', error);
      set({ error: (error as Error).message });
      // Rollback: reload from database on error
      await get().loadMedications();
    }
  },

  markDose: async (doseId, status, actualTime) => {
    console.log('medicationStore.markDose called:', { doseId, status, actualTime });
    
    // Optimistically update the dose status in state immediately
    const currentDoses = get().todayDoses;
    const index = currentDoses.findIndex((dose) => dose.id === doseId);
    const time = actualTime || new Date().toISOString();

    console.log('Current doses count:', currentDoses.length, 'Found index:', index);

    if (index !== -1) {
      const updatedDoses = [...currentDoses];
      updatedDoses[index] = {
        ...updatedDoses[index],
        status,
        actualTime: time,
      };
      set({ todayDoses: updatedDoses });
      console.log('Optimistic update applied');
    } else {
      console.warn('Dose not found in current state:', doseId);
    }

    try {
      const db = getDatabase();

      const result = await db.runAsync(
        'UPDATE doses SET status = ?, actual_time = ? WHERE id = ?',
        [status, time, doseId]
      );

      console.log('Database update result:', result);

      try { await logEvent(EventType.DoseLogged, { status }); } catch {}
    } catch (error) {
      console.error('Error marking dose in database:', error);
      set({ error: (error as Error).message });
      // Rollback: reload from database on error
      await get().loadTodayDoses();
    }
  },

  getMedicationById: (id) => {
    return get().medications.find((med) => med.id === id);
  },
}));
