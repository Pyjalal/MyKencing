/**
 * Named Entity Recognition for prescriptions (English + Malay)
 * Extracts medication entities from OCR text.
 */

import { ExtractedMedicine } from '../types';

const STRENGTH_PATTERN = /(\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units?))/i;
const DOSAGE_FORM_PATTERN = /(tablet|tablets|capsule|capsules|pil|kapsul|sirap|syrup|suspension)/i;
const DOSAGE_PATTERN = /(\d+\s?(?:tablet|tablets|capsule|capsules|pil|kapsul|tsp|teaspoon))/i;

const FREQUENCY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(od|once daily|once a day|sekali sehari)\b/i, '1'],
  [/\b(bd|twice daily|twice a day|dua kali sehari)\b/i, '2'],
  [/\b(tds|three times daily|three times a day|tiga kali sehari)\b/i, '3'],
  [/\b(qid|four times daily|four times a day|empat kali sehari)\b/i, '4'],
  [/\b(prn|as needed|bila perlu)\b/i, 'as needed'],
];

const FOOD_PATTERNS = [
  /with food|selepas makan/i,
  /after food|selepas makan/i,
  /before food|sebelum makan/i,
  /empty stomach|perut kosong/i,
];

/**
 * Heuristic to extract lines that look like medication entries.
 */
function isLikelyMedicineLine(line: string): boolean {
  return (
    /([A-Z][a-z]+\s?){1,3}/.test(line) || // Capitalized words
    STRENGTH_PATTERN.test(line) ||
    DOSAGE_FORM_PATTERN.test(line)
  );
}

export function parsePrescriptionText(text: string): ExtractedMedicine[] {
  const lines = text
    .split(/\r?\n|\r|\u2028|\u2029/) // split on newlines and unicode separators
    .map(l => l.trim())
    .filter(l => l.length > 0 && isLikelyMedicineLine(l));

  const extracted: ExtractedMedicine[] = [];

  for (const line of lines) {
    // Name: take first 1-3 capitalized words at start of line
    const nameMatch = line.match(/^([A-Z][A-Za-z\-]{2,}(?:\s+[A-Z][A-Za-z\-]{2,}){0,2})/);
    const name = nameMatch?.[1];

    const strength = line.match(STRENGTH_PATTERN)?.[1];
    const dosageForm = line.match(DOSAGE_FORM_PATTERN)?.[1];
    const dosage = line.match(DOSAGE_PATTERN)?.[1] || strength;

    let frequency: string | undefined;
    for (const [re, freq] of FREQUENCY_PATTERNS) {
      if (re.test(line)) {
        frequency = freq;
        break;
      }
    }

    // Simple confidence heuristic
    let confidence = 0.5;
    if (name) confidence += 0.2;
    if (strength || dosage) confidence += 0.15;
    if (frequency) confidence += 0.1;
    if (dosageForm) confidence += 0.05;
    confidence = Math.min(confidence, 0.95);

    if (name) {
      extracted.push({ name, strength, dosageForm, dosage, frequency, confidence });
    }
  }

  // Deduplicate by name+strength
  const unique: ExtractedMedicine[] = [];
  const seen = new Set<string>();
  for (const med of extracted) {
    const key = `${med.name}|${med.strength || ''}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(med);
    }
  }

  return unique;
}
