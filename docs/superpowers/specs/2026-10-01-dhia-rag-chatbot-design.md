# Dhia RAG Chatbot — Design

**Date:** 2026-10-01 · **Status:** Approved in chat (written spec review waived by owner)

## Goal
Replace the minimal Node relay at `chatbot/` with a production-grade, retrieval-augmented assistant ("Dhia") that answers MyKencing users' medication and health questions in English and Bahasa Melayu, grounded in cited sources.

## Decisions
| Topic | Decision |
|---|---|
| Knowledge | (A) Malaysian medicines + Stockley interactions via the existing MyMedix API, (B) public Malaysian CPGs + `src/constants/clinical.ts`, (C) user records from the request `context` field (never stored) |
| Target | Production: evals, logging, rate limits, cost guard, safety guardrails |
| Stack | Python 3.12, FastAPI, LangChain + LangGraph, Fly.io (`mymedix-chatbot`, `sin`) |
| LLM | OpenRouter: `google/gemini-2.5-flash` primary, `openai/gpt-4.1-mini` fallback, `google/gemini-2.5-flash-lite` classifier |
| Embeddings | OpenRouter `baai/bge-m3` (1024-d, multilingual) |
| Vector store | Supabase pgvector in the existing `mymedix-api` project; hybrid (vector + full-text, RRF) search via SQL function |
| Clinical reviewer | None assigned — compensate with mandatory citations and "refuse rather than guess" |

## API contract (backward compatible)
`POST /ask` `{ history: [{role, content}], language: "en"|"ms", context?: string }`
→ `200 { answer: string, sources: [{ id, type, title, url?, section? }] }`
Errors: `400` invalid input, `429` rate limited, `503` model/budget unavailable — all with `{ error, answer }` where `answer` is a user-facing message in the request language.
`GET /health` → `{ status, model }`.

## Components
- `app/main.py` — FastAPI, validation (≤20 turns, ≤4000 chars/msg), rate limit (20/min per client IP), request IDs, JSON logs.
- `app/agent.py` — LangGraph ReAct agent, ≤4 tool calls, primary model with fallback.
- `app/tools/` — `search_guidelines`, `search_medicines`, `get_medicine`, `check_interactions` (by ingredient names). Each returns numbered sources (`[G1]`, `[M1]`, `[I1]`) recorded in a per-request `SourceRegistry`. Tool failures return explicit `UNAVAILABLE` text.
- `app/safety.py` — pre: deterministic emergency detection (en/ms) → fixed 999 reply; classifier for off-topic / injection. Post: citation validity, no dose-change instructions, language match; one corrective retry then safe fallback.
- `app/budget.py` — daily OpenRouter spend cap (in-process; single machine).
- `ingest/` — downloads CPG PDFs listed in `sources.yaml` (browser-impersonating client; MOH blocks plain clients), converts to Markdown (`pymupdf4llm`, tables preserved), heading-aware chunking, embeds, upserts by document version.
- Migration `api/supabase/migrations/005_create_guideline_chunks.sql` — `guideline_documents`, `guideline_chunks` (vector(1024) + tsvector), RLS read-only for anon, `match_guideline_chunks` hybrid RPC.

## Guideline corpus (v1)
Hypertension 5th Ed (2018), T2DM 6th Ed (2020), Dyslipidaemia 6th Ed (2023), Obesity 2nd Ed (2023), CKD 2nd Ed (2018), Heart Failure 5th Ed (2023) — all from moh.gov.my; plus MyKencing clinical thresholds.

## Answer rules
Cite every medical claim with a source id; never instruct starting/stopping/changing a dose; if sources don't support an answer, say so and refer to a doctor/pharmacist; a failed tool means "could not check", never "no interaction".

## Logging & privacy
Log request id, latency, tools + outcome, model, tokens, cost, safety flags. Never log message content (lengths/hashes only).

## Testing
- Unit (pytest): safety, validation, citations, chunking, tools (mocked HTTP).
- Agent: full graph with a scripted fake model.
- Evals (`evals/`): ~60 en/ms cases — rule checks (emergency, refusal, dose-change, required tools, citations, language) + RAGAS faithfulness/answer relevancy. CI fails below thresholds.

## Deployment
`.github/workflows/chatbot.yml`: tests on `chatbot/**` changes, evals on PRs and manual dispatch, deploy to Fly on `master` using a chatbot-scoped token. Android/iOS workflows ignore `chatbot/**`. Rollback = redeploy previous commit.

## Out of scope
Citation UI in the app, server-side conversation memory, streaming.
