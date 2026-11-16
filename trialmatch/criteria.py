"""Turn protocol text into a list of atomic eligibility criteria.

Two routes:
  * extract_with_llm: Claude reads the eligibility section and returns atomic criteria.
  * extract_heuristic: offline fallback for bulleted "Inclusion Criteria" / "Exclusion Criteria"
    lists and for the inline "(a) ..., (b) ..." style used in journal protocol papers.
The research officer can edit the result in the app before matching.
"""
import re

from .llm import DEFAULT_MODEL, ask_json

_HEADING = re.compile(r"^\s*(inclusion|exclusion)\s+criteria\s*:?\s*$", re.I)
_BULLET = re.compile(r"^\s*(?:[-•*·▪]|\d+[.)]|\([a-z0-9]{1,2}\)|[a-z][.)])\s+")
_STOP = re.compile(r"^\s*(?:\d+(?:\.\d+)*\.?\s+)?[A-Z][A-Za-z /&-]{3,40}:?\s*$")


def _number(items):
    out, counts = [], {"inclusion": 0, "exclusion": 0}
    for kind, text in items:
        text = re.sub(r"\s+", " ", text).strip(" ;,.")
        if len(text) < 4:
            continue
        counts[kind] += 1
        prefix = "I" if kind == "inclusion" else "E"
        out.append({"id": f"{prefix}{counts[kind]}", "type": kind, "text": text})
    return out


def _lone_marker(line: str) -> bool:
    """A line holding only a bullet glyph (PDFs often put the bullet on its own line)."""
    s = line.strip()
    return 0 < len(s) <= 2 and not any(ch.isalnum() for ch in s)


def _bulleted(text: str):
    items, kind, current = [], None, None
    new_item = False
    for line in text.splitlines():
        if kind is not None and _lone_marker(line):
            if current:
                items.append((kind, current))
            current, new_item = None, True
            continue
        if new_item and line.strip():
            current, new_item = line.strip(), False
            continue
        m = _HEADING.match(line)
        if m:
            if current:
                items.append((kind, current))
            kind, current = m.group(1).lower(), None
            continue
        if kind is None:
            continue
        if not line.strip():
            continue
        if _BULLET.match(line):
            if current:
                items.append((kind, current))
            current = _BULLET.sub("", line, count=1)
        elif current is not None and not _STOP.match(line):
            current += " " + line.strip()
        elif _STOP.match(line) and current is not None:
            items.append((kind, current))
            kind, current = None, None
    if current and kind:
        items.append((kind, current))
    return items


def _inline(text: str):
    flat = re.sub(r"\s+", " ", text)
    items = []
    inc = re.search(
        r"inclusion criteria (?:are|were|will be)(?: as follows)?\s*:?\s*(.*?)(?=exclusion criteria)",
        flat,
        re.I,
    )
    exc = re.search(
        r"exclusion criteria (?:are|were|will be)(?: as follows)?\s*:?\s*(.*?)(?:\.\s+(?=[A-Z])|$)",
        flat,
        re.I,
    )
    for kind, m in (("inclusion", inc), ("exclusion", exc)):
        if not m:
            continue
        parts = re.split(r"\(\s*[a-z]\s*\)", m.group(1))
        for part in parts:
            part = part.strip(" ,;.")
            part = re.sub(r"^(?:and|or)\s+", "", part, flags=re.I)
            part = re.sub(r"[,;]?\s+(?:and|or)$", "", part, flags=re.I)
            if part:
                items.append((kind, part))
    return items


def extract_heuristic(text: str):
    """Offline extraction. Returns [] when the layout is not recognised."""
    items = _bulleted(text)
    if len(items) < 2:
        items = _inline(text)
    return _number(items)


def relevant_excerpt(text: str, max_chars: int = 30000) -> str:
    """Return the part of a long protocol most likely to hold the eligibility criteria."""
    m = re.search(r"inclusion criteria", text, re.I)
    if not m:
        return text[:max_chars]
    start = max(0, m.start() - 1500)
    return text[start : start + max_chars]


PROMPT = """You are helping a clinical research officer read a trial protocol.
Extract the eligibility criteria from the text below as a JSON list.
Rules:
- One atomic criterion per item. Split compound criteria ("A and B") into separate items.
- Keep the protocol's own wording as closely as possible. Do not add, infer or generalise.
- type is "inclusion" or "exclusion".
- Return only the JSON list: [{{"type": "inclusion", "text": "..."}}, ...]

PROTOCOL TEXT:
{text}
"""


def extract_with_llm(text: str, client, model: str = DEFAULT_MODEL):
    data = ask_json(client, PROMPT.format(text=relevant_excerpt(text)), model=model)
    items = [
        (d["type"].lower(), d["text"])
        for d in data
        if isinstance(d, dict) and d.get("type", "").lower() in ("inclusion", "exclusion") and d.get("text")
    ]
    return _number(items)


def extract(text: str, client=None, model: str = DEFAULT_MODEL):
    """Try Claude first when a client is given, else the heuristic. Returns (criteria, method)."""
    if client is not None:
        try:
            result = extract_with_llm(text, client, model)
            if result:
                return result, "Claude"
        except Exception as exc:  # network, parsing or API errors: fall back, but say so
            heuristic = extract_heuristic(text)
            return heuristic, f"rule-based (Claude failed: {type(exc).__name__})"
    return extract_heuristic(text), "rule-based"
