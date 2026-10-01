import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import type { Medicine, MedicineIngredient } from '../types.js';
import { DosageForm, ScrapingError } from '../types.js';

export class IngredientMapper {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  // Helper function to parse dosage from medicine name
  private parseDosageFromName(medicineName: string): string {
    const match = medicineName.match(/(\d+(?:\.\d+)?)/);
    return match ? match[1] : '';
  }

  // Helper function to parse unit from medicine name
  private parseUnitFromName(medicineName: string): string {
    const match = medicineName.match(/(MG|ML|MCG|G|IU)/i);
    if (match) {
      const unitValue = match[1].toLowerCase();
      return ['mg', 'ml', 'mcg', 'g', 'iu'].includes(unitValue) ? unitValue : '';
    }
    return '';
  }

  // Helper function to parse form from medicine name
  private parseFormFromName(medicineName: string): DosageForm | undefined {
    const match = medicineName.match(/(tablet|capsule|syrup|liquid|injection|cream|ointment|drop|inhaler|puff)/i);
    if (match) {
      const formValue = match[1].toLowerCase();
      // Normalize some variations and return enum values
      switch (formValue) {
        case 'tablet':
          return DosageForm.TABLET;
        case 'capsule':
          return DosageForm.CAPSULE;
        case 'syrup':
        case 'liquid':
          return DosageForm.SYRUP;
        case 'injection':
          return DosageForm.INJECTION;
        case 'cream':
          return DosageForm.CREAM;
        case 'ointment':
          return DosageForm.OINTMENT;
        case 'drop':
          return DosageForm.DROPS;
        case 'inhaler':
        case 'puff':
          return DosageForm.INHALER;
        default:
          return undefined;
      }
    }
    return undefined;
  }

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
        max_results: 50
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => {
        const medicineName = row.medicine_name;
        return {
          id: row.registration_no,
          name: medicineName,
          activeIngredients: row.active_ingredients || [],
          strength: this.parseDosageFromName(medicineName) + (this.parseUnitFromName(medicineName) ? ' ' + this.parseUnitFromName(medicineName).toUpperCase() : ''),
          dosageForm: this.parseFormFromName(medicineName),
          similarity: row.similarity_score || 0.5 // Include backend-calculated similarity score
        };
      });
    } catch (error) {
      console.error('Failed to search medicines:', error);
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
