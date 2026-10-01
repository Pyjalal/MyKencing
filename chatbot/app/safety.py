"""Deterministic guardrails that run before and after the model."""
import json
import re

from langchain_core.language_models import BaseChatModel

from . import prompts
from .tools.sources import SourceRegistry

# --- Before the model -------------------------------------------------------------------------

# Red-flag symptoms -> fixed emergency reply. Deliberately conservative (better a false alarm).
_EMERGENCY = re.compile(
    r"chest (pain|tightness|pressure)|crushing chest|heart attack|"
    r"can'?t breathe|cannot breathe|difficulty breathing|struggling to breathe|short(ness)? of breath at rest|"
    r"face (is )?droop|slurred speech|stroke|one side of (my|his|her) body|sudden(ly)? (numb|weak)|"
    r"unconscious|passed out|fainted|not waking up|seizure|fitting|"
    r"cough(ing)? (up )?blood|vomit(ing)? blood|severe bleeding|"
    r"overdose|took too many (pills|tablets)|"
    r"(blood )?sugar (is )?(below|under) ?(3|2|1)\b|hypo and (confused|drowsy)|"
    r"sakit dada|dada (sesak|ketat|sakit)|serangan jantung|sesak nafas|tak boleh bernafas|tidak boleh bernafas|"
    r"susah bernafas|angin ahmar|strok|muka (senget|herot)|pelat tiba-tiba|pengsan|tidak sedarkan diri|"
    r"sawan|batuk darah|muntah darah|terlebih (dos|makan ubat)|makan ubat berlebihan",
    re.IGNORECASE,
)

_CRISIS = re.compile(
    r"suicid|kill myself|end my life|want to die|self[- ]harm|hurt myself|"
    r"bunuh diri|nak mati|ingin mati|mahu mati|cederakan diri",
    re.IGNORECASE,
)


def triage(message: str, language: str) -> str | None:
    """Return a fixed reply if the message needs one regardless of the model, else None."""
    if _CRISIS.search(message):
        return prompts.CRISIS_REPLY[language]
    if _EMERGENCY.search(message):
        return prompts.EMERGENCY_REPLY[language]
    return None


async def is_on_topic(classifier: BaseChatModel, message: str) -> bool:
    """Cheap off-topic filter. Fails open: if the classifier errors, let the main agent decide."""
    try:
        res = await classifier.ainvoke(prompts.CLASSIFIER_PROMPT.format(message=message[:1000]))
        text = str(res.content)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        return bool(json.loads(match.group(0)).get("on_topic", True)) if match else True
    except Exception:  # noqa: BLE001
        return True


# --- After the model --------------------------------------------------------------------------

_DOSE_VERBS = (
    r"(stop|discontinue|quit|skip|double|increase|decrease|reduce|lower|raise|cut down)\s+"
    r"(taking\s+)?(your|the|this|that|it|its)?\s*(doses?|dosage|medicines?|medications?|meds|tablets?|pills?|insulin)\b"
    r"|berhenti (makan|mengambil)|hentikan (ubat|dos)|tambah(kan)? dos|kurangkan dos|naikkan dos|langkau dos"
)
_DOSE_RE = re.compile(_DOSE_VERBS, re.IGNORECASE)
_NEGATION = re.compile(r"\b(don'?t|do not|never|not|without|avoid|jangan|tanpa|tidak)\b", re.IGNORECASE)

_MS_WORDS = {"anda", "dan", "yang", "untuk", "ini", "adalah", "dengan", "tidak", "boleh", "ubat", "sila", "atau", "saya"}
_EN_WORDS = {"the", "and", "you", "your", "is", "are", "with", "for", "this", "not", "can", "please", "or"}


def _gives_dose_instruction(answer: str) -> bool:
    for sentence in re.split(r"(?<=[.!?\n])\s+", answer):
        for m in _DOSE_RE.finditer(sentence):
            before = sentence[: m.start()]
            if not _NEGATION.search(before[-60:]):
                return True
    return False


def _language_matches(answer: str, language: str) -> bool:
    words = re.findall(r"[a-zA-Z]+", answer.lower())
    if len(words) < 8:
        return True
    ms = sum(w in _MS_WORDS for w in words)
    en = sum(w in _EN_WORDS for w in words)
    return ms >= en if language == "ms" else en >= ms


def check_answer(answer: str, language: str, registry: SourceRegistry) -> list[str]:
    """Return a list of rule violations (empty list = answer is acceptable)."""
    problems = []
    if not answer.strip():
        return ["the answer is empty"]
    unknown = registry.unknown_citations(answer)
    if unknown:
        problems.append(f"it cites ids that do not exist: {', '.join(sorted(unknown))}")
    if registry.sources and not registry.cited_in(answer):
        problems.append("it uses tool results but cites none of their [ids]")
    if _gives_dose_instruction(answer):
        problems.append("it tells the user to start, stop or change a medicine or dose")
    if not _language_matches(answer, language):
        problems.append(f"it is not written in {prompts.LANGUAGE_NAME[language]}")
    return problems
