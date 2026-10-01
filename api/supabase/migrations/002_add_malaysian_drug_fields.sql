-- Enable pg_trgm extension for fuzzy text search and similarity ranking
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for fast trigram similarity searches
CREATE INDEX IF NOT EXISTS idx_medicine_ingredients_medicine_name_trgm 
ON medicine_ingredients USING gin(medicine_name gin_trgm_ops);

