-- Create drug_interactions_cache table
CREATE TABLE IF NOT EXISTS drug_interactions_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_ids TEXT[] NOT NULL,
    food_drink_tobacco BOOLEAN NOT NULL DEFAULT false,
    stockley_response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on medicine_ids and food_drink_tobacco for cache lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_drug_interactions_cache_unique_lookup
ON drug_interactions_cache(medicine_ids, food_drink_tobacco);

-- Create index on created_at for cleanup of old cache entries
CREATE INDEX IF NOT EXISTS idx_drug_interactions_cache_created_at
ON drug_interactions_cache(created_at);

-- Create function to clean up old cache entries (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_interactions_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM drug_interactions_cache
    WHERE created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_drug_interactions_cache_updated_at
    BEFORE UPDATE ON drug_interactions_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
