import { create } from 'zustand';
import { getDatabase } from '../services/database';
import { checkDrugInteractions as checkDrugInteractionsAPI } from '../services/mymedix-api';

// Database row type for interaction cache
interface InteractionCacheRow {
  medication_ids: string; // Sorted and joined with |
  interaction_data: string; // JSON stringified interaction result
  checked_at: string;
  expires_at: string;
}

// Interaction result from API
export interface DrugInteractionResult {
  hasInteractions: boolean;
  interactions: string[];
}

interface InteractionState {
  isLoading: boolean;
  error: string | null;

  // Actions
  getInteractions: (medicationIds: string[]) => Promise<DrugInteractionResult>;
  clearCache: () => Promise<void>;
  removeExpiredCache: () => Promise<void>;
}

// Cache expiration time (7 days)
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a cache key from medication IDs
 * Sort IDs to ensure consistent key regardless of order
 */
function generateCacheKey(medicationIds: string[]): string {
  return medicationIds.sort().join('|');
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(expiresAt: string): boolean {
  const expirationDate = new Date(expiresAt);
  return expirationDate > new Date();
}

export const useInteractionStore = create<InteractionState>((set) => ({
  isLoading: false,
  error: null,

  getInteractions: async (medicationIds: string[]) => {
    // Return empty result for empty input
    if (medicationIds.length === 0) {
      return { hasInteractions: false, interactions: [] };
    }

    const cacheKey = generateCacheKey(medicationIds);

    // Check SQLite cache
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<InteractionCacheRow>(
        'SELECT * FROM drug_interactions_cache WHERE medication_ids = ?',
        [cacheKey]
      );

      if (row && isCacheValid(row.expires_at)) {
        console.log('[interactionStore] Cache hit for:', medicationIds);
        return JSON.parse(row.interaction_data);
      }
    } catch (error) {
      console.warn('[interactionStore] Error reading cache:', error);
      // Continue to API call if cache read fails
    }

    // No valid cache, fetch from API
    set({ isLoading: true, error: null });
    try {
      console.log('[interactionStore] Cache miss, fetching from API:', medicationIds);
      const result = await checkDrugInteractionsAPI(medicationIds);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_EXPIRATION_MS);

      // Save to database
      try {
        const db = getDatabase();
        await db.runAsync(
          `INSERT OR REPLACE INTO drug_interactions_cache 
           (medication_ids, interaction_data, checked_at, expires_at)
           VALUES (?, ?, ?, ?)`,
          [
            cacheKey,
            JSON.stringify(result),
            now.toISOString(),
            expiresAt.toISOString(),
          ]
        );
        console.log('[interactionStore] Saved to cache');
      } catch (error) {
        console.warn('[interactionStore] Error saving to cache:', error);
        // Continue even if cache save fails
      }

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('[interactionStore] Error fetching interactions:', error);
      set({ error: (error as Error).message, isLoading: false });
      // Return empty result on error
      return { hasInteractions: false, interactions: [] };
    }
  },

  clearCache: async () => {
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM drug_interactions_cache');
      console.log('[interactionStore] Cache cleared');
    } catch (error) {
      console.error('[interactionStore] Error clearing cache:', error);
      set({ error: (error as Error).message });
    }
  },

  removeExpiredCache: async () => {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      const result = await db.runAsync(
        'DELETE FROM drug_interactions_cache WHERE expires_at < ?',
        [now]
      );
      console.log(`[interactionStore] Removed ${result.changes} expired cache entries`);
    } catch (error) {
      console.error('[interactionStore] Error removing expired cache:', error);
      set({ error: (error as Error).message });
    }
  },
}));

