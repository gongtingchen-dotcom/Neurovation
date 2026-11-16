"""Per-criterion matching of a patient note against protocol criteria."""
import re

from .llm import DEFAULT_MODEL, ask_json
from .scoring import VERDICTS

PROMPT = """You are helping a clinical research officer pre-screen a patient for a trial.
For EACH criterion below, decide from the patient note only:
- "pass": the note shows the patient satisfies the requirement. For an EXCLUSION criterion,
  "pass" means the note shows the exclusion does NOT apply.
- "fail": the note shows the patient does not satisfy the requirement. For an EXCLUSION
  criterion, "fail" means the exclusion DOES apply.
- "unknown": the note does not say enough. Do not guess. Missing information is "unknown".
For "pass" and "fail", "evidence" must be one sentence copied word for word from the note.
For "unknown", "evidence" is a copied sentence only if one is partly relevant, else "".

CRITERIA (id, type, text):
{criteria}

PATIENT NOTE:
{note}

Return only JSON: [{{"id": "...", "verdict": "pass|fail|unknown", "evidence": "..."}}, ...]
with exactly one item per criterion id."""


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def validate(raw, patient, criteria):
    """Force one well-formed result per criterion and drop evidence not found in the note.

    A pass/fail whose evidence is not a real sentence of the note is downgraded to unknown, so
    the tool never shows a quote the patient record does not contain.
    """
    by_id = {r.get("id"): r for r in raw if isinstance(r, dict)}
    note = _norm(patient["note"])
    out = []
    for c in criteria:
        r = by_id.get(c["id"], {})
        verdict = r.get("verdict") if r.get("verdict") in VERDICTS else "unknown"
        evidence = (r.get("evidence") or "").strip()
        flag = ""
        if evidence and _norm(evidence) not in note:
            evidence, flag = "", "evidence_not_in_note"
            if verdict != "unknown":
                verdict = "unknown"
        elif verdict != "unknown" and not evidence:
            verdict, flag = "unknown", "no_evidence_given"
        out.append({"id": c["id"], "verdict": verdict, "evidence": evidence, "flag": flag})
    return out


def match_live(client, patient, criteria, model: str = DEFAULT_MODEL):
    crit_text = "\n".join(f'{c["id"]} | {c["type"]} | {c["text"]}' for c in criteria)
    raw = ask_json(client, PROMPT.format(criteria=crit_text, note=patient["note"]), model=model)
    return validate(raw, patient, criteria)


def match_demo(patient, criteria):
    """Precomputed ground-truth verdicts for the bundled synthetic patients (no AI involved)."""
    truth = {t["id"]: t for t in patient["truth"]}
    return [
        {"id": c["id"], "verdict": truth[c["id"]]["verdict"], "evidence": truth[c["id"]]["evidence"], "flag": ""}
        for c in criteria
        if c["id"] in truth
    ]


def demo_available(criteria, sample_criteria) -> bool:
    """Demo verdicts only apply while the criteria are exactly the bundled sample's."""
    key = lambda cs: sorted((c["id"], c["type"], _norm(c["text"])) for c in cs)
    return key(criteria) == key(sample_criteria)
