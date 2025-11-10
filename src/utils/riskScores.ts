import { RiskFactorSettings, RiskCalculatorSettings } from '../types';
import { Colors } from '../constants/theme';

export type RiskScoreCategory = 'low' | 'moderate' | 'high' | 'very_high';

export interface RiskScoreResult {
  label: string;
  score: number;
  maxScore?: number;
  category: RiskScoreCategory;
  color: string;
  description: string;
}

export interface FindriscInputs {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bmi?: number | null;
  waistCircumference?: number | null;
  factors: RiskFactorSettings;
}

export interface FraminghamInputs {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bmi?: number | null;
  systolicBP?: number | null;
  smoking?: boolean;
  bpMedication?: boolean;
  historyHighGlucose?: boolean;
}

function getCategoryColor(category: RiskScoreCategory): string {
  switch (category) {
    case 'low':
      return Colors.status.success;
    case 'moderate':
      return Colors.status.warning;
    case 'high':
      return Colors.secondary.main;
    case 'very_high':
    default:
      return Colors.secondary.dark;
  }
}

export function calculateFindrisc(inputs: FindriscInputs): RiskScoreResult {
  const { age, gender, bmi, waistCircumference, factors } = inputs;

  let score = 0;

  if (age !== undefined) {
    if (age < 45) score += 0;
    else if (age <= 54) score += 2;
    else if (age <= 64) score += 3;
    else score += 4;
  }

  if (bmi !== undefined && bmi !== null) {
    if (bmi < 25) score += 0;
    else if (bmi < 30) score += 1;
    else score += 3;
  }

  if (waistCircumference !== undefined && waistCircumference !== null) {
    if (gender === 'male') {
      if (waistCircumference < 94) score += 0;
      else if (waistCircumference <= 102) score += 3;
      else score += 4;
    } else {
      if (waistCircumference < 80) score += 0;
      else if (waistCircumference <= 88) score += 3;
      else score += 4;
    }
  }

  if (!factors.physicalActivity) {
    score += 2;
  }

  if (!factors.vegetablesDaily) {
    score += 1;
  }

  if (factors.bpMedication) {
    score += 2;
  }

  if (factors.historyHighGlucose) {
    score += 5;
  }

  if (factors.familyHistory === 'extended') {
    score += 3;
  } else if (factors.familyHistory === 'immediate') {
    score += 5;
  }

  let category: RiskScoreCategory;
  if (score < 7) category = 'low';
  else if (score <= 11) category = 'moderate';
  else if (score <= 20) category = 'high';
  else category = 'very_high';

  const descriptions: Record<RiskScoreCategory, string> = {
    low: 'Very low probability of developing type 2 diabetes in the next 10 years.',
    moderate: 'Slightly elevated risk. Maintain healthy habits and monitor yearly.',
    high: 'High risk. Discuss prevention strategies with your healthcare provider.',
    very_high: 'Very high risk. Seek medical advice for further assessment.',
  };

  return {
    label: 'FINDRISC',
    score,
    maxScore: 26,
    category,
    color: getCategoryColor(category),
    description: descriptions[category],
  };
}

export function calculateFraminghamSimplified(inputs: FraminghamInputs): RiskScoreResult {
  const {
    age,
    gender,
    bmi,
    systolicBP,
    smoking,
    bpMedication,
    historyHighGlucose,
  } = inputs;

  let score = 0;

  if (age !== undefined) {
    if (age < 35) score += 0;
    else if (age < 45) score += 2;
    else if (age < 55) score += 5;
    else if (age < 65) score += 8;
    else score += 10;
  }

  if (gender === 'male') {
    score += 2;
  }

  if (bmi !== undefined && bmi !== null) {
    if (bmi >= 25 && bmi < 30) score += 1;
    else if (bmi >= 30 && bmi < 35) score += 3;
    else if (bmi >= 35) score += 4;
  }

  if (systolicBP !== undefined && systolicBP !== null) {
    if (systolicBP >= 140 && systolicBP < 160) score += 3;
    else if (systolicBP >= 160) score += 5;
  }

  if (smoking) {
    score += 4;
  }

  if (bpMedication) {
    score += 2;
  }

  if (historyHighGlucose) {
    score += 5;
  }

  let category: RiskScoreCategory;
  if (score <= 5) category = 'low';
  else if (score <= 10) category = 'moderate';
  else if (score <= 15) category = 'high';
  else category = 'very_high';

  const descriptions: Record<RiskScoreCategory, string> = {
    low: 'Estimated 10-year cardiovascular risk is low.',
    moderate: 'Moderate cardiovascular risk. Consider lifestyle optimisation.',
    high: 'High cardiovascular risk. Discuss preventive care with your doctor.',
    very_high: 'Very high cardiovascular risk. Seek medical guidance promptly.',
  };

  return {
    label: 'Framingham (simplified)',
    score,
    maxScore: 30,
    category,
    color: getCategoryColor(category),
    description: descriptions[category],
  };
}

export function updateCalculatorHistory(
  calculators: RiskCalculatorSettings | undefined,
  findriscScore?: number,
  framinghamScore?: number,
): RiskCalculatorSettings {
  const next: RiskCalculatorSettings = {
    findriscEnabled: calculators?.findriscEnabled ?? false,
    framinghamEnabled: calculators?.framinghamEnabled ?? false,
    lastFindriscScore: calculators?.lastFindriscScore,
    lastFraminghamScore: calculators?.lastFraminghamScore,
    lastUpdated: calculators?.lastUpdated,
  };

  const now = new Date().toISOString();

  if (findriscScore !== undefined) {
    next.lastFindriscScore = findriscScore;
    next.lastUpdated = now;
  }

  if (framinghamScore !== undefined) {
    next.lastFraminghamScore = framinghamScore;
    next.lastUpdated = now;
  }

  return next;
}

