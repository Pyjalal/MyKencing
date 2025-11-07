/**
 * MyMedix API Client
 * Provides medicine search and drug interaction checking
 */

// API Configuration
// Hardcoded to production for real device testing
const API_BASE_URL = 'https://mymedix-api.fly.dev';

const API_TIMEOUT = 10000; // 10 seconds

/**
 * Medicine result from API
 */
export interface ApiMedicine {
  id: string; // registration number
  name: string;
  activeIngredients: string[];
  similarity?: number; // Backend-calculated similarity score (0-1)
}

/**
 * Drug interaction result from API
 */
export interface ApiInteraction {
  interactionId: string;
  firstReactant: string;
  secondReactant: string;
  severity?: string;
  explanation?: string;
  action?: string;
  warningCode?: string;
  actionRating?: {
    rating: string;
    description: string;
  };
  severityRating?: {
    rating: string;
    description: string;
  };
  evidenceRating?: {
    rating: string;
    description: string;
  };
}

/**
 * Interaction check response
 */
export interface InteractionCheckResponse {
  count: number;
  interactions: ApiInteraction[];
  medicines: ApiMedicine[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an HTTP request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = API_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Search for medicines by name
   */
  async searchMedicines(query: string): Promise<ApiMedicine[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/api/medicines/search?q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching medicines:', error);
      throw new Error('Failed to search medicines. Please check your connection.');
    }
  }

  /**
   * Batch search for multiple medicine names at once
   * Uses dedicated batch endpoint for optimal performance
   */
  async batchSearchMedicines(queries: string[], limit: number = 10): Promise<Map<string, ApiMedicine[]>> {
    if (queries.length === 0) {
      return new Map();
    }

    const requestBody = {
      queries,
      limit,
    };

    try {
      const url = `${this.baseUrl}/api/medicines/batch-search`;
      console.log('Batch search request:', {
        url,
        queries: queries.length,
        queriesList: queries,
        limit,
      });

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Batch search response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Batch search API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url,
          requestBody,
        });
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Batch search response data:', data);
      
      // Convert object map to Map
      const resultMap = new Map<string, ApiMedicine[]>();
      Object.entries(data.results).forEach(([query, medicines]) => {
        resultMap.set(query, medicines as ApiMedicine[]);
      });

      console.log(`Batch search successful: ${resultMap.size} queries processed`);
      return resultMap;
    } catch (error) {
      console.error('Error in batch search:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        queries,
        limit,
      });
      throw new Error('Failed to batch search medicines.');
    }
  }

  /**
   * Get medicine details by registration number
   */
  async getMedicineDetails(registrationNo: string): Promise<ApiMedicine | null> {
    try {
      const url = `${this.baseUrl}/api/medicines/${encodeURIComponent(registrationNo)}`;
      const response = await this.fetchWithTimeout(url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching medicine details:', error);
      throw new Error('Failed to fetch medicine details. Please check your connection.');
    }
  }

  /**
   * Check drug interactions between medicines
   */
  async checkInteractions(
    medicineIds: string[],
    foodDrinkTobacco: boolean = false
  ): Promise<InteractionCheckResponse> {
    if (medicineIds.length === 0) {
      return { count: 0, interactions: [], medicines: [] };
    }

    try {
      const url = `${this.baseUrl}/api/interactions/check`;
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicineIds,
          foodDrinkTobacco,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read response');
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          method: 'POST',
          body: JSON.stringify({ medicineIds, foodDrinkTobacco }),
          response: errorText
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking interactions:', error);
      throw new Error('Failed to check interactions. Please check your connection.');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/`;
      const response = await this.fetchWithTimeout(url, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };

