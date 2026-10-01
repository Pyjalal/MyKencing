import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const configSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  STOCKLEY_COOKIES: z.string().min(1),
  CACHE_TTL: z.string().transform(Number).default('3600000'),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const config = configSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  STOCKLEY_COOKIES: process.env.STOCKLEY_COOKIES,
  CACHE_TTL: process.env.CACHE_TTL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});

export const isCloudflareWorkers = typeof globalThis.navigator !== 'undefined' && 
  globalThis.navigator.userAgent?.includes('Cloudflare-Workers');

export const isNode = typeof process !== 'undefined' && process.versions?.node;
