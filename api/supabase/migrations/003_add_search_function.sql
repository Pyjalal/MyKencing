-- Precise medicine matching for OCR (no fuzzy matching)
-- Features: Exact substring matches at word boundaries only
CREATE OR REPLACE FUNCTION search_medicines_by_similarity(
  search_term TEXT,
  max_results INT DEFAULT 50
)
RETURNS TABLE (
  registration_no TEXT,
  medicine_name TEXT,
  active_ingredients TEXT[],
  similarity_score FLOAT
) AS $$
DECLARE
  search_len INT := LENGTH(search_term);
BEGIN
  -- Ignore very short search terms (< 3 chars) - too many false positives
  IF search_len < 3 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mi.registration_no,
    mi.medicine_name,
    mi.active_ingredients,
    CASE
      -- TIER 1: Exact match = 100%
      WHEN LOWER(mi.medicine_name) = LOWER(search_term) THEN 1.0::DOUBLE PRECISION

      -- TIER 2: Prefix match (starts with search term) = 95%
      WHEN LOWER(mi.medicine_name) LIKE LOWER(search_term) || '%' THEN 0.95::DOUBLE PRECISION

      -- TIER 3: Word-boundary substring match with reasonable requirements
      -- - Search term must be >40% of medicine name length (relaxed)
      -- - Must be at word boundary (space, start, or end)
      -- - Score: 70% + coverage bonus (up to 85%)
      WHEN LOWER(mi.medicine_name) LIKE '%' || LOWER(search_term) || '%'
           AND (search_len::FLOAT / LENGTH(mi.medicine_name)) > 0.4
           AND (
             -- At start of medicine name
             POSITION(LOWER(search_term) IN LOWER(mi.medicine_name)) = 1
             -- OR at end of medicine name
             OR POSITION(LOWER(search_term) IN LOWER(mi.medicine_name)) = LENGTH(mi.medicine_name) - search_len + 1
             -- OR bounded by spaces (word boundary)
             OR LOWER(mi.medicine_name) LIKE '% ' || LOWER(search_term) || ' %'
             OR LOWER(mi.medicine_name) LIKE LOWER(search_term) || ' %'
             OR LOWER(mi.medicine_name) LIKE '% ' || LOWER(search_term)
           )
      THEN (0.70 + (search_len::FLOAT / LENGTH(mi.medicine_name)) * 0.15)::DOUBLE PRECISION

      ELSE 0.0::DOUBLE PRECISION
    END AS similarity_score
  FROM medicine_ingredients mi
  WHERE
    -- Must have exact substring match
    LOWER(mi.medicine_name) LIKE '%' || LOWER(search_term) || '%'
  ORDER BY
    similarity_score DESC,
    LENGTH(mi.medicine_name) ASC  -- Prefer shorter, more specific names
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

