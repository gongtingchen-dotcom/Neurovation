"""Optional Claude client. Without ANTHROPIC_API_KEY the app runs in offline mode."""
import json
import os
import re

DEFAULT_MODEL = os.getenv("TRIALMATCH_MODEL", "claude-sonnet-5-5")


def get_client():
    """Return an Anthropic client, or None if no key is set or the package is missing."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        return None
    try:
        import anthropic
    except ImportError:
        return None
    return anthropic.Anthropic()


def ask_json(client, prompt: str, model: str = DEFAULT_MODEL, max_tokens: int = 3000):
    """Send a prompt and parse the first JSON value in the reply."""
    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = "".join(block.text for block in resp.content if getattr(block, "type", "") == "text")
    return parse_json(raw)


def parse_json(raw: str):
    """Parse JSON from a model reply, tolerating code fences and surrounding text."""
    raw = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", raw, re.S)
    if fenced:
        raw = fenced.group(1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = min([i for i in (raw.find("["), raw.find("{")) if i != -1], default=-1)
        if start == -1:
            raise
        end = max(raw.rfind("]"), raw.rfind("}"))
        return json.loads(raw[start : end + 1])
