import { Medication, MedicationWithDetails } from '../types';

/**
 * Adjusts a medication schedule for Ramadan using sahur/iftar times.
 * - Morning (06:00-12:00) -> Sahur time
 * - Evening (18:00-00:00) -> Iftar time
 * - Afternoon (12:00-18:00) -> Warn: consult doctor (no change)
 * - Multiple daily doses -> consolidate to [Sahur, Iftar]
 */
export function adjustMedicationForRamadan(
  medication: Medication,
  sahurTime: string,
  iftarTime: string
): Medication {
  const times = medication.times || [];
  // Consolidate to sahur + iftar if 2+ doses
  let newTimes: string[] = [];
  if (times.length >= 2) {
    newTimes = [sahurTime, iftarTime];
  } else if (times.length === 1) {
    const t = toMinutes(times[0]);
    if (t >= 360 && t < 720) {
      // 06:00-12:00 -> Sahur
      newTimes = [sahurTime];
    } else if (t >= 1080 || t < 120) {
      // 18:00-00:00 (and near-midnight) -> Iftar
      newTimes = [iftarTime];
    } else {
      // Afternoon 12:00-18:00 -> leave unchanged; UI should warn
      newTimes = [times[0]];
    }
  } else {
    newTimes = [sahurTime];
  }

  return {
    ...medication,
    times: newTimes,
  };
}

/** Restore original schedule from a stored map in settings (medicationId->times) */
export function restoreOriginalSchedule(
  medication: Medication,
  originalTimes: Record<string, string[]>
): Medication {
  const times = originalTimes[medication.id];
  if (!times) return medication;
  return { ...medication, times };
}

/** Get approximate Ramadan dates for a given Gregorian year (placeholder). */
export function getRamadanDates(year: number): { start: Date; end: Date } {
  // Placeholder: these shift yearly; integrate a Hijri library for accuracy.
  // Here we roughly set a 29-day period starting around March 10th for demonstration.
  const start = new Date(year, 2, 10); // March 10
  const end = new Date(start);
  end.setDate(start.getDate() + 29);
  return { start, end };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}
