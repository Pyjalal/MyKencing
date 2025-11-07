import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import type { Medicine, MedicineIngredient } from '../types.js';
import { ScrapingError } from '../types.js';

export class IngredientMapper {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  async getIngredientsForMedicines(registrationNumbers: string[]): Promise<Medicine[]> {
    const medicines: Medicine[] = [];

    for (const regNo of registrationNumbers) {
      const medicine = await this.getMedicineFromDB(regNo);
      if (medicine) {
        medicines.push(medicine);
      }
    }

    return medicines;
  }

  async getIngredientsForMedicine(registrationNumber: string): Promise<Medicine | null> {
    return await this.getMedicineFromDB(registrationNumber);
  }

  private async getMedicineFromDB(registrationNumber: string): Promise<Medicine | null> {
    try {
      const { data, error } = await this.supabase
        .from('medicine_ingredients')
        .select('*')
        .eq('registration_no', registrationNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return {
        id: data.registration_no,
        name: data.medicine_name,
        activeIngredients: data.active_ingredients || []
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'PGRST116') {
        return null;
      }
      throw new ScrapingError(
        `Failed to fetch medicine ${registrationNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'quest'
      );
    }
  }

  async searchMedicines(searchTerm: string): Promise<Medicine[]> {
    try {
      // Use PostgreSQL's similarity() function to rank results
      // The pg_trgm extension handles typos and fuzzy matching automatically
      const { data, error } = await this.supabase.rpc('search_medicines_by_similarity', {
        search_term: searchTerm,
        match_threshold: 0.2,
        max_results: 50
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.registration_no,
        name: row.medicine_name,
        activeIngredients: row.active_ingredients || [],
        similarity: row.similarity_score || 0.5 // Include backend-calculated similarity score
      }));
    } catch (error) {
      throw new ScrapingError(
        `Failed to search medicines: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'quest'
      );
    }
  }

  async updateMedicineIngredients(registrationNumber: string, activeIngredients: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('medicine_ingredients')
        .update({
          active_ingredients: activeIngredients,
          updated_at: new Date().toISOString()
        })
        .eq('registration_no', registrationNumber);

      if (error) {
        throw new ScrapingError(
          `Failed to update ingredients for ${registrationNumber}: ${error.message}`,
          'quest'
        );
      }
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      throw new ScrapingError(
        `Failed to update ingredients for ${registrationNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'quest'
      );
    }
  }
}
