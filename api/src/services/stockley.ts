import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';
import { config } from '../config.js';
import type {
  StockleyResponse,
  DrugInteraction,
  CacheEntry
} from '../types.js';
import { ScrapingError } from '../types.js';

export class StockleyService {
  private readonly baseUrl = 'https://www.medicinescomplete.com/api/interactions/stockley';
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  
  // In-memory cache with no expiration (0 = forever)
  // checkperiod: 0 = disabled - entries never expire
  private static memoryCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

  async checkInteractions(medicineIds: string[], foodDrinkTobacco: boolean): Promise<DrugInteraction[]> {
    if (medicineIds.length < 2 && !foodDrinkTobacco) {
      return [];
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(medicineIds, foodDrinkTobacco);

    // 1. Try to get from in-memory cache first (fastest)
    const memoryCached = StockleyService.memoryCache.get<StockleyResponse>(cacheKey);
    if (memoryCached) {
      console.log(`Cache hit (memory): ${cacheKey}`);
      return this.transformInteractions(memoryCached);
    }

    // 2. Try to get from database cache
    const dbCached = await this.getFromCache(medicineIds, foodDrinkTobacco);
    if (dbCached) {
      console.log(`Cache hit (database): ${cacheKey}`);
      // Store in memory cache for next time
      StockleyService.memoryCache.set(cacheKey, dbCached);
      return this.transformInteractions(dbCached);
    }

    // 3. Fetch ingredients for the medicines
    const ingredients = await this.getIngredientsForMedicines(medicineIds);
    if (ingredients.length < 2 && !foodDrinkTobacco) {
      return [];
    }

    // 4. Fetch from API
    console.log(`Cache miss: ${cacheKey}`);
    const response = await this.fetchInteractions(ingredients, foodDrinkTobacco);

    // Cache the response in both memory and database
    StockleyService.memoryCache.set(cacheKey, response);
    await this.setCache(medicineIds, foodDrinkTobacco, response);

    return this.transformInteractions(response);
  }

  private generateCacheKey(medicineIds: string[], foodDrinkTobacco: boolean): string {
    // Sort medicine IDs for consistent cache keys regardless of order
    const sortedIds = [...medicineIds].sort().join(',');
    return `interactions:${sortedIds}:${foodDrinkTobacco}`;
  }

  private async getIngredientsForMedicines(medicineIds: string[]): Promise<string[]> {
    const ingredients = new Set<string>();

    for (const medicineId of medicineIds) {
      const { data, error } = await this.supabase
        .from('medicine_ingredients')
        .select('active_ingredients')
        .eq('registration_no', medicineId)
        .single();

      if (!error && data?.active_ingredients) {
        data.active_ingredients.forEach((ingredient: string) => ingredients.add(ingredient));
      }
    }

    return Array.from(ingredients);
  }

  private async fetchInteractions(ingredients: string[], foodDrinkTobacco: boolean): Promise<StockleyResponse> {
    try {
      const url = this.buildApiUrl(ingredients, foodDrinkTobacco);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
          'priority': 'u=1, i',
          'referer': 'https://www.medicinescomplete.com/',
          'sec-ch-ua': '"Brave";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'cookie': config.STOCKLEY_COOKIES
        }
      });

      if (!response.ok) {
        throw new ScrapingError(
          `Stockley API request failed with status ${response.status}`,
          'stockley'
        );
      }

      const data = await response.json() as StockleyResponse;
      return data;
    } catch (error) {
      if (error instanceof ScrapingError) {
        throw error;
      }
      throw new ScrapingError(
        `Failed to fetch interactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'stockley'
      );
    }
  }

  private buildApiUrl(ingredients: string[], foodDrinkTobacco: boolean): string {
    const params = new URLSearchParams();
    params.append('foodDrinkTobacco', foodDrinkTobacco.toString());
    
    ingredients.forEach(ingredient => {
      params.append('interactants', ingredient);
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  private async getFromCache(medicineIds: string[], foodDrinkTobacco: boolean): Promise<StockleyResponse | null> {
    try {
      const { data, error } = await this.supabase
        .from('drug_interactions_cache')
        .select('stockley_response')
        .eq('medicine_ids', medicineIds.sort())
        .eq('food_drink_tobacco', foodDrinkTobacco)
        .single();

      if (error || !data) {
        return null;
      }

      return data.stockley_response as StockleyResponse;
    } catch (error) {
      // If cache lookup fails, just return null (don't throw)
      return null;
    }
  }

  private async setCache(medicineIds: string[], foodDrinkTobacco: boolean, data: StockleyResponse): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('drug_interactions_cache')
        .upsert({
          medicine_ids: medicineIds.sort(),
          food_drink_tobacco: foodDrinkTobacco,
          stockley_response: data
        });

      if (error) {
        console.warn('Failed to cache drug interactions:', error);
        // Don't throw - caching failure shouldn't break the main flow
      }
    } catch (error) {
      console.warn('Failed to cache drug interactions:', error);
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  private transformInteractions(response: StockleyResponse): DrugInteraction[] {
    return response.interactions.map(interaction => ({
      interactionId: interaction.interactionIdentityNumber,
      firstReactant: interaction.firstReactant,
      secondReactant: interaction.secondReactant,
      severity: interaction.severityRating.rating,
      explanation: interaction.explanation,
      action: interaction.action,
      warningCode: interaction.warningCode,
      actionRating: {
        rating: interaction.actionRating.rating,
        description: interaction.actionRating.description
      },
      severityRating: {
        rating: interaction.severityRating.rating,
        description: interaction.severityRating.description
      },
      evidenceRating: {
        rating: interaction.evidenceRating.rating,
        description: interaction.evidenceRating.description
      }
    }));
  }

  async clearCache(): Promise<void> {
    try {
      // Clear in-memory cache
      StockleyService.memoryCache.flushAll();
      console.log('In-memory cache cleared');

      // Clear database cache
      const { error } = await this.supabase
        .from('drug_interactions_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) {
        console.warn('Failed to clear database cache:', error);
      } else {
        console.log('Database cache cleared');
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  async getCacheStats(): Promise<{ 
    memory: { 
      size: number; 
      hits: number; 
      misses: number; 
      keys: string[] 
    }; 
    database: { 
      size: number; 
      entries: any[] 
    } 
  }> {
    try {
      // Get in-memory cache stats
      const memoryStats = StockleyService.memoryCache.getStats();
      const memoryKeys = StockleyService.memoryCache.keys();

      // Get database cache stats
      const { data, error } = await this.supabase
        .from('drug_interactions_cache')
        .select('medicine_ids, food_drink_tobacco, created_at')
        .order('created_at', { ascending: false });

      return {
        memory: {
          size: memoryKeys.length,
          hits: memoryStats.hits,
          misses: memoryStats.misses,
          keys: memoryKeys
        },
        database: {
          size: error ? 0 : (data?.length || 0),
          entries: error ? [] : (data || [])
        }
      };
    } catch (error) {
      return {
        memory: {
          size: 0,
          hits: 0,
          misses: 0,
          keys: []
        },
        database: {
          size: 0,
          entries: []
        }
      };
    }
  }
}
