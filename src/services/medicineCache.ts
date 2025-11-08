/**
 * Medicine Cache Service
 * Caches medicine details from MyMedix API to reduce API calls and improve performance
 */

import { MIMSMedicine } from '../types';
import { getDatabase } from './database';
import { getMedicineDetails } from './mymedix-api';

/**
 * Get cached medicine details, fetching from API if not cached
 */
export async function getCachedMedicineDetails(registrationNo: string): Promise<MIMSMedicine | null> {
  if (!registrationNo || registrationNo.trim().length === 0) {
    return null;
  }

  const db = getDatabase();

  try {
    // First, try to get from cache
    const cached = await db.getFirstAsync(`
      SELECT * FROM mims_cache WHERE id = ?
    `, [registrationNo]) as {
      id: string;
      generic_name: string;
      brand_name?: string;
      strength?: string;
      dosage_form?: string;
      instructions?: string;
      timing?: string;
      food_instructions?: string;
      warnings?: string;
      side_effects?: string;
      contraindications?: string;
      drug_interactions?: string;
      food_interactions?: string;
      source: string;
      last_updated: string;
      created_at: string;
      active_ingredients?: string;
    } | null;

    if (cached) {
      // Convert database row to MIMSMedicine format
      return {
        id: cached.id,
        genericName: cached.generic_name,
        brandName: cached.brand_name,
        strength: cached.strength,
        dosageForm: cached.dosage_form,
        instructions: cached.instructions,
        timing: cached.timing,
        foodInstructions: cached.food_instructions,
        warnings: cached.warnings,
        sideEffects: cached.side_effects,
        contraindications: cached.contraindications,
        drugInteractions: cached.drug_interactions,
        foodInteractions: cached.food_interactions,
        source: cached.source as 'PNF',
        lastUpdated: cached.last_updated,
        createdAt: cached.created_at,
        activeIngredients: cached.active_ingredients ? JSON.parse(cached.active_ingredients) : [],
      };
    }
  } catch (cacheError) {
    console.warn(`Failed to read from medicine cache for ${registrationNo}:`, cacheError);
    // Continue to API call if cache read fails
  }

  // Not in cache or cache read failed, fetch from API
  try {
    const medicineDetails = await getMedicineDetails(registrationNo);

    if (medicineDetails) {
      // Cache the result
      await cacheMedicineDetails(medicineDetails);
    }

    return medicineDetails;
  } catch (apiError) {
    console.error(`Failed to fetch medicine details for ${registrationNo}:`, apiError);
    return null;
  }
}

/**
 * Cache medicine details in the local database
 */
async function cacheMedicineDetails(medicine: MIMSMedicine): Promise<void> {
  const db = getDatabase();

  try {

    await db.runAsync(`
      INSERT OR REPLACE INTO mims_cache (
        id, generic_name, brand_name, strength, dosage_form, instructions,
        timing, food_instructions, warnings, side_effects, contraindications,
        drug_interactions, food_interactions, source, last_updated, created_at,
        active_ingredients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      medicine.id,
      medicine.genericName,
      medicine.brandName || null,
      medicine.strength || null,
      medicine.dosageForm || null,
      medicine.instructions || null,
      medicine.timing || null,
      medicine.foodInstructions || null,
      medicine.warnings || null,
      medicine.sideEffects || null,
      medicine.contraindications || null,
      medicine.drugInteractions || null,
      medicine.foodInteractions || null,
      medicine.source,
      medicine.lastUpdated,
      medicine.createdAt,
      JSON.stringify(medicine.activeIngredients || []),
    ]);

    console.log(`Cached medicine details for ${medicine.id}`);
  } catch (error) {
    console.error(`Failed to cache medicine details for ${medicine.id}:`, error);
  }
}

/**
 * Pre-cache multiple medicine details (useful for bulk operations)
 */
export async function cacheMultipleMedicineDetails(registrationNos: string[]): Promise<void> {
  const uniqueNos = [...new Set(registrationNos.filter(no => no && no.trim().length > 0))];

  if (uniqueNos.length === 0) {
    return;
  }

  console.log(`Pre-caching ${uniqueNos.length} medicine details...`);

  // Check which ones are already cached
  const db = getDatabase();
  const cachedResults = await db.getAllAsync(
    `SELECT id FROM mims_cache WHERE id IN (${uniqueNos.map(() => '?').join(',')})`,
    uniqueNos
  ) as { id: string }[];

  const cachedIds = new Set(cachedResults.map(row => row.id));
  const uncachedNos = uniqueNos.filter(no => !cachedIds.has(no));

  if (uncachedNos.length === 0) {
    console.log('All medicine details already cached');
    return;
  }

  console.log(`Fetching ${uncachedNos.length} uncached medicine details from API...`);

  // Fetch uncached details in parallel
  const fetchPromises = uncachedNos.map(async (regNo) => {
    try {
      const details = await getMedicineDetails(regNo);
      return details;
    } catch (error) {
      console.warn(`Failed to fetch details for ${regNo}:`, error);
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  const validResults = results.filter((result): result is MIMSMedicine => result !== null);

  // Cache all valid results
  for (const medicine of validResults) {
    await cacheMedicineDetails(medicine);
  }

  console.log(`Successfully cached ${validResults.length} medicine details`);
}

/**
 * Clear all cached medicine details (useful for testing or cache invalidation)
 */
export async function clearMedicineCache(): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('DELETE FROM mims_cache');
    console.log('Medicine cache cleared');
  } catch (error) {
    console.error('Failed to clear medicine cache:', error);
  }
}