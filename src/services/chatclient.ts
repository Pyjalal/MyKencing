import axios from "axios";
import { Message } from "../types";
import { useSettingsStore } from "../stores/settingsStore";
import { useVitalsStore } from "../stores/vitalsStore";
import { useMedicationStore } from "../stores/medicationStore";

/**
 * Parse vitals from store and return structured vitals object
 * Returns object with latest readings for each vital type
 */
function parseVitalsFromStore(): any {
  const vitals = useVitalsStore.getState().vitals;
  if (!vitals || vitals.length === 0) return null;

  const latestByType: Record<string, any> = {};
  for (const v of vitals) {
    const t = (v as any).type as string;
    if (!latestByType[t]) latestByType[t] = v;
  }

  const vitalsObj: any = {};

  if (latestByType['blood_pressure']) {
    const bp = latestByType['blood_pressure'];
    vitalsObj.bloodPressure = {
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      unit: bp.unit,
      measuredAt: bp.measuredAt,
    };
  }

  if (latestByType['weight']) {
    const w = latestByType['weight'];
    vitalsObj.weight = {
      value: w.value,
      unit: w.unit || 'kg',
      measuredAt: w.measuredAt,
    };
  }

  if (latestByType['glucose']) {
    const g = latestByType['glucose'];
    vitalsObj.glucose = {
      value: g.value,
      unit: g.unit,
      measuredAt: g.measuredAt,
    };
  }

  if (latestByType['waist_circumference']) {
    const wc = latestByType['waist_circumference'];
    vitalsObj.waistCircumference = {
      value: wc.value,
      unit: wc.unit || 'cm',
      measuredAt: wc.measuredAt,
    };
  }

  if (latestByType['total_cholesterol'] || latestByType['hdl_cholesterol']) {
    vitalsObj.cholesterol = {};
    if (latestByType['total_cholesterol']) {
      vitalsObj.cholesterol.total = {
        value: latestByType['total_cholesterol'].value,
        unit: latestByType['total_cholesterol'].unit || 'mmol/L',
        measuredAt: latestByType['total_cholesterol'].measuredAt,
      };
    }
    if (latestByType['hdl_cholesterol']) {
      vitalsObj.cholesterol.hdl = {
        value: latestByType['hdl_cholesterol'].value,
        unit: latestByType['hdl_cholesterol'].unit || 'mmol/L',
        measuredAt: latestByType['hdl_cholesterol'].measuredAt,
      };
    }
  }

  return Object.keys(vitalsObj).length > 0 ? vitalsObj : null;
}

/**
 * Parse medications from store and return structured medications object/array
 * Returns simplified medication objects with regno, dosage, and frequency
 */
function parseMedicationsFromStore(): any {
  const weekDoses = useMedicationStore.getState().weekDoses;
  if (!weekDoses || weekDoses.length === 0) return null;

  const medsMap = new Map<string, { regno: string; dosage?: string; frequency?: number }>();
  for (const d of weekDoses) {
    const med = (d as any).medication;
    if (med && med.registrationNo) {
      if (!medsMap.has(med.registrationNo)) {
        medsMap.set(med.registrationNo, {
          regno: med.registrationNo,
          dosage: med.userDosage || undefined,
          frequency: med.frequency || undefined,
        });
      }
    }
  }

  const meds = Array.from(medsMap.values());
  // If only one medication, send as object, otherwise array
  return meds.length > 0 ? (meds.length === 1 ? meds[0] : meds) : null;
}

export async function sendMessage(history: Message[], sendVitals: boolean = false, sendMeds: boolean = false) {
  // Get the current language setting from the store
  const { settings } = useSettingsStore.getState();
  const language = settings.language || "en";

  const payload: any = {
    history,
    language,
  };

  // Build context data based on flags
  const contextData: any = {};

  if (sendVitals) {
    const vitalsData = parseVitalsFromStore();
    if (vitalsData) {
      contextData.vitals = vitalsData;
    }
  }

  if (sendMeds) {
    const medsData = parseMedicationsFromStore();
    if (medsData) {
      contextData.medication = medsData;
    }
  }

  // Include context if any data was collected
  if (Object.keys(contextData).length > 0) {
    payload.context = JSON.stringify(contextData);
  }

//   console.log('Payload sent to chatbot API:', payload);

  const res = await axios.post("https://mymedix-chatbot.fly.dev/ask", payload);
//   const res = await axios.post("https://localhost:4444/ask", payload);

  return res.data.answer;
}
