/**
 * OCR Service for Prescription Scanning
 * Uses expo-camera and text recognition for extracting medication information
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { ExtractedMedicine, MIMSSearchResult } from '../types';
import { parsePrescriptionText } from './ner';
import { batchSearchMedicines } from './mymedix-api';
import { logEvent, EventType } from './analytics';

// Import ML Kit Text Recognition
let textRecognition: any = null;
try {
  textRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (error) {
  console.warn('ML Kit Text Recognition not available:', error);
}

/**
 * Whether native OCR is available in this runtime
 */
export function isOcrAvailable(): boolean {
  return !!textRecognition;
}

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
 * Perform OCR on image using ML Kit Text Recognition
 */
async function performOCR(imageUri: string): Promise<string> {
  try {
    if (!textRecognition) {
      console.warn('ML Kit Text Recognition not available');
      return '';
    }

    const result = await textRecognition.recognize(imageUri);

    // Extract all text from the result
    let fullText = '';
    if (result && result.text) {
      fullText = result.text;
    } else if (result && result.blocks) {
      // Some versions return blocks
      fullText = result.blocks.map((block: any) => block.text).join('\n');
    }

    return fullText;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

/**
 * Scan prescription image and extract medication information
 * Uses ML Kit Text Recognition for OCR and MyMedix API for medicine matching
 */
export async function scanPrescription(imageUri: string): Promise<ExtractedMedicine[]> {
  try {
    // Step 1: Preprocess image
    console.log('OCR: Preprocessing image...');
    const processedUri = await preprocessImage(imageUri);

    // Step 2: Perform OCR using ML Kit
    console.log('OCR: Extracting text from image...');
    const ocrText = await performOCR(processedUri);

    if (!ocrText || ocrText.trim().length === 0) {
      console.warn('OCR: No text extracted from image');
      return [];
    }

    console.log('OCR: Extracted text:', ocrText.substring(0, 100) + '...');

    // Step 3: NER parsing
    console.log('OCR: Parsing prescription text...');
    const parsed = parsePrescriptionText(ocrText);
    console.log(`OCR: Found ${parsed.length} potential medicines`);

    if (parsed.length === 0) {
      return [];
    }

    // Step 4: Filter out junk/common words before API search
    console.log('OCR: Filtering extracted medicines...');
    
    // Filter out short words (< 4 chars) and common words
    const commonWords = new Set([
      'the', 'and', 'are', 'for', 'with', 'from', 'pack', 'tablet', 'capsule',
      'cream', 'syrup', 'dose', 'take', 'use', 'hcl', 'hci', 'push', 'pash',
      'child', 'adult', 'daily', 'twice', 'once', 'oral', 'eye', 'ear', 'foot',
      'hand', 'care', 'health', 'plus', 'extra', 'super', 'max', 'new'
    ]);
    
    const filteredParsed = parsed.filter(item => {
      const nameLower = item.name.toLowerCase().trim();
      const alphaOnly = nameLower.replace(/[^a-z]/g, '');

      // Skip very short words (likely OCR noise)
      if (alphaOnly.length < 4) {
        console.log(`  ⏭️  Skipping short word: "${item.name}" (${alphaOnly.length} letters)`);
        return false;
      }
      
      // Skip common/generic words
      if (commonWords.has(nameLower)) {
        console.log(`  ⏭️  Skipping common word: "${item.name}"`);
        return false;
      }
      
      // Skip if it looks like gibberish (long consonant runs with almost no vowels)
      const consonantRuns = alphaOnly.match(/[bcdfghjklmnpqrstvwxyz]+/g) || [];
      const longestConsonantRun = consonantRuns.reduce((max, run) => Math.max(max, run.length), 0);
      const vowelCount = (alphaOnly.match(/[aeiou]/g) || []).length;
      const letterCount = alphaOnly.length;
      const vowelRatio = letterCount === 0 ? 0 : vowelCount / letterCount;

      if (longestConsonantRun >= 6 && vowelRatio < 0.25) {
        console.log(
          `  ⏭️  Skipping gibberish: "${item.name}" (consonant run: ${longestConsonantRun}, vowel ratio: ${(vowelRatio * 100).toFixed(1)}%)`,
        );
        return false;
      }
      
      return true;
    });
    
    console.log(`OCR: Filtered ${parsed.length} → ${filteredParsed.length} medicines`);
    
    if (filteredParsed.length === 0) {
      console.log('OCR: No valid medicines after filtering');
      return [];
    }
    
    // Step 5: Batch search all extracted names via MyMedix API (single batch request)
    console.log('OCR: Batch searching medicines via API...');
    const medicineNames = filteredParsed.map(item => item.name);

    try {
      // Use batch search for efficiency - one request instead of N requests
      const searchResults = await batchSearchMedicines(medicineNames, 10);

      // Match extracted medicines with API results
      const results: ExtractedMedicine[] = [];

      for (const item of filteredParsed) {
        const candidates = searchResults.get(item.name) || [];
        const apiMatches: MIMSSearchResult[] = [];

        console.log(`\n🔍 OCR: Processing "${item.name}" - Found ${candidates.length} candidates from API`);

        // Add candidates as potential matches
        // Backend calculates and returns similarity scores
        candidates.forEach(candidate => {
          // Only include medicines with valid IDs
          if (!candidate.id || candidate.id.trim() === '') {
            console.log(`  ❌ Skipping candidate with no ID:`, candidate.brandName || candidate.genericName);
            return;
          }

          // Use backend-calculated similarity score
          const score = candidate.confidence || 0;
          const medicineName = candidate.brandName || candidate.genericName;

          console.log(`  📊 Candidate: "${medicineName}" - Similarity: ${(score * 100).toFixed(1)}%`, {
            id: candidate.id,
            score,
            threshold: 0.7,
            passes: score >= 0.7 ? '✅ PASS' : '❌ FAIL'
          });

          // Only include matches with confidence >= 70%
          if (score >= 0.7) {
            apiMatches.push({
              ...candidate,
              confidence: Math.min(0.99, score),
            });
          }
        });

        // Sort matches by confidence (highest first) and limit to top 5
        apiMatches.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        const top5Matches = apiMatches.slice(0, 5);

        console.log(`  ✅ Passed threshold: ${apiMatches.length} medicines`);
        if (top5Matches.length > 0) {
          console.log(`  🏆 Top 5 for "${item.name}":`, top5Matches.map(m => `${m.brandName || m.genericName} (${(m.confidence! * 100).toFixed(1)}%)`).join(', '));
        } else {
          console.log(`  ❌ No matches passed 70% threshold for "${item.name}"`);
        }

        // Only include extracted medicines that have at least one valid match
        if (top5Matches.length > 0) {
        results.push({
          name: item.name,
          strength: item.strength,
          dosageForm: item.dosageForm,
          dosage: item.dosage,
          frequency: item.frequency,
          confidence: item.confidence,
            apiMatches: top5Matches,
        });
        }
      }

      return results;
    } catch (searchError) {
      console.error('OCR: Batch search failed:', searchError);
      
      // If batch search fails, return filtered results as-is
      const results: ExtractedMedicine[] = filteredParsed.map(item => ({
        name: item.name,
        strength: item.strength,
        dosageForm: item.dosageForm,
        dosage: item.dosage,
        frequency: item.frequency,
        confidence: item.confidence,
      }));
      
      return results;
    } finally {
      // Always log analytics
      const finalResults = filteredParsed.map(item => ({
        name: item.name,
        strength: item.strength,
        dosageForm: item.dosageForm,
        dosage: item.dosage,
        frequency: item.frequency,
        confidence: item.confidence,
      }));
      
      console.log(`OCR: Successfully processed ${finalResults.length} medicines`);
      try { 
        await logEvent(EventType.OCRScanned, { 
          count: finalResults.length,
          avgConfidence: finalResults.reduce((sum, r) => sum + r.confidence, 0) / finalResults.length 
        }); 
      } catch {}
    }

  } catch (error) {
    console.error('Error scanning prescription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to scan prescription: ${errorMessage}. Please try again or enter manually.`);
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
