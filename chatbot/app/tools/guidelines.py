"""Hybrid (vector + full-text) search over Malaysian clinical practice guidelines in Supabase."""
import httpx
from langchain_core.embeddings import Embeddings
from langchain_core.tools import tool

from .sources import SourceRegistry

MAX_CHUNK_CHARS = 1800


def build_guideline_tool(client: httpx.AsyncClient, embedder: Embeddings, registry: SourceRegistry):
    @tool
    async def search_guidelines(query: str) -> str:
        """Search Malaysian clinical practice guidelines (hypertension, type 2 diabetes,
        dyslipidaemia, obesity, chronic kidney disease, heart failure) and MyKencing's clinical
        thresholds. Use for targets, normal ranges, diagnosis criteria, lifestyle advice and
        general treatment approaches. Write the query in English for best results."""
        try:
            vector = await embedder.aembed_query(query)
            r = await client.post("/rest/v1/rpc/match_guideline_chunks",
                                  json={"query_text": query, "query_embedding": vector, "match_count": 5})
            r.raise_for_status()
            rows = r.json()
        except Exception as e:  # noqa: BLE001
            return (f"UNAVAILABLE: guideline search failed ({type(e).__name__}). "
                    "Answer only from other sources, or say you cannot check.")
        if not rows:
            return "No relevant guideline passages found."
        out = []
        for row in rows:
            sid = registry.add("guideline", row["document_title"], str(row["id"]),
                               url=row.get("source_url"), section=row.get("heading") or None)
            heading = f" - {row['heading']}" if row.get("heading") else ""
            out.append(f"[{sid}] {row['document_title']}{heading}\n{row['content'][:MAX_CHUNK_CHARS]}")
        return "\n\n".join(out)

    return search_guidelines
