import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config, isCloudflareWorkers, isNode } from './config.js';
import medicines from './routes/medicines.js';
import interactions from './routes/interactions.js';
import { ScrapingError, ValidationError } from './types.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/', (c) => {
  return c.json({
    message: 'Hono Medicine API',
    version: '1.0.0',
    status: 'healthy',
    environment: config.NODE_ENV,
    runtime: isCloudflareWorkers ? 'cloudflare-workers' : isNode ? 'node' : 'unknown'
  });
});

app.route('/api/medicines', medicines);
app.route('/api/interactions', interactions);

app.onError((err, c) => {
  if (err instanceof ScrapingError) {
    return c.json(
      {
        error: 'Scraping error',
        message: err.message,
        source: err.source,
        timestamp: new Date().toISOString()
      },
      500
    );
  }

  if (err instanceof ValidationError) {
    return c.json(
      {
        error: 'Validation error',
        message: err.message,
        timestamp: new Date().toISOString()
      },
      400
    );
  }

  if (err.name === 'ZodError') {
    return c.json(
      {
        error: 'Validation error',
        message: 'Invalid request data',
        details: err.message,
        timestamp: new Date().toISOString()
      },
      400
    );
  }

  if (err instanceof TypeError && err.message.includes('fetch')) {
    return c.json(
      {
        error: 'Network error',
        message: 'Failed to connect to external service',
        timestamp: new Date().toISOString()
      },
      503
    );
  }

  return c.json(
    {
      error: 'Internal server error',
      message: config.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    },
    500
  );
});

app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      message: 'The requested resource was not found',
      timestamp: new Date().toISOString()
    },
    404
  );
});

export default app;
