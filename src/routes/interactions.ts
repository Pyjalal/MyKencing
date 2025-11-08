import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { IngredientMapper } from '../services/ingredient-mapper.js';
import { StockleyService } from '../services/stockley.js';
import { ScrapingError, ValidationError } from '../types.js';

const interactions = new Hono();

const interactionCheckSchema = z.object({
  medicineIds: z.array(z.string().regex(/^[A-Z0-9]+$/, 'Invalid registration number format'))
    .min(1, 'At least 1 medicine required for interaction check')
    .max(10, 'Maximum 10 medicines allowed for interaction check'),
  foodDrinkTobacco: z.boolean().default(false).optional().describe('If true, will check for interactions with food, drink, and tobacco of the ingredients ONLY. Otherwise will check for interactions with all other ingredients.'),
});

interactions.post(
  '/check',
  async (c: Context) => {
    try {
      const body = await c.req.json();
      const validation = interactionCheckSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation error', 
          details: validation.error.issues 
        }, 400);
      }
      
      const { medicineIds, foodDrinkTobacco } = validation.data;

      const ingredientMapper = new IngredientMapper();
      const stockleyService = new StockleyService();
      const medicines = await ingredientMapper.getIngredientsForMedicines(medicineIds);

      if (medicines.length === 0) {
        return c.json(
          {
            error: 'No medicines found',
            message: 'None of the provided medicine IDs were found'
          },
          404
        );
      }

      const interactions = await stockleyService.checkInteractions(medicineIds, foodDrinkTobacco ?? false);
      
      return c.json({
        count: interactions.length,
        interactions,
        medicines
      });
    } catch (error) {
      if (error instanceof ScrapingError) {
        return c.json(
          { 
            error: 'Failed to check interactions', 
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

interactions.get(
  '/cache/stats',
  async (c: Context) => {
    try {
      const stockleyService = new StockleyService();
      const stats = await stockleyService.getCacheStats();

      return c.json({
        cache: stats
      });
    } catch {
      return c.json(
        {
          error: 'Failed to get cache statistics',
          message: 'An unexpected error occurred'
        },
        500
      );
    }
  }
);

interactions.delete(
  '/cache',
  async (c: Context) => {
    try {
      const stockleyService = new StockleyService();
      await stockleyService.clearCache();

      return c.json({
        message: 'Cache cleared successfully'
      });
    } catch {
      return c.json(
        {
          error: 'Failed to clear cache',
          message: 'An unexpected error occurred'
        },
        500
      );
    }
  }
);

export default interactions;
