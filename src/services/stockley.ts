import { config } from '../config.js';
import type { 
  StockleyResponse, 
  DrugInteraction, 
  CacheEntry
} from '../types.js';
import { ScrapingError } from '../types.js';

export class StockleyService {
  private readonly baseUrl = 'https://www.medicinescomplete.com/api/interactions/stockley';
  private cache = new Map<string, CacheEntry<StockleyResponse>>();
  private readonly cacheTtl = config.CACHE_TTL;

  async checkInteractions(ingredients: string[], foodDrinkTobacco: boolean): Promise<DrugInteraction[]> {
    if (ingredients.length < 2) {
      return [];
    }

    const cacheKey = this.generateCacheKey(ingredients);
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return this.transformInteractions(cached);
    }

    const response = await this.fetchInteractions(ingredients, foodDrinkTobacco);
    this.setCache(cacheKey, response);
    
    return this.transformInteractions(response);
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

  private generateCacheKey(ingredients: string[]): string {
    const sortedIngredients = [...ingredients].sort();
    return `interactions:${sortedIngredients.join(',')}`;
  }

  private getFromCache(key: string): StockleyResponse | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: StockleyResponse): void {
    const entry: CacheEntry<StockleyResponse> = {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTtl
    };
    
    this.cache.set(key, entry);
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

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
