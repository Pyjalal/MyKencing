from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    chat_model: str = "google/gemini-2.5-flash"
    fallback_model: str = "openai/gpt-4.1-mini"
    classifier_model: str = "google/gemini-2.5-flash-lite"
    embedding_model: str = "baai/bge-m3"

    supabase_url: str
    supabase_anon_key: str
    mymedix_api_url: str = "https://mymedix-api.fly.dev"

    max_history_turns: int = 20
    max_message_chars: int = 4000
    max_tool_calls: int = 4
    rate_limit: str = "20/minute"
    daily_budget_usd: float = 1.0
    request_timeout_s: float = 45.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
