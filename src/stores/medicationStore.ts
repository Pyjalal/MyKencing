import { create } from 'zustand';
import { Medication, MedicationWithDetails, Dose, DoseWithMedication, DoseStatus } from '../types';
import { getDatabase } from '../services/database';
import { logEvent, EventType } from '../services/analytics';
import { getCachedMedicineDetails } from '../services/medicineCache';

// Database row types
interface MedicationRow {
  id: string;
  mims_id: string;
  registration_no: string;
  user_dosage: string;
  frequency: number;
  times: string;
  with_food: number;
  start_date: string;
  end_date?: string;
  refill_date?: string;
  is_active: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DoseRow {
  dose_id: string;
  dose_created_at: string;
  medication_id: string;
  medication_id_real: string;
  scheduled_time: string;
  actual_time?: string;
  status: string;
  dose_notes?: string;
  registration_no: string;
  user_dosage: string;
  frequency: number;
  times: string;
  with_food: number;
  start_date: string;
  end_date?: string;
  refill_date?: string;
  is_active: number;
  medication_notes?: string;
  medication_created_at: string;
  medication_updated_at: string;
}

interface MedicationState {
  medications: MedicationWithDetails[];
  todayDoses: DoseWithMedication[];
  weekDoses: DoseWithMedication[];
  isLoading: boolean;
  error: string | null;
  lastLoadTime: number | null;

  // Actions
  loadMedications: () => Promise<void>;
  loadTodayDoses: () => Promise<void>;
  loadWeekDoses: (startDate: Date, endDate: Date) => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMedication: (id: string, medication: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  markDose: (doseId: string, status: DoseStatus, actualTime?: string) => Promise<void>;
  getMedicationById: (id: string) => MedicationWithDetails | undefined;
  generateDosesForMedication: (medicationId: string, times: string[], startDateStr: string, endDateStr?: string) => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayDoses: [],
  weekDoses: [],
  isLoading: false,
  error: null,
  lastLoadTime: null,

  loadMedications: async () => {
    const state = get();
    const now = Date.now();

    // Prevent duplicate simultaneous calls
    if (state.isLoading) {
      console.log('[medicationStore] Load already in progress, skipping duplicate call');
      return;
    }

    // Use cached data if loaded recently (within 5 seconds)
    if (state.lastLoadTime && now - state.lastLoadTime < 5000) {
      console.log('[medicationStore] Using recently loaded data from cache');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();

      const medications = await db.getAllAsync(`
        SELECT m.*
        FROM medications m
        WHERE m.is_active = 1
        ORDER BY m.created_at DESC
      `) as MedicationRow[];

      // Fetch medicine details from API for each medication
      const formatted: MedicationWithDetails[] = await Promise.all(
        medications.map(async (row) => {
          let mimsData: any = {
            id: row.registration_no,
            genericName: 'Loading...',
            brandName: 'Unknown Medicine',
            source: 'PNF',
            lastUpdated: new Date().toISOString(),
            createdAt: row.created_at,
            activeIngredients: [],
          };

          // Try to fetch medicine details from API with caching
          if (row.registration_no) {
            try {
              const medicineDetails = await getCachedMedicineDetails(row.registration_no);
              if (medicineDetails) {
                mimsData = medicineDetails;
              }
            } catch (apiError) {
              console.warn(`Failed to fetch medicine details for ${row.registration_no}:`, apiError);
              // Use fallback data
              mimsData.genericName = row.registration_no;
              mimsData.brandName = 'Medicine details unavailable';
            }
          }

          return {
            id: row.id,
            registrationNo: row.registration_no,
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
            mims: mimsData,
          };
        })
      );

      set({ medications: formatted, isLoading: false, lastLoadTime: now });
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

      const doses = await db.getAllAsync(`
        SELECT
          d.id AS dose_id,
          d.medication_id,
          d.scheduled_time,
          d.actual_time,
          d.status,
          d.notes AS dose_notes,
          d.created_at AS dose_created_at,
          m.id AS medication_id_real,
          m.registration_no,
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
          m.updated_at AS medication_updated_at
        FROM doses d
        JOIN medications m ON d.medication_id = m.id
        WHERE DATE(d.scheduled_time) = ?
        ORDER BY d.scheduled_time ASC
      `, [today]) as DoseRow[];

      // Fetch medicine details from API for each unique medication
      const uniqueRegistrationNos = [...new Set(doses.map(d => d.registration_no).filter(Boolean))];
      const medicineDetailsMap = new Map<string, any>();

      await Promise.all(
        uniqueRegistrationNos.map(async (regNo) => {
          try {
            const details = await getCachedMedicineDetails(regNo);
            if (details) {
              medicineDetailsMap.set(regNo, details);
            }
          } catch (error) {
            console.warn(`Failed to fetch medicine details for ${regNo}:`, error);
          }
        })
      );

      const formatted: DoseWithMedication[] = doses.map((row) => {
        const medicineDetails = medicineDetailsMap.get(row.registration_no) || {
          id: row.registration_no,
          genericName: row.registration_no || 'Unknown',
          brandName: 'Medicine details unavailable',
          source: 'PNF',
          lastUpdated: new Date().toISOString(),
          createdAt: row.medication_created_at,
          activeIngredients: [],
        };

        return {
          id: row.dose_id,
          medicationId: row.medication_id,
          scheduledTime: row.scheduled_time,
          actualTime: row.actual_time,
          status: row.status as DoseStatus,
          notes: row.dose_notes,
          createdAt: row.dose_created_at,
          medication: {
            id: row.medication_id,
            registrationNo: row.registration_no,
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
            mims: medicineDetails,
          },
        };
      });

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

      const doses = await db.getAllAsync(`
        SELECT
          d.id AS dose_id,
          d.medication_id,
          d.scheduled_time,
          d.actual_time,
          d.status,
          d.notes AS dose_notes,
          d.created_at AS dose_created_at,
          m.id AS medication_id_real,
          m.registration_no,
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
          m.updated_at AS medication_updated_at
        FROM doses d
        JOIN medications m ON d.medication_id = m.id
        WHERE DATE(d.scheduled_time) BETWEEN ? AND ?
        ORDER BY d.scheduled_time ASC
      `, [start, end]) as DoseRow[];

      // Fetch medicine details from API for each unique medication
      const uniqueRegistrationNos = [...new Set(doses.map(d => d.registration_no).filter(Boolean))];
      const medicineDetailsMap = new Map<string, any>();

      await Promise.all(
        uniqueRegistrationNos.map(async (regNo) => {
          try {
            const details = await getCachedMedicineDetails(regNo);
            if (details) {
              medicineDetailsMap.set(regNo, details);
            }
          } catch (error) {
            console.warn(`Failed to fetch medicine details for ${regNo}:`, error);
          }
        })
      );

      const formatted: DoseWithMedication[] = doses.map((row) => {
        const medicineDetails = medicineDetailsMap.get(row.registration_no) || {
          id: row.registration_no,
          genericName: row.registration_no || 'Unknown',
          brandName: 'Medicine details unavailable',
          source: 'PNF',
          lastUpdated: new Date().toISOString(),
          createdAt: row.medication_created_at,
          activeIngredients: [],
        };

        return {
          id: row.dose_id,
          medicationId: row.medication_id,
          scheduledTime: row.scheduled_time,
          actualTime: row.actual_time,
          status: row.status as DoseStatus,
          notes: row.dose_notes,
          createdAt: row.dose_created_at,
          medication: {
            id: row.medication_id,
            registrationNo: row.registration_no,
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
            mims: medicineDetails,
          },
        };
      });

      set({ weekDoses: formatted, isLoading: false });
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

      await db.runAsync(
        `INSERT INTO medications (
          id, mims_id, registration_no, user_dosage, frequency, times, with_food,
          start_date, end_date, refill_date, is_active, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          (medication as any).registrationNo || `custom_${Date.now()}`, // For backward compatibility
          (medication as any).registrationNo || `custom_${Date.now()}`,
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

      // Generate doses for the next 30 days
      await get().generateDosesForMedication(id, medication.times, medication.startDate, medication.endDate);

      // Reload medications and doses
      await get().loadMedications();
      await get().loadTodayDoses();
      
      // Reload week doses for current view
      const today = new Date();
      const startOfWeekDate = new Date(today);
      startOfWeekDate.setDate(today.getDate() - today.getDay());
      const endOfWeekDate = new Date(startOfWeekDate);
      endOfWeekDate.setDate(startOfWeekDate.getDate() + 6);
      await get().loadWeekDoses(startOfWeekDate, endOfWeekDate);
      
      try { await logEvent(EventType.MedicationAdded); } catch {}
      return id;
    } catch (error) {
      console.error('Error adding medication:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  generateDosesForMedication: async (medicationId: string, times: string[], startDateStr: string, endDateStr?: string) => {
    try {
      const db = getDatabase();
      const startDate = new Date(startDateStr);
      const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      
      const dosesToInsert: any[] = [];
      
      // Generate doses for each day
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // For each scheduled time
        for (const time of times) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledDateTime = new Date(currentDate);
          scheduledDateTime.setHours(hours, minutes, 0, 0);
          
          // Only create doses for future or today
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          if (scheduledDateTime >= now) {
            const doseId = `dose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Determine status
            let status = 'upcoming';
            const nowTime = new Date();
            if (scheduledDateTime < nowTime) {
              status = 'pending';
            }
            
            dosesToInsert.push({
              id: doseId,
              medicationId,
              scheduledTime: scheduledDateTime.toISOString(),
              status,
            });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Insert all doses
      for (const dose of dosesToInsert) {
        await db.runAsync(
          `INSERT INTO doses (id, medication_id, scheduled_time, status, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [dose.id, dose.medicationId, dose.scheduledTime, dose.status, new Date().toISOString()]
        );
      }
      
      console.log(`Generated ${dosesToInsert.length} doses for medication ${medicationId}`);
    } catch (error) {
      console.error('Error generating doses:', error);
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
