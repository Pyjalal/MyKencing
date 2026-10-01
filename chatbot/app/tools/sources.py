"""Per-request registry of the evidence the agent has seen, so answers can cite it."""
import re
from dataclasses import dataclass, field

PREFIX = {"guideline": "G", "medicine": "M", "interaction": "I"}
CITATION_RE = re.compile(r"\[([GMI]\d+)\]")


@dataclass
class Source:
    id: str
    type: str
    title: str
    url: str | None = None
    section: str | None = None

    def as_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class SourceRegistry:
    sources: dict[str, Source] = field(default_factory=dict)
    _keys: dict[tuple, str] = field(default_factory=dict)

    def add(self, type: str, title: str, key: str, url: str | None = None, section: str | None = None) -> str:
        """Register a source (deduplicated by type+key) and return its citation id, e.g. 'G2'."""
        dedupe = (type, key)
        if dedupe in self._keys:
            return self._keys[dedupe]
        n = sum(1 for s in self.sources.values() if s.type == type) + 1
        sid = f"{PREFIX[type]}{n}"
        self.sources[sid] = Source(sid, type, title, url, section)
        self._keys[dedupe] = sid
        return sid

    def cited_in(self, text: str) -> list[dict]:
        seen: list[str] = []
        for sid in CITATION_RE.findall(text):
            if sid in self.sources and sid not in seen:
                seen.append(sid)
        return [self.sources[s].as_dict() for s in seen]

    def unknown_citations(self, text: str) -> set[str]:
        return {sid for sid in CITATION_RE.findall(text) if sid not in self.sources}
