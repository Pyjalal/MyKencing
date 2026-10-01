"""Model factories. Everything goes through OpenRouter's OpenAI-compatible API."""
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from .config import Settings

_HEADERS = {"X-Title": "MyKencing Dhia"}


def _chat(settings: Settings, model: str, temperature: float, max_tokens: int) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=settings.request_timeout_s,
        max_retries=1,
        default_headers=_HEADERS,
        # Ask OpenRouter to report the real cost of each call (used by the budget guard).
        extra_body={"usage": {"include": True}},
    )


def answer_models(settings: Settings, tools: list) -> tuple[BaseChatModel, BaseChatModel]:
    """(tool_model, plain_model). Both fall back to a second provider if the primary fails.

    plain_model keeps the tool schemas bound but forbids calling them: providers reject a
    history containing tool calls when no tools are declared.
    """
    primary = _chat(settings, settings.chat_model, 0.2, 800)
    fallback = _chat(settings, settings.fallback_model, 0.2, 800)
    tool_model = primary.bind_tools(tools).with_fallbacks([fallback.bind_tools(tools)])
    plain_model = primary.bind_tools(tools, tool_choice="none").with_fallbacks(
        [fallback.bind_tools(tools, tool_choice="none")])
    return tool_model, plain_model


def classifier_model(settings: Settings) -> ChatOpenAI:
    return _chat(settings, settings.classifier_model, 0.0, 100)


def embeddings(settings: Settings) -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers=_HEADERS,
        # OpenRouter accepts raw strings; skip tiktoken-based chunking meant for OpenAI models.
        check_embedding_ctx_length=False,
    )
