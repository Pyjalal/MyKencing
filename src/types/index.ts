// ============================================================================
// Core Domain Types for MyKencing
// ============================================================================

// ----------------------------------------------------------------------------
// MIMS (Medicine Information Management System) Types
// ----------------------------------------------------------------------------

/**
 * MIMS medicine data cached locally
 * Source: MIMS Malaysia or PNF
 */
export interface MIMSMedicine {
  id: string;
  genericName: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string; // tablet, capsule, injection, etc.
  instructions?: string;
  timing?: string; // morning, evening, twice daily, etc.
  foodInstructions?: string; // with food, after food, empty stomach
  warnings?: string;
  sideEffects?: string;
  contraindications?: string;
  drugInteractions?: string;
  foodInteractions?: string; // e.g., avoid alcohol, grapefruit
  source: 'MIMS' | 'PNF';
  lastUpdated: string; // ISO date string
  createdAt: string;
}

/**
 * MIMS search result (for autocomplete/search)
 */
export interface MIMSSearchResult {
  id: string;
  genericName: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  confidence?: number; // 0-1, for OCR matches
}

// ----------------------------------------------------------------------------
// Medication Types
// ----------------------------------------------------------------------------

/**
 * Food timing options
 */
export enum FoodTiming {
  NoPreference = 0,
  WithFood = 1,
  AfterFood = 2,
  BeforeFood = 3,
  EmptyStomach = 4,
}

/**
 * User's active medication
 */
export interface Medication {
  id: string;
  mimsId: string;
  userDosage: string; // e.g., "1 tablet", "500mg"
  frequency: number; // times per day
  times: string[]; // array of time strings, e.g., ["08:00", "20:00"]
  withFood: FoodTiming;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  refillDate?: string; // ISO date
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Medication with MIMS data joined
 */
export interface MedicationWithDetails extends Medication {
  mims: MIMSMedicine;
}

// ----------------------------------------------------------------------------
// Dose/Adherence Types
// ----------------------------------------------------------------------------

/**
 * Dose status
 */
export enum DoseStatus {
  Pending = 'pending',
  Taken = 'taken',
  Skipped = 'skipped',
  Late = 'late',
  Missed = 'missed',
}

/**
 * Dose log entry (adherence tracking)
 */
export interface Dose {
  id: string;
  medicationId: string;
  scheduledTime: string; // ISO datetime
  actualTime?: string; // ISO datetime
  status: DoseStatus;
  notes?: string;
  createdAt: string;
}

/**
 * Dose with medication details
 */
export interface DoseWithMedication extends Dose {
  medication: MedicationWithDetails;
}

/**
 * Adherence summary for export/display
 */
export interface AdherenceSummary {
  medicationId: string;
  medicationName: string;
  totalScheduled: number;
  totalTaken: number;
  totalSkipped: number;
  totalMissed: number;
  adherenceRate: number; // percentage 0-100
  periodStart: string;
  periodEnd: string;
}

// ----------------------------------------------------------------------------
// Vitals Types
// ----------------------------------------------------------------------------

/**
 * Vital type
 */
export enum VitalType {
  BloodPressure = 'blood_pressure',
  Glucose = 'glucose',
  Weight = 'weight',
}

/**
 * Blood pressure reading
 */
export interface BloodPressureVital {
  id: string;
  type: VitalType.BloodPressure;
  systolic: number;
  diastolic: number;
  unit: 'mmHg';
  measuredAt: string; // ISO datetime
  notes?: string;
  createdAt: string;
}

/**
 * Glucose reading
 */
export interface GlucoseVital {
  id: string;
  type: VitalType.Glucose;
  value: number;
  unit: 'mmol/L' | 'mg/dL';
  measuredAt: string; // ISO datetime
  notes?: string;
  createdAt: string;
}

/**
 * Weight reading
 */
export interface WeightVital {
  id: string;
  type: VitalType.Weight;
  value: number;
  unit: 'kg' | 'lb';
  measuredAt: string; // ISO datetime
  notes?: string;
  createdAt: string;
}

/**
 * Union type for all vitals
 */
export type Vital = BloodPressureVital | GlucoseVital | WeightVital;

/**
 * Vitals trend data for charts
 */
export interface VitalTrend {
  date: string; // ISO date (YYYY-MM-DD)
  value: number; // for glucose/weight
  systolic?: number; // for BP
  diastolic?: number; // for BP
}

// ----------------------------------------------------------------------------
// Settings Types
// ----------------------------------------------------------------------------

/**
 * App settings
 */
export interface AppSettings {
  language: 'en' | 'ms' | 'zh'; // English, Malay, Chinese
  reminderEnabled: boolean;
  reminderSound: boolean;
  reminderVibrate: boolean;
  consentGiven: boolean;
  consentDate?: string;
  themeMode: 'light' | 'dark' | 'auto';
  glucoseUnit: 'mmol/L' | 'mg/dL';
  weightUnit: 'kg' | 'lb';
}

// ----------------------------------------------------------------------------
// Risk Assessment Types
// ----------------------------------------------------------------------------

/**
 * Risk assessment input
 */
export interface RiskAssessmentInput {
  age: number;
  gender: 'male' | 'female';
  bmi?: number;
  waistCircumference?: number; // cm
  familyHistory: boolean;
  fastingGlucose?: number; // mmol/L
  systolicBP?: number;
  diastolicBP?: number;
  physicalActivity: 'low' | 'moderate' | 'high';
  smoking: boolean;
}

/**
 * Risk tier
 */
export enum RiskTier {
  Low = 'low',
  Moderate = 'moderate',
  High = 'high',
  VeryHigh = 'very_high',
}

/**
 * Risk assessment result
 */
export interface RiskAssessmentResult {
  tier: RiskTier;
  score: number;
  rationale: string[];
  recommendations: string[];
  actionAdvice: string;
  sources: string[];
}

// ----------------------------------------------------------------------------
// OCR/NER Types
// ----------------------------------------------------------------------------

/**
 * OCR result from prescription scan
 */
export interface OCRResult {
  text: string;
  confidence: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * NER extracted medicine entity
 */
export interface ExtractedMedicine {
  name: string;
  strength?: string;
  dosageForm?: string;
  dosage?: string;
  frequency?: string;
  confidence: number;
}

// ----------------------------------------------------------------------------
// Export Types
// ----------------------------------------------------------------------------

/**
 * PDF export data
 */
export interface ExportData {
  generatedAt: string;
  patientName?: string;
  medications: MedicationWithDetails[];
  adherenceSummaries: AdherenceSummary[];
  recentVitals: {
    bloodPressure: BloodPressureVital[];
    glucose: GlucoseVital[];
    weight: WeightVital[];
  };
  periodStart: string;
  periodEnd: string;
}

// ----------------------------------------------------------------------------
// Navigation Types
// ----------------------------------------------------------------------------

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  AddMedicine: { scannedData?: ExtractedMedicine[] };
  MedicineDetail: { medicationId: string };
  ScanPrescription: undefined;
  Vitals: undefined;
  AddVital: { type: VitalType };
  RiskAssessment: undefined;
  Export: undefined;
  Settings: undefined;
};

// ----------------------------------------------------------------------------
// Utility Types
// ----------------------------------------------------------------------------

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Clinical threshold
 */
export interface Threshold {
  type: VitalType;
  minNormal?: number;
  maxNormal?: number;
  minWarning?: number;
  maxWarning?: number;
  minCritical?: number;
  maxCritical?: number;
  unit: string;
}
