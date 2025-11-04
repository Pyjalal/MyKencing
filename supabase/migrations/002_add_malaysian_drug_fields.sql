-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index on medicine name for full text search (trigram-based fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_medicine_ingredients_medicine_name_trgm 
ON medicine_ingredients USING gin(medicine_name gin_trgm_ops);

