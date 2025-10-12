/**
 * MIMS Malaysia Integration Service
 * Provides medicine database search and information retrieval
 */

import Fuse from 'fuse.js';
import { getDatabase } from './database';
import { MIMSMedicine, MIMSSearchResult } from '../types';

/**
 * Search MIMS database with fuzzy matching
 */
export async function searchMIMS(
  query: string,
  limit: number = 20
): Promise<MIMSSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const db = getDatabase();

    // Get all medicines from cache (in production, use FTS5 for better performance)
    const medicines = await db.getAllAsync<any>(
      `SELECT id, generic_name, brand_name, strength, dosage_form
       FROM mims_cache
       WHERE generic_name LIKE ? OR brand_name LIKE ?
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit * 2] // Get more for fuzzy matching
    );

    if (medicines.length === 0) {
      return [];
    }

    // Apply fuzzy search
    const fuse = new Fuse(medicines, {
      keys: [
        { name: 'generic_name', weight: 0.7 },
        { name: 'brand_name', weight: 0.3 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(query);

    return results.slice(0, limit).map(result => ({
      id: result.item.id,
      genericName: result.item.generic_name,
      brandName: result.item.brand_name,
      strength: result.item.strength,
      dosageForm: result.item.dosage_form,
      confidence: result.score ? 1 - result.score : 1,
    }));
  } catch (error) {
    console.error('Error searching MIMS:', error);
    return [];
  }
}

/**
 * Get medicine details by ID
 */
export async function getMIMSMedicine(id: string): Promise<MIMSMedicine | null> {
  try {
    const db = getDatabase();

    const medicine = await db.getFirstAsync<any>(
      `SELECT * FROM mims_cache WHERE id = ?`,
      [id]
    );

    if (!medicine) {
      return null;
    }

    return {
      id: medicine.id,
      genericName: medicine.generic_name,
      brandName: medicine.brand_name,
      strength: medicine.strength,
      dosageForm: medicine.dosage_form,
      instructions: medicine.instructions,
      timing: medicine.timing,
      foodInstructions: medicine.food_instructions,
      warnings: medicine.warnings,
      sideEffects: medicine.side_effects,
      contraindications: medicine.contraindications,
      drugInteractions: medicine.drug_interactions,
      foodInteractions: medicine.food_interactions,
      source: medicine.source as 'MIMS' | 'PNF',
      lastUpdated: medicine.last_updated,
      createdAt: medicine.created_at,
    };
  } catch (error) {
    console.error('Error getting MIMS medicine:', error);
    return null;
  }
}

/**
 * Seed MIMS database with sample Malaysian medicines
 * In production, this would be populated from MIMS API or NPRA data
 */
export async function seedMIMSDatabase(): Promise<void> {
  const db = getDatabase();

  // Check if already seeded
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM mims_cache'
  );

  if (count && count.count > 0) {
    console.log('MIMS database already seeded');
    return;
  }

  const sampleMedicines = [
    {
      id: 'mims-001',
      generic_name: 'Paracetamol',
      brand_name: 'Panadol',
      strength: '500mg',
      dosage_form: 'Tablet',
      instructions: 'Take 1-2 tablets every 4-6 hours',
      timing: 'As needed',
      food_instructions: 'Can be taken with or without food',
      warnings: 'Do not exceed 4g per day',
      side_effects: 'Rare: rash, nausea',
      contraindications: 'Severe liver disease',
      drug_interactions: 'Warfarin, carbamazepine',
      food_interactions: 'Avoid alcohol',
      source: 'MIMS',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'mims-002',
      generic_name: 'Metformin',
      brand_name: 'Glucophage',
      strength: '500mg',
      dosage_form: 'Tablet',
      instructions: 'Take with meals',
      timing: 'Twice daily',
      food_instructions: 'Take with food to reduce GI side effects',
      warnings: 'Monitor kidney function, risk of lactic acidosis',
      side_effects: 'Diarrhea, nausea, abdominal discomfort',
      contraindications: 'Severe kidney disease, acute metabolic acidosis',
      drug_interactions: 'Contrast media, alcohol',
      food_interactions: 'Avoid excessive alcohol',
      source: 'MIMS',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'mims-003',
      generic_name: 'Amlodipine',
      brand_name: 'Norvasc',
      strength: '5mg',
      dosage_form: 'Tablet',
      instructions: 'Take once daily',
      timing: 'Morning',
      food_instructions: 'Can be taken with or without food',
      warnings: 'May cause ankle swelling, dizziness',
      side_effects: 'Headache, flushing, peripheral edema',
      contraindications: 'Severe hypotension, cardiogenic shock',
      drug_interactions: 'Simvastatin, diltiazem',
      food_interactions: 'Avoid grapefruit juice',
      source: 'MIMS',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'mims-004',
      generic_name: 'Simvastatin',
      brand_name: 'Zocor',
      strength: '20mg',
      dosage_form: 'Tablet',
      instructions: 'Take once daily in the evening',
      timing: 'Evening',
      food_instructions: 'Take in the evening with or without food',
      warnings: 'Monitor liver function, risk of myopathy',
      side_effects: 'Muscle pain, headache, nausea',
      contraindications: 'Active liver disease, pregnancy',
      drug_interactions: 'Amlodipine, diltiazem, grapefruit juice',
      food_interactions: 'Avoid grapefruit juice',
      source: 'MIMS',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'mims-005',
      generic_name: 'Atorvastatin',
      brand_name: 'Lipitor',
      strength: '10mg',
      dosage_form: 'Tablet',
      instructions: 'Take once daily',
      timing: 'Any time of day',
      food_instructions: 'Can be taken with or without food',
      warnings: 'Monitor liver function, risk of myopathy',
      side_effects: 'Muscle pain, diarrhea, nausea',
      contraindications: 'Active liver disease, pregnancy',
      drug_interactions: 'Clarithromycin, itraconazole',
      food_interactions: 'Limit grapefruit juice intake',
      source: 'MIMS',
      last_updated: new Date().toISOString(),
    },
  ];

  // Insert sample medicines
  for (const medicine of sampleMedicines) {
    await db.runAsync(
      `INSERT INTO mims_cache (
        id, generic_name, brand_name, strength, dosage_form,
        instructions, timing, food_instructions, warnings, side_effects,
        contraindications, drug_interactions, food_interactions,
        source, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicine.id,
        medicine.generic_name,
        medicine.brand_name,
        medicine.strength,
        medicine.dosage_form,
        medicine.instructions,
        medicine.timing,
        medicine.food_instructions,
        medicine.warnings,
        medicine.side_effects,
        medicine.contraindications,
        medicine.drug_interactions,
        medicine.food_interactions,
        medicine.source,
        medicine.last_updated,
      ]
    );
  }

  console.log(`Seeded ${sampleMedicines.length} medicines to MIMS database`);
}

/**
 * Check for drug interactions between medications
 */
export async function checkDrugInteractions(
  medicationIds: string[]
): Promise<{ hasInteractions: boolean; interactions: string[] }> {
  const db = getDatabase();
  const interactions: string[] = [];

  // Get all medications
  const medicines = await Promise.all(
    medicationIds.map(id => getMIMSMedicine(id))
  );

  // Check for interactions (simplified version)
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const med1 = medicines[i];
      const med2 = medicines[j];

      if (!med1 || !med2) continue;

      // Check if med2 is in med1's drug interactions
      if (
        med1.drugInteractions &&
        med2.genericName &&
        med1.drugInteractions.toLowerCase().includes(med2.genericName.toLowerCase())
      ) {
        interactions.push(
          `${med1.genericName} may interact with ${med2.genericName}`
        );
      }
    }
  }

  return {
    hasInteractions: interactions.length > 0,
    interactions,
  };
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
