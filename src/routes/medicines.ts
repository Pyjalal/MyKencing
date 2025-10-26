import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { IngredientMapper } from '../services/ingredient-mapper.js';
import { ScrapingError, ValidationError } from '../types.js';

const medicines = new Hono();

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long')
});

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
