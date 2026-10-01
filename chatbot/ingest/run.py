"""Build the guideline knowledge base in Supabase.

    uv run python -m ingest.run            # ingest new/changed documents
    uv run python -m ingest.run --force    # re-ingest everything

Needs OPENROUTER_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (chatbot/.env).
Runs locally or in CI; never on the Fly machine (keeps the runtime image small).
"""
import argparse
import hashlib
import os
import re
import sys
import time
from pathlib import Path

import httpx
import pymupdf4llm
import yaml
from curl_cffi import requests as browser_requests
from dotenv import load_dotenv
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / ".cache"
CHUNK_CHARS = 1500
CHUNK_OVERLAP = 200
MIN_CHUNK_CHARS = 200
EMBED_BATCH = 64

# Sections that add noise to retrieval rather than clinical guidance.
SKIP_HEADING = re.compile(r"reference|bibliograph|acknowledg|disclosure|conflict of interest|"
                          r"development group|review(er)? committee|table of contents|abbreviation|"
                          r"appendix .*search strateg|clinical questions", re.IGNORECASE)
TOC_LINE = re.compile(r"\.{6,}\s*\d+\s*$", re.MULTILINE)


def fetch(doc: dict) -> bytes:
    """Return the source bytes, downloading once into ingest/.cache (MOH blocks non-browser clients)."""
    if "path" in doc:
        return (ROOT / doc["path"]).resolve().read_bytes()
    CACHE.mkdir(exist_ok=True)
    cached = CACHE / f"{doc['id']}.pdf"
    if cached.exists() and cached.read_bytes()[:4] == b"%PDF":
        return cached.read_bytes()
    for attempt in range(3):
        try:
            r = browser_requests.get(doc["url"], impersonate="chrome", timeout=600)
            r.raise_for_status()
            if r.content[:4] != b"%PDF":
                raise ValueError("response is not a PDF")
            cached.write_bytes(r.content)
            return r.content
        except Exception as e:  # noqa: BLE001
            print(f"  download attempt {attempt + 1} failed: {e}")
            time.sleep(5)
    raise RuntimeError(f"could not download {doc['url']}")


def to_markdown(doc: dict, data: bytes) -> str:
    if "path" in doc:
        return f"# {doc['title']}\n\n```ts\n{data.decode('utf-8')}\n```"
    tmp = CACHE / f"{doc['id']}.pdf"
    return pymupdf4llm.to_markdown(str(tmp), ignore_images=True, show_progress=False)


def chunk(markdown: str) -> list[dict]:
    markdown = TOC_LINE.sub("", markdown)
    by_heading = MarkdownHeaderTextSplitter(
        [("#", "h1"), ("##", "h2"), ("###", "h3"), ("####", "h4")], strip_headers=False
    ).split_text(markdown)
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_CHARS, chunk_overlap=CHUNK_OVERLAP)
    chunks = []
    for section in by_heading:
        heading = " > ".join(re.sub(r"[*_`]", "", v).strip() for k, v in section.metadata.items() if v)[:300]
        if heading and SKIP_HEADING.search(heading):
            continue
        for piece in splitter.split_text(section.page_content):
            text = re.sub(r"\n{3,}", "\n\n", piece).strip()
            if len(text) >= MIN_CHUNK_CHARS:
                chunks.append({"heading": heading or None, "content": text})
    return chunks


def embed(texts: list[str]) -> list[list[float]]:
    out = []
    with httpx.Client(timeout=120) as client:
        for i in range(0, len(texts), EMBED_BATCH):
            batch = texts[i:i + EMBED_BATCH]
            for attempt in range(4):
                r = client.post("https://openrouter.ai/api/v1/embeddings",
                                headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
                                json={"model": os.environ.get("EMBEDDING_MODEL", "baai/bge-m3"), "input": batch})
                if r.status_code == 200 and "data" in r.json():
                    out.extend(d["embedding"] for d in sorted(r.json()["data"], key=lambda d: d["index"]))
                    break
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f"embedding failed: {r.status_code} {r.text[:200]}")
            print(f"  embedded {min(i + EMBED_BATCH, len(texts))}/{len(texts)}")
    return out


def main() -> int:
    load_dotenv(ROOT.parent / ".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", help="ingest a single document id")
    args = parser.parse_args()

    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    db = httpx.Client(base_url=f"{os.environ['SUPABASE_URL']}/rest/v1", timeout=120,
                      headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    existing = {d["id"]: d["sha256"] for d in db.get("/guideline_documents", params={"select": "id,sha256"}).json()}

    docs = yaml.safe_load((ROOT / "sources.yaml").read_text(encoding="utf-8"))["documents"]
    for doc in docs:
        if args.only and doc["id"] != args.only:
            continue
        print(f"[{doc['id']}] {doc['title']} ({doc['version']})")
        data = fetch(doc)
        digest = hashlib.sha256(data).hexdigest()
        if not args.force and existing.get(doc["id"]) == digest:
            print("  unchanged, skipping")
            continue
        chunks = chunk(to_markdown(doc, data))
        print(f"  {len(chunks)} chunks")
        vectors = embed([f"{c['heading'] or doc['title']}\n{c['content']}" for c in chunks])

        db.delete("/guideline_chunks", params={"document_id": f"eq.{doc['id']}"}).raise_for_status()
        db.post("/guideline_documents", headers={"Prefer": "resolution=merge-duplicates"},
                json={"id": doc["id"], "title": doc["title"], "version": doc["version"],
                      "source_url": doc.get("url"), "sha256": digest}).raise_for_status()
        rows = [{"document_id": doc["id"], "chunk_index": i, "heading": c["heading"], "content": c["content"],
                 "embedding": v} for i, (c, v) in enumerate(zip(chunks, vectors))]
        for i in range(0, len(rows), 100):
            db.post("/guideline_chunks", json=rows[i:i + 100]).raise_for_status()
        print(f"  stored {len(rows)} chunks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
