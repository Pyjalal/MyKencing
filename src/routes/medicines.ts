import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { IngredientMapper } from '../services/ingredient-mapper.js';
import { ScrapingError, ValidationError } from '../types.js';

const medicines = new Hono();

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long')
});

const batchSearchSchema = z.object({
  queries: z.array(z.string().min(1).max(100))
    .min(1, 'At least one query is required')
    .max(100, 'Maximum 100 queries allowed per batch'),
  limit: z.number().min(1).max(50).default(10).optional()
});

medicines.post(
  '/batch-search',
  async (c: Context) => {
    try {
      const body = await c.req.json();
      const validation = batchSearchSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation error', 
          details: validation.error.issues 
        }, 400);
      }
      
      const { queries, limit = 10 } = validation.data;
      const ingredientMapper = new IngredientMapper();
      
      // Execute all searches in parallel
      const searchPromises = queries.map(async (query) => {
        try {
          const results = await ingredientMapper.searchMedicines(query);
          return {
            query,
            results: results.slice(0, limit)
          };
        } catch (error) {
          // If one search fails, return empty results for that query
          console.error(`Batch search failed for query "${query}":`, error);
          return {
            query,
            results: []
          };
        }
      });
      
      const searchResults = await Promise.all(searchPromises);
      
      // Convert array to object map for easier client-side lookup
      const resultsMap: Record<string, any[]> = {};
      searchResults.forEach(({ query, results }) => {
        resultsMap[query] = results;
      });
      
      return c.json({
        results: resultsMap,
        count: queries.length
      });
    } catch (error) {
      if (error instanceof ScrapingError) {
        return c.json(
          { 
            error: 'Failed to batch search medicines', 
            message: error.message,
            source: error.source 
          },
          500
        );
      }
      
      if (error instanceof ValidationError) {
        return c.json(
          { 
            error: 'Validation error', 
            message: error.message 
          },
          400
        );
      }
      
      return c.json(
        { 
          error: 'Internal server error', 
          message: 'An unexpected error occurred' 
        },
        500
      );
    }
  }
);

medicines.get(
  '/search',
  async (c: Context) => {
    try {
      const query = c.req.query('q');
      if (!query) {
        return c.json({ error: 'Search query is required' }, 400);
      }
      
      const validation = searchSchema.safeParse({ q: query });
      if (!validation.success) {
        return c.json({ 
          error: 'Validation error', 
          details: validation.error.issues 
        }, 400);
      }
      
      const { q } = validation.data;
      const ingredientMapper = new IngredientMapper();
      
      const results = await ingredientMapper.searchMedicines(q);
      
      return c.json({
        results
      });
    } catch (error) {
      if (error instanceof ScrapingError) {
        return c.json(
          { 
            error: 'Failed to search medicines', 
            message: error.message,
            source: error.source 
          },
          500
        );
      }
      
      if (error instanceof ValidationError) {
        return c.json(
          { 
            error: 'Validation error', 
            message: error.message 
          },
          400
        );
      }
      
      return c.json(
        { 
          error: 'Internal server error', 
          message: 'An unexpected error occurred' 
        },
        500
      );
    }
  }
);

medicines.get(
  '/:registrationNo',
  async (c: Context) => {
    try {
      const registrationNo = c.req.param('registrationNo');
      
      if (!registrationNo || !/^[A-Z0-9]+$/.test(registrationNo)) {
        return c.json(
          { 
            error: 'Invalid registration number', 
            message: 'Registration number must contain only uppercase letters and numbers' 
          },
          400
        );
      }
      
      const ingredientMapper = new IngredientMapper();
      const medicine = await ingredientMapper.getIngredientsForMedicine(registrationNo);
      
      if (!medicine) {
        return c.json(
          { 
            error: 'Medicine not found', 
            message: `No medicine found with registration number ${registrationNo}` 
          },
          404
        );
      }
      
      return c.json(medicine);
    } catch (error) {
      if (error instanceof ScrapingError) {
        return c.json(
          { 
            error: 'Failed to fetch medicine details', 
            message: error.message,
            source: error.source 
          },
          500
        );
      }
      
      return c.json(
        { 
          error: 'Internal server error', 
          message: 'An unexpected error occurred' 
        },
        500
      );
    }
  }
);

export default medicines;
