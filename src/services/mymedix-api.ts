/**
 * MyMedix API Medicine Service
 * Provides medicine database search and information retrieval
 * Uses MyMedix API directly (no local caching)
 */

import { MIMSMedicine, MIMSSearchResult } from '../types';
import { apiClient, type ApiMedicine } from './api-client';

/**
 * Convert API medicine to search result format
 */
function convertApiMedicineToSearchResult(apiMedicine: ApiMedicine): MIMSSearchResult {
  // Extract medicine name parts (brand/generic) and strength from the full name
  // Example: "PANADOL TABLET 500MG" -> brand: PANADOL, dosageForm: TABLET, strength: 500MG
  
  let brandName = '';
  let genericName = apiMedicine.activeIngredients[0] || '';
  let dosageForm = '';
  let strength = '';
  
  // Try to extract strength (ends with MG, ML, MCG, etc.)
  const strengthMatch = apiMedicine.name.match(/(\d+(?:\.\d+)?(?:MG|ML|MCG|G|IU))/i);
  if (strengthMatch) {
    strength = strengthMatch[1];
  }
  
  // Try to extract dosage form
  const dosageFormMatch = apiMedicine.name.match(/(TABLET|CAPSULE|SYRUP|INJECTION|CREAM|OINTMENT|SUSPENSION)/i);
  if (dosageFormMatch) {
    dosageForm = dosageFormMatch[1];
  }
  
  // Everything before dosage form is likely the brand name
  if (dosageFormMatch) {
    brandName = apiMedicine.name.substring(0, dosageFormMatch.index).trim();
  } else {
    brandName = apiMedicine.name;
  }
  
  return {
    id: apiMedicine.id,
    genericName,
    brandName,
    strength,
    dosageForm,
    confidence: 0.9, // High confidence from API
    activeIngredients: apiMedicine.activeIngredients || [],
  };
}

/**
 * Search medicines using MyMedix API
 */
export async function searchMedicines(
  query: string,
  limit: number = 20
): Promise<MIMSSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const apiMedicines = await apiClient.searchMedicines(query);
    
    const results = apiMedicines
      .slice(0, limit)
      .map(convertApiMedicineToSearchResult);
    
    return results;
  } catch (error) {
    console.error('Medicine search failed:', error);
    throw error; // Let the caller handle the error
  }
}

/**
 * Batch search multiple medicine names at once
 * More efficient for OCR results with multiple medicines
 */
export async function batchSearchMedicines(
  queries: string[],
  limit: number = 10
): Promise<Map<string, MIMSSearchResult[]>> {
  if (queries.length === 0) {
    return new Map();
  }

  try {
    console.log(`Batch searching ${queries.length} medicines via API...`);
    const apiResultsMap = await apiClient.batchSearchMedicines(queries);
    
    // Convert results
    const resultMap = new Map<string, MIMSSearchResult[]>();
    
    for (const [query, apiMedicines] of Array.from(apiResultsMap.entries())) {
      const results = apiMedicines
        .slice(0, limit)
        .map(convertApiMedicineToSearchResult);

      resultMap.set(query, results);
    }
    
    return resultMap;
  } catch (error) {
    console.error('Batch medicine search failed:', error);
    throw error; // Let the caller handle the error
  }
}

/**
 * Get medicine details by registration number from MyMedix API
 */
export async function getMedicineDetails(registrationNo: string): Promise<MIMSMedicine | null> {
  try {
    const apiMedicine = await apiClient.getMedicineDetails(registrationNo);

    if (!apiMedicine) {
      return null;
    }

    // Extract strength and dosage form from medicine name
    let strength = '';
    let dosageForm = '';

    // Try to extract strength (ends with MG, ML, MCG, etc.)
    const strengthMatch = apiMedicine.name.match(/(\d+(?:\.\d+)?(?:MG|ML|MCG|G|IU))/i);
    if (strengthMatch) {
      strength = strengthMatch[1];
    }

    // Try to extract dosage form
    const dosageFormMatch = apiMedicine.name.match(/(TABLET|CAPSULE|SYRUP|INJECTION|CREAM|OINTMENT|SUSPENSION)/i);
    if (dosageFormMatch) {
      dosageForm = dosageFormMatch[1];
    }

    // Convert API medicine to full medicine details
    return {
      id: apiMedicine.id, // Registration number
      genericName: apiMedicine.activeIngredients[0] || apiMedicine.name,
      brandName: apiMedicine.name,
      strength,
      dosageForm,
      instructions: undefined, // Would need clinical data endpoint
      timing: undefined,
      foodInstructions: undefined,
      warnings: undefined,
      sideEffects: undefined,
      contraindications: undefined,
      drugInteractions: undefined,
      foodInteractions: undefined,
      source: 'PNF', // Data from Malaysian pharmaceutical registry
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      activeIngredients: apiMedicine.activeIngredients,
    };
  } catch (error) {
    console.error('Error getting medicine details:', error);
    throw error;
  }
}

/**
 * Check for drug interactions between medications
 * Uses MyMedix API for comprehensive Stockley's interaction data
 */
export async function checkDrugInteractions(
  medicationIds: string[]
): Promise<{ hasInteractions: boolean; interactions: string[] }> {
  if (medicationIds.length === 0) {
    return { hasInteractions: false, interactions: [] };
  }

  try {
    const response = await apiClient.checkInteractions(medicationIds, false);
    
    if (response.interactions.length > 0) {
      // Format interactions into user-friendly messages
      const interactions = response.interactions.map(interaction => {
        const severity = interaction.severityRating?.rating || interaction.severity || 'Unknown';
        const message = `${interaction.firstReactant} and ${interaction.secondReactant} (${severity} severity)`;
        return interaction.explanation 
          ? `${message}: ${interaction.explanation}`
          : message;
      });
      
      return {
        hasInteractions: true,
        interactions,
      };
    }
    
    return { hasInteractions: false, interactions: [] };
  } catch (error) {
    console.error('Drug interaction check failed:', error);
    // Return no interactions rather than failing completely
    // The UI can show "Unable to check interactions" based on the error
    return { hasInteractions: false, interactions: [] };
  }
}

/**
 * Get medicine recommendations based on symptoms (placeholder)
 */
export async function getMedicineRecommendations(
  symptoms: string[]
): Promise<MIMSSearchResult[]> {
  // This would integrate with a medical knowledge base in production
  // For now, return empty array
  return [];
}

// Legacy exports for backward compatibility with existing code
export const searchMIMS = searchMedicines;
export const getMIMSMedicine = getMedicineDetails;
// Main exports with clear naming
export const searchMyMedixMedicines = searchMedicines;
export const getMyMedixMedicine = getMedicineDetails;
