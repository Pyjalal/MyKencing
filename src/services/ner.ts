/**
 * Named Entity Recognition for prescriptions (English + Malay)
 * Extracts potential medication entities from OCR text.
 * Uses minimal heuristics - let the API do the heavy lifting with fuzzy matching.
 */

import { ExtractedMedicine } from '../types';

const STRENGTH_PATTERN = /(\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units?))/i;
const DOSAGE_FORM_PATTERN = /(tablet|tablets|capsule|capsules|pil|kapsul|sirap|syrup|suspension|injection|cream|ointment)/i;
const DOSAGE_PATTERN = /(\d+\s?(?:tablet|tablets|capsule|capsules|pil|kapsul|tsp|teaspoon))/i;

const FREQUENCY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(od|once daily|once a day|sekali sehari)\b/i, '1'],
  [/\b(bd|twice daily|twice a day|dua kali sehari)\b/i, '2'],
  [/\b(tds|three times daily|three times a day|tiga kali sehari)\b/i, '3'],
  [/\b(qid|four times daily|four times a day|empat kali sehari)\b/i, '4'],
  [/\b(prn|as needed|bila perlu)\b/i, 'as needed'],
];

// Common non-medicine words to filter out
const STOP_WORDS = new Set([
  'patient', 'doctor', 'clinic', 'hospital', 'date', 'name', 'address',
  'take', 'times', 'daily', 'days', 'repeat', 'refill', 'prescription',
  'dr', 'mr', 'mrs', 'ms', 'total', 'quantity', 'sig', 'instructions'
]);

/**
 * Extract all potential medicine names from a line
 * Very permissive - let API fuzzy matching filter out false positives
 */
function extractMedicineNames(line: string): string[] {
  // Remove numbers and common units from start
  const cleaned = line.replace(/^\s*\d+[\.\)]\s*/, '');
  
  // Extract ALL word sequences (not just first 3!)
  // Match any sequence of letters/numbers/hyphens
  const words = cleaned.match(/[A-Za-z][A-Za-z0-9\-]+/g);
  
  if (!words) return [];
  
  const names: string[] = [];
  
  // Check each word individually
  for (const word of words) {
    if (word.length < 3) continue;
    if (STOP_WORDS.has(word.toLowerCase())) continue;
    names.push(word);
  }
  
  // Also try to extract multi-word combinations (up to 4 words)
  // This handles "Panadol Extra", "Vitamin D3", etc.
  const multiWordMatch = cleaned.match(/([A-Za-z][A-Za-z0-9\-]*(?:\s+[A-Za-z][A-Za-z0-9\-]*){0,3})/);
  if (multiWordMatch) {
    const multiWord = multiWordMatch[1].trim();
    const firstWord = multiWord.split(/\s+/)[0].toLowerCase();
    if (multiWord.length >= 3 && !STOP_WORDS.has(firstWord)) {
      names.push(multiWord);
    }
  }
  
  return names;
}

export function parsePrescriptionText(text: string): ExtractedMedicine[] {
  const lines = text
    .split(/\r?\n|\r|\u2028|\u2029/)
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const extracted: ExtractedMedicine[] = [];

  for (const line of lines) {
    // Extract ALL potential names from this line
    const names = extractMedicineNames(line);
    
    if (names.length === 0) continue;
    
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

    // Base confidence - let API matching adjust this
    let confidence = 0.6;
    if (strength || dosage) confidence += 0.15;
    if (frequency) confidence += 0.1;
    if (dosageForm) confidence += 0.1;
    confidence = Math.min(confidence, 0.95);

    // Create an entry for each potential name found
    for (const name of names) {
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
