"""FastAPI service: POST /ask, GET /health."""
import hashlib
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Literal

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded

from . import agent, llm, prompts, safety
from .budget import DailyBudget, UsageTracker
from .config import get_settings
from .tools.api_tools import build_api_tools
from .tools.guidelines import build_guideline_tool
from .tools.sources import SourceRegistry

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("dhia")
settings = get_settings()


def client_ip(request: Request) -> str:
    return request.headers.get("fly-client-ip") or (request.client.host if request.client else "unknown")


class _OffTopic(Exception):
    pass


limiter = Limiter(key_func=client_ip)
budget = DailyBudget(settings.daily_budget_usd)


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=settings.max_message_chars)


class AskRequest(BaseModel):
    history: list[Turn] = Field(min_length=1)
    language: Literal["en", "ms"] = "en"
    context: str | None = Field(default=None, max_length=8000)


@asynccontextmanager
async def lifespan(app: FastAPI):
    timeout = httpx.Timeout(20.0, connect=5.0)
    app.state.api = httpx.AsyncClient(base_url=settings.mymedix_api_url, timeout=timeout)
    app.state.supabase = httpx.AsyncClient(
        base_url=settings.supabase_url, timeout=timeout,
        headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {settings.supabase_anon_key}"})
    app.state.embedder = llm.embeddings(settings)
    app.state.classifier = llm.classifier_model(settings)
    yield
    await app.state.api.aclose()
    await app.state.supabase.aclose()


app = FastAPI(title="MyMedix Chatbot (Dhia)", version="2.0.0", lifespan=lifespan, docs_url=None, redoc_url=None)
app.state.limiter = limiter
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


def _lang(request: Request) -> str:
    return getattr(request.state, "language", "en")


@app.exception_handler(RateLimitExceeded)
async def rate_limited(request: Request, exc: RateLimitExceeded):
    return JSONResponse({"error": "rate_limited", "answer": prompts.BUSY_REPLY[_lang(request)]}, status_code=429)


@app.exception_handler(RequestValidationError)
async def invalid(request: Request, exc: RequestValidationError):
    reason = "; ".join(f"{'.'.join(map(str, e['loc'][1:]))}: {e['msg']}" for e in exc.errors())
    return JSONResponse({"error": f"invalid_request: {reason}", "answer": prompts.INVALID_REPLY["en"]}, status_code=400)


@app.get("/")
@app.get("/health")
async def health():
    return {"status": "healthy", "model": settings.chat_model}


@app.post("/ask")
@limiter.limit(settings.rate_limit)
async def ask(request: Request, body: AskRequest):
    started = time.perf_counter()
    rid = request.headers.get("fly-request-id") or uuid.uuid4().hex[:12]
    lang = body.language
    request.state.language = lang
    history = [t.model_dump() for t in body.history][-settings.max_history_turns:]
    last_user = next((t["content"] for t in reversed(history) if t["role"] == "user"), "")
    entry = {"event": "ask", "request_id": rid, "language": lang, "turns": len(history),
             "msg_chars": len(last_user), "msg_hash": hashlib.sha256(last_user.encode()).hexdigest()[:12],
             "has_context": bool(body.context)}

    def done(status: int, payload: dict, **extra) -> JSONResponse:
        entry.update(status=status, latency_ms=round((time.perf_counter() - started) * 1000), **extra)
        log.info(json.dumps(entry))
        return JSONResponse(payload, status_code=status)

    if not last_user.strip():
        return done(400, {"error": "history must contain a user message", "answer": prompts.INVALID_REPLY[lang]})

    fixed = safety.triage(last_user, lang)
    if fixed:
        return done(200, {"answer": fixed, "sources": []}, safety="triage")

    if budget.exhausted():
        return done(503, {"error": "daily_budget_exhausted", "answer": prompts.BUSY_REPLY[lang]}, safety="budget")

    tracker = UsageTracker()
    cfg = {"callbacks": [tracker]}
    result = None
    try:
        on_topic = await safety.is_on_topic(app.state.classifier.with_config(cfg), last_user)
        if not on_topic:
            raise _OffTopic
        registry = SourceRegistry()
        tools = build_api_tools(app.state.api, registry) + [
            build_guideline_tool(app.state.supabase, app.state.embedder, registry)]
        tool_model, plain_model = llm.answer_models(settings, tools)
        graph = agent.build_graph(tool_model, plain_model, tools, settings.max_tool_calls)
        result = await agent.run_agent(graph=graph, plain_model=plain_model, registry=registry, history=history,
                                       language=lang, context=body.context, max_tool_calls=settings.max_tool_calls,
                                       config=cfg)
    except _OffTopic:
        pass
    except Exception as e:  # noqa: BLE001 - never leak internals to the app
        log.exception("ask failed")
        entry["failure"] = type(e).__name__
    budget.add(tracker.cost_usd)
    entry.update(cost_usd=round(tracker.cost_usd, 6), prompt_tokens=tracker.prompt_tokens,
                 completion_tokens=tracker.completion_tokens, models=sorted(set(tracker.models)))

    if "failure" in entry:
        return done(503, {"error": "model_unavailable", "answer": prompts.BUSY_REPLY[lang]})
    if result is None:
        return done(200, {"answer": prompts.OFF_TOPIC_REPLY[lang], "sources": []}, safety="off_topic")
    return done(200, {"answer": result.answer, "sources": result.sources},
                tools=result.tools_used, tool_failures=result.tool_failures, retried=result.retried,
                fell_back=result.fell_back, cited=len(result.sources))
