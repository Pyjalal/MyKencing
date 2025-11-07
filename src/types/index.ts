// ============================================================================
// Core Domain Types for MyKencing
// ============================================================================

// ----------------------------------------------------------------------------
// MIMS (Medicine Information Management System) Types
// ----------------------------------------------------------------------------

/**
 * Medicine data from MyMedix API
 * Source: Malaysian Pharmaceutical Services Programme (via MyMedix API)
 */
export interface MIMSMedicine {
  id: string; // Registration number
  genericName: string; // Primary active ingredient
  brandName?: string; // Medicine name from API
  strength?: string; // Extracted from medicine name
  dosageForm?: string; // Extracted from medicine name (tablet, capsule, etc.)
  instructions?: string;
  timing?: string; // morning, evening, twice daily, etc.
  foodInstructions?: string; // with food, after food, empty stomach
  warnings?: string;
  sideEffects?: string;
  contraindications?: string;
  drugInteractions?: string;
  foodInteractions?: string; // e.g., avoid alcohol, grapefruit
  source: 'PNF'; // All from MyMedix API (Malaysian Pharmaceutical Services)
  lastUpdated: string; // ISO date string
  createdAt: string;
  activeIngredients: string[]; // From MyMedix API
}

/**
 * Medicine search result from API (for autocomplete/search)
 */
export interface MIMSSearchResult {
  id: string; // Registration number
  genericName: string; // Primary active ingredient
  brandName?: string; // Medicine name from API
  strength?: string; // Extracted from medicine name
  dosageForm?: string; // Extracted from medicine name
  confidence?: number; // 0-1, for OCR matches
  activeIngredients: string[]; // From MyMedix API
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
  registrationNo: string; // Malaysian medicine registration number (e.g., MAL12345678A)
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
  Upcoming = 'upcoming',
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

/**
 * Missed dose guidance
 */
export type DoseGuidance = {
  action: 'take_now' | 'adjust' | 'skip';
  message: string;
};

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
  language: 'en' | 'ms' | 'zh' | 'ta'; // English, Malay, Chinese, Tamil
  reminderEnabled: boolean;
  reminderSound: boolean;
  reminderVibrate: boolean;
  consentGiven: boolean;
  consentDate?: string;
  themeMode: 'light' | 'dark' | 'auto';
  glucoseUnit: 'mmol/L' | 'mg/dL';
  weightUnit: 'kg' | 'lb';
  ramadan?: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    sahurTime?: string; // HH:mm
    iftarTime?: string; // HH:mm
    originalTimes?: Record<string, string[]>; // medicationId -> times
  };
  // Onboarding data
  onboardingCompleted: boolean;
  userAge?: number;
  userGender?: 'male' | 'female' | 'other';
  userWeight?: number;
  userGoal?: 'get_fit' | 'be_active' | 'be_healthy' | 'find_balance';
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
  apiMatches?: MIMSSearchResult[]; // API search results that match this extracted medicine
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
  PrivacyConsent: undefined;
  Home: undefined | { screen: string; params?: any };
  MedicationList: undefined;
  AddMedicine: { scannedData?: ExtractedMedicine[]; selectedMedicine?: MIMSSearchResult };
  MedicineDetail: { medicationId: string };
  ScanPrescription: undefined;
  SelectScannedMedicine: { extractedMedicines: ExtractedMedicine[] };
  Vitals: undefined;
  AddVital: { type: VitalType };
  RiskAssessment: undefined;
  Export: undefined;
  Settings: undefined;
  Analytics: undefined;
  RamadanMode: undefined;
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
