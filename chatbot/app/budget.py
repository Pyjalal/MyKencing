"""Daily OpenRouter spend guard and per-request cost/token accounting.

State is in-process: the service runs on a single Fly machine, so this is exact there.
"""
import datetime as dt
import threading
from typing import Any

from langchain_core.callbacks import AsyncCallbackHandler
from langchain_core.outputs import LLMResult


class DailyBudget:
    def __init__(self, limit_usd: float):
        self.limit_usd = limit_usd
        self._day = dt.date.today()
        self._spent = 0.0
        self._lock = threading.Lock()

    def _roll(self) -> None:
        today = dt.date.today()
        if today != self._day:
            self._day, self._spent = today, 0.0

    def exhausted(self) -> bool:
        with self._lock:
            self._roll()
            return self._spent >= self.limit_usd

    def add(self, usd: float) -> None:
        with self._lock:
            self._roll()
            self._spent += usd

    @property
    def spent(self) -> float:
        with self._lock:
            self._roll()
            return self._spent


class UsageTracker(AsyncCallbackHandler):
    """Collects tokens, cost and model names for one request (OpenRouter reports `usage.cost`)."""

    def __init__(self) -> None:
        self.cost_usd = 0.0
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.models: list[str] = []

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        for gens in response.generations:
            for gen in gens:
                meta = getattr(getattr(gen, "message", None), "response_metadata", {}) or {}
                usage = meta.get("token_usage") or {}
                self.cost_usd += float(usage.get("cost") or 0.0)
                self.prompt_tokens += int(usage.get("prompt_tokens") or 0)
                self.completion_tokens += int(usage.get("completion_tokens") or 0)
                if meta.get("model_name"):
                    self.models.append(meta["model_name"])
