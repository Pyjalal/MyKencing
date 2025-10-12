/**
 * OCR Service for Prescription Scanning
 * Uses expo-camera and text recognition for extracting medication information
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { ExtractedMedicine } from '../types';
import { parsePrescriptionText } from './ner';
import { searchMIMS } from './mims';
import { similarity } from '../utils/fuzzyMatch';
import { logEvent, EventType } from './analytics';

/**
 * Process image for better OCR results
 */
async function preprocessImage(imageUri: string): Promise<string> {
  try {
    // Enhance image: resize, increase contrast
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1200 } }, // Resize for optimal OCR
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return manipulated.uri;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return imageUri;
  }
}

/**
 * Extract medication names from text using regex patterns
 */
function extractMedicineNames(text: string): string[] {
  const medicines: string[] = [];

  // Common medication patterns (capitalized words followed by dosage)
  const medicinePattern = /([A-Z][a-z]+(?:-[A-Z][a-z]+)*)\s*(?:\d+\s*(?:mg|ml|mcg|g|IU))?/g;
  const matches = [...text.matchAll(medicinePattern)];

  matches.forEach(match => {
    const name = match[1];
    // Filter out common non-medicine words
    const stopWords = ['Take', 'Patient', 'Doctor', 'Clinic', 'Hospital', 'Date', 'Name'];
    if (!stopWords.includes(name) && name.length > 3) {
      medicines.push(name);
    }
  });

  return [...new Set(medicines)]; // Remove duplicates
}

/**
 * Extract dosages from text
 */
function extractDosages(text: string): string[] {
  const dosagePattern = /(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|IU|tablet|capsule|teaspoon))/gi;
  const matches = [...text.matchAll(dosagePattern)];
  return matches.map(m => m[1]);
}

/**
 * Extract frequencies from text
 */
function extractFrequencies(text: string): string[] {
  const frequencies: string[] = [];

  const patterns: Record<string, string> = {
    'OD': '1',
    'once daily': '1',
    'once a day': '1',
    'BD': '2',
    'twice daily': '2',
    'twice a day': '2',
    'TDS': '3',
    'three times': '3',
    'QID': '4',
    'four times': '4',
    'PRN': 'as needed',
  };

  const textLower = text.toLowerCase();

  for (const [pattern, freq] of Object.entries(patterns)) {
    if (textLower.includes(pattern.toLowerCase())) {
      frequencies.push(freq);
    }
  }

  return frequencies;
}

/**
 * Extract food instructions from text
 */
function extractFoodInstructions(text: string): string[] {
  const instructions: string[] = [];

  const patterns = [
    'with food',
    'after food',
    'before food',
    'empty stomach',
    'with meal',
    'after meal',
    'before meal',
  ];

  const textLower = text.toLowerCase();

  patterns.forEach(pattern => {
    if (textLower.includes(pattern)) {
      instructions.push(pattern);
    }
  });

  return instructions;
}

/**
 * Scan prescription image and extract medication information
 * Note: This is a simplified version. For production, integrate with
 * Google ML Kit Vision or similar OCR service
 */
export async function scanPrescription(imageUri: string): Promise<ExtractedMedicine[]> {
  try {
    // Step 1: Preprocess image
    const processedUri = await preprocessImage(imageUri);

    // Step 2: OCR - In production, integrate ML Kit or native OCR here
    // Placeholder: No OCR extraction available in current build
    const ocrText = '';

    if (!ocrText) {
      return [];
    }

    // Step 3: NER parsing
    const parsed = parsePrescriptionText(ocrText);

    // Step 4: Fuzzy match against MIMS for each extracted name
    const results: ExtractedMedicine[] = [];
    for (const item of parsed) {
      const candidates = await searchMIMS(item.name, 10);
      let bestConfidence = item.confidence;
      if (candidates.length > 0) {
        const best = candidates
          .map(c => {
            const candName = c.brandName || c.genericName;
            return { c, score: similarity(item.name, candName || '') };
          })
          .sort((a, b) => b.score - a.score)[0];
        if (best && best.score > bestConfidence) bestConfidence = Math.max(bestConfidence, best.score);
      }
      results.push({
        name: item.name,
        strength: item.strength,
        dosageForm: item.dosageForm,
        dosage: item.dosage,
        frequency: item.frequency,
        confidence: Math.min(0.99, bestConfidence),
      });
    }

    try { await logEvent(EventType.OCRScanned, { count: results.length }); } catch {}
    return results;
  } catch (error) {
    console.error('Error scanning prescription:', error);
    throw new Error('Failed to scan prescription. Please try again or enter manually.');
  }
}

/**
 * Calculate confidence score for OCR result
 */
export function calculateConfidence(
  ocrConfidence: number,
  matchScore: number
): number {
  // Weighted average: OCR confidence (60%) + match score (40%)
  return ocrConfidence * 0.6 + matchScore * 0.4;
}

/**
 * Validate extracted medicine data
 */
export function validateExtractedMedicine(
  extracted: ExtractedMedicine
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!extracted.name || extracted.name.length < 2) {
    errors.push('Medicine name is required');
  }

  if (extracted.confidence < 0.5) {
    errors.push('Low confidence - please verify the information');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
