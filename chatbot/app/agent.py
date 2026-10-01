"""The Dhia agent: a small LangGraph tool-calling loop plus post-answer guardrails."""
from dataclasses import dataclass, field
from typing import Annotated, TypedDict

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from . import prompts, safety
from .tools.sources import SourceRegistry


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    tool_calls: int


@dataclass
class AgentResult:
    answer: str
    sources: list[dict]
    tools_used: list[str] = field(default_factory=list)
    tool_failures: int = 0
    retried: bool = False
    fell_back: bool = False


def build_graph(tool_model: BaseChatModel, plain_model: BaseChatModel, tools: list, max_tool_calls: int):
    """tool_model has tools bound; plain_model answers without tools (used once the limit is hit)."""
    tool_node = ToolNode(tools, handle_tool_errors=lambda e: f"UNAVAILABLE: tool error ({type(e).__name__}).")

    async def agent(state: AgentState) -> dict:
        model = tool_model if state["tool_calls"] < max_tool_calls else plain_model
        return {"messages": [await model.ainvoke(state["messages"])]}

    async def run_tools(state: AgentState) -> dict:
        last = state["messages"][-1]
        calls = last.tool_calls[: max(0, max_tool_calls - state["tool_calls"])]
        replaced = []
        if len(calls) < len(last.tool_calls):
            # Trim calls beyond the budget; same id makes add_messages replace the original message,
            # so the history never contains a tool call without its result.
            last = AIMessage(content=last.content, tool_calls=calls, id=last.id)
            replaced = [last]
        out = await tool_node.ainvoke({"messages": [last]})
        return {"messages": replaced + out["messages"], "tool_calls": state["tool_calls"] + len(calls)}

    def route(state: AgentState) -> str:
        last = state["messages"][-1]
        return "tools" if isinstance(last, AIMessage) and last.tool_calls else END

    g = StateGraph(AgentState)
    g.add_node("agent", agent)
    g.add_node("tools", run_tools)
    g.add_edge(START, "agent")
    g.add_conditional_edges("agent", route, {"tools": "tools", END: END})
    g.add_edge("tools", "agent")
    return g.compile()


def to_messages(history: list[dict], system: str) -> list[AnyMessage]:
    msgs: list[AnyMessage] = [SystemMessage(system)]
    turns = list(history)
    while turns and turns[0]["role"] == "assistant":  # the app opens with a canned greeting
        turns.pop(0)
    for t in turns:
        msgs.append(HumanMessage(t["content"]) if t["role"] == "user" else AIMessage(t["content"]))
    return msgs


def system_prompt(language: str, context: str | None, max_tools: int) -> str:
    block = prompts.CONTEXT_BLOCK.format(context=context) if context else ""
    return prompts.SYSTEM_PROMPT.format(language=prompts.LANGUAGE_NAME[language], max_tools=max_tools,
                                        context_block=block)


async def run_agent(*, graph, plain_model: BaseChatModel, registry: SourceRegistry, history: list[dict],
                    language: str, context: str | None, max_tool_calls: int, config: dict) -> AgentResult:
    state = await graph.ainvoke(
        {"messages": to_messages(history, system_prompt(language, context, max_tool_calls)), "tool_calls": 0},
        config={**config, "recursion_limit": 2 * max_tool_calls + 4},
    )
    messages = state["messages"]
    tool_msgs = [m for m in messages if isinstance(m, ToolMessage)]
    result = AgentResult(
        answer=_text(messages[-1]),
        sources=[],
        tools_used=[m.name for m in tool_msgs],
        tool_failures=sum(str(m.content).startswith("UNAVAILABLE") for m in tool_msgs),
    )

    problems = safety.check_answer(result.answer, language, registry)
    if problems:
        result.retried = True
        retry = messages + [HumanMessage(prompts.RETRY_FEEDBACK.format(problems="; ".join(problems)))]
        result.answer = _text(await plain_model.ainvoke(retry, config=config))
        if safety.check_answer(result.answer, language, registry):
            result.answer = prompts.FALLBACK_REPLY[language]
            result.fell_back = True

    result.sources = registry.cited_in(result.answer)
    return result


def _text(msg: AnyMessage) -> str:
    content = msg.content
    if isinstance(content, list):  # some providers return content blocks
        content = "".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
    return str(content).strip()
