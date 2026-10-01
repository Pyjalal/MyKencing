-- Create medicine_ingredients table
CREATE TABLE IF NOT EXISTS medicine_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_no TEXT UNIQUE NOT NULL,
    medicine_name TEXT NOT NULL,
    active_ingredients TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on registration_no for faster lookups
CREATE INDEX IF NOT EXISTS idx_medicine_ingredients_registration_no 
ON medicine_ingredients(registration_no);

-- Create index on active_ingredients for array searches
CREATE INDEX IF NOT EXISTS idx_medicine_ingredients_active_ingredients 
ON medicine_ingredients USING GIN(active_ingredients);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_medicine_ingredients_updated_at 
    BEFORE UPDATE ON medicine_ingredients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
