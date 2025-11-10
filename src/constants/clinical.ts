// ============================================================================
// Clinical Thresholds and Reference Values
// Source: Malaysian Clinical Practice Guidelines, WHO Guidelines
// ============================================================================

import { VitalType, Threshold } from '../types';

/**
 * Blood Pressure Thresholds (mmHg)
 * Reference: Malaysian CPG on Hypertension (2018)
 */
export const BLOOD_PRESSURE_THRESHOLDS: Threshold = {
  type: VitalType.BloodPressure,

  // Normal: <120/80
  minNormal: 90,
  maxNormal: 120, // systolic

  // Pre-hypertension / Elevated: 120-139 / 80-89
  minWarning: 120,
  maxWarning: 139,

  // Hypertension Stage 1: 140-159 / 90-99
  // Hypertension Stage 2: ≥160 / ≥100
  minCritical: 180, // Hypertensive crisis
  maxCritical: 999,

  unit: 'mmHg',
};

/**
 * Diastolic BP separate thresholds
 */
export const DIASTOLIC_BP_THRESHOLDS = {
  normal: 80,
  warning: 89,
  critical: 120,
};

/**
 * Blood Glucose Thresholds (mmol/L)
 * Reference: Malaysian CPG on Type 2 Diabetes Mellitus (2020)
 */
export const GLUCOSE_THRESHOLDS_MMOL: Threshold = {
  type: VitalType.Glucose,

  // Normal fasting: <5.6 mmol/L
  minNormal: 3.9,
  maxNormal: 5.6,

  // Pre-diabetes (IFG): 5.6-6.9 mmol/L
  minWarning: 5.6,
  maxWarning: 6.9,

  // Diabetes: ≥7.0 mmol/L (fasting)
  minCritical: 7.0,
  maxCritical: 15.0, // Seek immediate care

  unit: 'mmol/L',
};

/**
 * Blood Glucose Thresholds (mg/dL)
 * For users who prefer mg/dL
 */
export const GLUCOSE_THRESHOLDS_MGDL: Threshold = {
  type: VitalType.Glucose,

  // Normal fasting: <100 mg/dL
  minNormal: 70,
  maxNormal: 100,

  // Pre-diabetes (IFG): 100-125 mg/dL
  minWarning: 100,
  maxWarning: 125,

  // Diabetes: ≥126 mg/dL (fasting)
  minCritical: 126,
  maxCritical: 270, // Seek immediate care

  unit: 'mg/dL',
};

/**
 * Total Cholesterol Thresholds (mmol/L)
 * Reference: Malaysian CPG on Management of Dyslipidaemia
 */
export const TOTAL_CHOLESTEROL_THRESHOLDS: Threshold = {
  type: VitalType.TotalCholesterol,
  minNormal: 0,
  maxNormal: 5.2,
  minWarning: 5.2,
  maxWarning: 6.2,
  minCritical: 6.2,
  maxCritical: 10,
  unit: 'mmol/L',
};

/**
 * HDL Cholesterol Thresholds (mmol/L)
 * Reference: Malaysian CPG on Management of Dyslipidaemia
 */
export const HDL_CHOLESTEROL_THRESHOLDS: Threshold = {
  type: VitalType.HDLCholesterol,
  minNormal: 1.0,
  maxNormal: 1.55,
  minWarning: 0.9,
  maxWarning: 1.0,
  minCritical: 0,
  maxCritical: 0.9,
  unit: 'mmol/L',
};

/**
 * BMI Thresholds (kg/m²)
 * Reference: WHO for Asian populations
 */
export const BMI_THRESHOLDS = {
  underweight: 18.5,
  normal: 23.0, // Asian cutoff
  overweight: 27.5, // Asian cutoff
  obese: 30.0,
};

/**
 * Waist Circumference Thresholds (cm)
 * Reference: WHO Asian-specific cutoffs
 */
export const WAIST_CIRCUMFERENCE_THRESHOLDS = {
  male: {
    normal: 90,
    warning: 90,
  },
  female: {
    normal: 80,
    warning: 80,
  },
};

/**
 * HbA1c Thresholds (%)
 * Reference: Malaysian CPG on Type 2 Diabetes Mellitus
 */
export const HBA1C_THRESHOLDS = {
  normal: 5.7,
  preDiabetes: 6.4,
  diabetes: 6.5,
  target: 7.0, // For most diabetics
};

/**
 * Risk Assessment Scoring
 * Simple point-based system for pre-diabetes risk
 */
export const RISK_SCORING = {
  age: {
    '<35': 0,
    '35-44': 1,
    '45-54': 2,
    '55-64': 3,
    '65+': 4,
  },
  bmi: {
    '<23': 0,
    '23-27.5': 1,
    '>27.5': 2,
  },
  waistCircumference: {
    normal: 0,
    elevated: 1,
  },
  familyHistory: {
    no: 0,
    yes: 2,
  },
  physicalActivity: {
    high: 0,
    moderate: 1,
    low: 2,
  },
  bloodPressure: {
    normal: 0,
    elevated: 1,
  },
  fastingGlucose: {
    normal: 0,
    preDiabetes: 2,
    diabetes: 4,
  },
};

/**
 * Risk tier thresholds (total score)
 */
export const RISK_TIER_THRESHOLDS = {
  low: 4, // 0-4 points
  moderate: 8, // 5-8 points
  high: 12, // 9-12 points
  veryHigh: 13, // 13+ points
};

/**
 * Medication timing recommendations
 */
export const MEDICATION_TIMING = {
  morning: '08:00',
  noon: '12:00',
  evening: '18:00',
  night: '22:00',

  // Common schedules
  onceDailyMorning: ['08:00'],
  onceDailyNight: ['22:00'],
  twiceDaily: ['08:00', '20:00'],
  threeTimesDaily: ['08:00', '14:00', '20:00'],
  fourTimesDaily: ['08:00', '12:00', '16:00', '20:00'],
};

/**
 * Missed dose guidance thresholds (hours)
 */
export const MISSED_DOSE_WINDOW = {
  takeLateWindow: 2, // Take if <2h late
  skipAndWaitWindow: 4, // Skip if >4h late and next dose soon
};

/**
 * Clinical disclaimers
 */
export const DISCLAIMERS = {
  general: 'MyKencing is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor or pharmacist.',

  vitals: 'These readings are for tracking purposes only. Consult your healthcare provider for medical interpretation.',

  riskAssessment: 'This assessment provides general guidance only and does not diagnose any condition. Consult a healthcare professional for proper evaluation.',

  adherence: 'This report is for your doctor to review your medication adherence. It is not a medical diagnosis.',

  mims: 'Medicine information sourced from MIMS Malaysia. Last updated: [DATE]. Always follow your doctor\'s instructions.',
};

/**
 * Action thresholds for vitals
 */
export const ACTION_THRESHOLDS = {
  bloodPressure: {
    urgentCare: { systolic: 180, diastolic: 120 },
    scheduleVisit: { systolic: 140, diastolic: 90 },
    monitor: { systolic: 120, diastolic: 80 },
  },

  glucose: {
    urgentCare: { fasting: 15.0, random: 20.0 }, // mmol/L
    scheduleVisit: { fasting: 7.0, random: 11.1 },
    monitor: { fasting: 5.6, random: 7.8 },
  },
};

/**
 * Conversion factors
 */
export const CONVERSIONS = {
  glucoseMmolToMgdl: 18.018,
  glucoseMgdlToMmol: 0.0555,
  kgToLb: 2.20462,
  lbToKg: 0.453592,
};
