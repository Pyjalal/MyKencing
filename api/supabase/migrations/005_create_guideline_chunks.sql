-- Clinical guideline knowledge base for the Dhia chatbot (chatbot/).
-- Written by chatbot/ingest (service role); read by the chatbot through match_guideline_chunks (anon).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS guideline_documents (
  id TEXT PRIMARY KEY,                 -- stable slug, e.g. 'cpg-hypertension'
  title TEXT NOT NULL,
  version TEXT NOT NULL,               -- e.g. '5th Edition (2018)'
  source_url TEXT,
  sha256 TEXT NOT NULL,                -- hash of the source file; unchanged => skip re-ingest
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guideline_chunks (
  id BIGSERIAL PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES guideline_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  heading TEXT,
  content TEXT NOT NULL,
  embedding vector(1024) NOT NULL,     -- baai/bge-m3
  fts tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(heading, '') || ' ' || content)) STORED,
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS guideline_chunks_embedding_idx
  ON guideline_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS guideline_chunks_fts_idx ON guideline_chunks USING gin (fts);

-- Read-only for the public (anon) key; writes require the service role.
ALTER TABLE guideline_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guideline_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guideline_documents read" ON guideline_documents;
CREATE POLICY "guideline_documents read" ON guideline_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "guideline_chunks read" ON guideline_chunks;
CREATE POLICY "guideline_chunks read" ON guideline_chunks FOR SELECT USING (true);

-- Hybrid search: vector similarity + full-text, fused with Reciprocal Rank Fusion (k = 60).
CREATE OR REPLACE FUNCTION match_guideline_chunks(
  query_text TEXT,
  query_embedding vector(1024),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id BIGINT,
  document_id TEXT,
  document_title TEXT,
  source_url TEXT,
  heading TEXT,
  content TEXT,
  score DOUBLE PRECISION
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  WITH semantic AS (
    SELECT c.id, ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS rank
    FROM guideline_chunks c
    ORDER BY c.embedding <=> query_embedding
    LIMIT 30
  ),
  keyword AS (
    SELECT c.id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.fts, q) DESC) AS rank
    FROM guideline_chunks c, websearch_to_tsquery('english', query_text) q
    WHERE c.fts @@ q
    ORDER BY ts_rank_cd(c.fts, q) DESC
    LIMIT 30
  ),
  fused AS (
    SELECT COALESCE(s.id, k.id) AS id,
           COALESCE(1.0 / (60 + s.rank), 0) + COALESCE(1.0 / (60 + k.rank), 0) AS score
    FROM semantic s FULL OUTER JOIN keyword k ON s.id = k.id
  )
  SELECT c.id, c.document_id, d.title || ' — ' || d.version, d.source_url, c.heading, c.content, f.score
  FROM fused f
  JOIN guideline_chunks c ON c.id = f.id
  JOIN guideline_documents d ON d.id = c.document_id
  ORDER BY f.score DESC
  LIMIT LEAST(match_count, 10);
$$;

GRANT EXECUTE ON FUNCTION match_guideline_chunks(TEXT, vector, INT) TO anon, authenticated;
