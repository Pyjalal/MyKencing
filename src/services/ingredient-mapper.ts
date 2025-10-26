import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import type { Medicine, MedicineIngredient } from '../types.js';
import { ScrapingError } from '../types.js';
import { QuestScraper } from './quest-scraper.js';

export class IngredientMapper {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  private questScraper = new QuestScraper();

  async getIngredientsForMedicines(registrationNumbers: string[]): Promise<Medicine[]> {
    const medicines: Medicine[] = [];
    const uncachedNumbers: string[] = [];

    for (const regNo of registrationNumbers) {
      const cached = await this.getCachedIngredients(regNo);
      if (cached) {
        medicines.push({
          id: regNo,
          name: cached.medicine_name,
          activeIngredients: cached.active_ingredients
        });
      } else {
        uncachedNumbers.push(regNo);
      }
    }

    if (uncachedNumbers.length > 0) {
      const scrapedMedicines = await this.scrapeAndCacheMedicines(uncachedNumbers);
      medicines.push(...scrapedMedicines);
    }

    return medicines;
  }

  async getIngredientsForMedicine(registrationNumber: string): Promise<Medicine | null> {
    const medicines = await this.getIngredientsForMedicines([registrationNumber]);
    return medicines[0] || null;
  }

  private async getCachedIngredients(registrationNumber: string): Promise<MedicineIngredient | null> {
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
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private async scrapeAndCacheMedicines(registrationNumbers: string[]): Promise<Medicine[]> {
    const medicines: Medicine[] = [];

    for (const regNo of registrationNumbers) {
      try {
        const medicine = await this.questScraper.getMedicineDetails(regNo);
        
        if (medicine) {
          await this.cacheMedicine(medicine);
          medicines.push(medicine);
        } else {
          const basicMedicine: Medicine = {
            id: regNo,
            name: `Medicine ${regNo}`,
            activeIngredients: []
          };
          
          await this.cacheMedicine(basicMedicine);
          medicines.push(basicMedicine);
        }
      } catch {
        const fallbackMedicine: Medicine = {
          id: regNo,
          name: `Medicine ${regNo}`,
          activeIngredients: []
        };
        
        try {
          await this.cacheMedicine(fallbackMedicine);
          medicines.push(fallbackMedicine);
        } catch {
          // Silently fail if we can't cache fallback medicine
        }
      }
    }

    return medicines;
  }

  private async cacheMedicine(medicine: Medicine): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('medicine_ingredients')
        .upsert({
          registration_no: medicine.id,
          medicine_name: medicine.name,
          active_ingredients: medicine.activeIngredients,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'registration_no'
        });

      if (error) {
        throw new ScrapingError(
          `Failed to cache medicine ${medicine.id}: ${error.message}`,
          'quest'
        );
      }
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      throw new ScrapingError(
        `Failed to cache medicine ${medicine.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'quest'
      );
    }
  }

  async searchMedicines(searchTerm: string): Promise<Medicine[]> {
    try {
      return await this.questScraper.searchMedicines(searchTerm);
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
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
