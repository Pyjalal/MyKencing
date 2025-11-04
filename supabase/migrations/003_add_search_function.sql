-- Create search function with intelligent ranking
-- Prioritizes: exact match > starts with > contains > fuzzy similarity
CREATE OR REPLACE FUNCTION search_medicines_by_similarity(
  search_term TEXT,
  match_threshold FLOAT DEFAULT 0.1,
  max_results INT DEFAULT 50
)
RETURNS TABLE (
  registration_no TEXT,
  medicine_name TEXT,
  active_ingredients TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mi.registration_no,
    mi.medicine_name,
    mi.active_ingredients
  FROM medicine_ingredients mi
  WHERE 
    LOWER(mi.medicine_name) LIKE '%' || LOWER(search_term) || '%'
    OR similarity(mi.medicine_name, search_term) > match_threshold
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN LOWER(mi.medicine_name) = LOWER(search_term) THEN 0 ELSE 1 END,
    -- Then words that start with the search term
    CASE WHEN LOWER(mi.medicine_name) LIKE LOWER(search_term) || '%' THEN 0 ELSE 1 END,
    -- Then similarity score for remaining results
    similarity(mi.medicine_name, search_term) DESC,
    -- Finally sort by length (shorter = more specific)
    LENGTH(mi.medicine_name)
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

