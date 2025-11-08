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
  // Parse medicine name to extract brand name (everything before strength/dosage info)
  let brandName = apiMedicine.name;

  // Remove strength and dosage form from the end to get clean brand name
  // Remove patterns like "500MG", "TABLET", "20 MG", etc.
  brandName = brandName
    .replace(/\s+\d+(?:\.\d+)?\s*(?:MG|ML|MCG|G|IU)/gi, '') // Remove strength
    .replace(/\s+(?:TABLET|CAPSULE|SYRUP|LIQUID|INJECTION|CREAM|OINTMENT|DROP|INHALER|PUFF)/gi, '') // Remove dosage form
    .trim();

  // If brand name is empty after parsing, use the original name
  if (!brandName) {
    brandName = apiMedicine.name;
  }

  return {
    id: apiMedicine.id,
    genericName: apiMedicine.activeIngredients[0] || '',
    brandName,
    // Use backend-parsed strength and dosageForm directly
    strength: apiMedicine.strength,
    dosageForm: apiMedicine.dosageForm,
    // Use backend-calculated similarity if available, otherwise default to high confidence
    confidence: apiMedicine.similarity !== undefined ? apiMedicine.similarity : 0.9,
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
    console.log(`Batch searching ${queries.length} medicines via API...`, queries);
    const apiResultsMap = await apiClient.batchSearchMedicines(queries);
    
    // Convert results
    const resultMap = new Map<string, MIMSSearchResult[]>();
    
    for (const [query, apiMedicines] of Array.from(apiResultsMap.entries())) {
      const results = apiMedicines
        .slice(0, limit)
        .map(convertApiMedicineToSearchResult);

      resultMap.set(query, results);
      console.log(`Query "${query}" returned ${results.length} results`);
    }
    
    console.log(`Batch search completed: ${resultMap.size} queries processed`);
    return resultMap;
  } catch (error) {
    console.error('Batch medicine search failed:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      queries,
      limit,
    });
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
