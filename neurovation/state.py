"""Shared state for the Neurovation pages.

Matching results come from the protocol-matching page (app.py) when the user has run it in this
session; otherwise the bundled demo verdicts are used through trialmatch's own functions
(match_demo, rank). Nothing here writes to data/ or modifies trialmatch.
"""
from __future__ import annotations

import hashlib
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

import streamlit as st

from trialmatch import matcher as M
from trialmatch import scoring as S

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

ROLES = ["Research officer", "Principal investigator", "Data custodian"]
STAGES = ["Not ruled out", "Approved for contact", "Invited", "Consented", "Enrolled"]
CONSENT_FORM_VERSION = "v1.0"

# Five True/False statements shown before signature. A score below 4/5 triggers a call-back.
COMPREHENSION = [
    ("Taking part means you may have brain surgery to implant a stimulator, or continue best medical therapy.", True),
    ("You can leave the study at any time without it affecting your usual care.", True),
    ("Joining the study is required to keep seeing your neurologist.", False),
    ("Your study data is stored under a study ID, not your name.", True),
    ("You must stop all Parkinson's medication before enrolment.", False),
]


@st.cache_data
def load_patients():
    return json.loads((DATA / "patients.json").read_text(encoding="utf-8"))


@st.cache_data
def load_sample_criteria():
    return json.loads((DATA / "sample_criteria.json").read_text(encoding="utf-8"))


def _ss():
    ss = st.session_state
    ss.setdefault("nv_role", ROLES[0])
    ss.setdefault("nv_decisions", {})  # pid -> {action, note, by, at}
    ss.setdefault("nv_consent", {})  # pid -> {...}
    ss.setdefault("nv_audit", [])
    ss.setdefault("nv_seq", 0)
    return ss


def log(action: str, detail: str):
    ss = _ss()
    ss.nv_audit.insert(0, {"time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "role": ss.nv_role, "action": action, "detail": detail})


def matching():
    """Return (criteria, results_by_pid, source_label). Uses the matching page's results if present."""
    ss = st.session_state
    patients = load_patients()
    if ss.get("results") and ss.get("current"):
        return ss["current"], ss["results"], f"Results from the protocol-matching page ({ss.get('results_mode', '')})"
    sample = load_sample_criteria()
    results = {p["id"]: M.match_demo(p, sample) for p in patients}
    return sample, results, "Bundled sample protocol (NCT00056563) · demo verdicts, no AI"


def ranked():
    criteria, results, source = matching()
    return criteria, results, S.rank(load_patients(), results), source


def vault_key(pid: str) -> str:
    """Synthetic hospital record number held only in the identity vault (deterministic, not real)."""
    h = int(hashlib.sha256(pid.encode()).hexdigest(), 16)
    return f"MRN-{h % 9_000_000 + 1_000_000}"


def stage_of(pid: str, status: str) -> str | None:
    ss = _ss()
    c = ss.nv_consent.get(pid, {})
    if c.get("enrolled_at"):
        return "Enrolled"
    if c.get("signed_at"):
        return "Consented"
    if c.get("invited_at"):
        return "Invited"
    if ss.nv_decisions.get(pid, {}).get("action") == "approve":
        return "Approved for contact"
    if status != "Not eligible":
        return "Not ruled out"
    return None


def decide(pid: str, action: str, note: str):
    ss = _ss()
    ss.nv_decisions[pid] = {"action": action, "note": note, "by": ss.nv_role, "at": datetime.now().strftime("%Y-%m-%d %H:%M")}
    label = {"approve": "Approved for contact", "reject": "Marked not eligible", "request_info": "Requested information"}[action]
    log(label, f"{pid}{' · ' + note if note else ''}")


def invite(pid: str, when: datetime | None = None):
    ss = _ss()
    ss.nv_consent[pid] = {"form": CONSENT_FORM_VERSION, "invited_at": (when or datetime.now()).strftime("%Y-%m-%d")}
    log("Consent invitation sent", f"{pid} · form {CONSENT_FORM_VERSION}")


def record_consent(pid: str, answers: list[bool], signed: bool, when: datetime | None = None):
    ss = _ss()
    score = sum(a == truth for a, (_, truth) in zip(answers, COMPREHENSION))
    c = ss.nv_consent.setdefault(pid, {"form": CONSENT_FORM_VERSION})
    c["comprehension"] = score
    if score < 4:
        c["callback"] = True
        log("Comprehension below 4/5", f"{pid} · {score}/5 · call-back required before signature")
        return score
    if signed:
        ss.nv_seq += 1
        c["signed_at"] = (when or datetime.now()).strftime("%Y-%m-%d")
        c["study_id"] = f"NV-{ss.nv_seq:03d}"
        c.pop("callback", None)
        log("Consent signed", f"{pid} · {score}/5 · study ID {c['study_id']} issued")
    return score


def enrol(pid: str, when: datetime | None = None):
    ss = _ss()
    c = ss.nv_consent[pid]
    c["enrolled_at"] = (when or datetime.now()).strftime("%Y-%m-%d")
    log("Enrolled", f"{c.get('study_id', pid)}")


def simulate_progress():
    """Fill the workflow with plausible, clearly synthetic progress so every page has something to show."""
    ss = _ss()
    _, _, rows, _ = ranked()
    rng = random.Random(42)
    prev_role = ss.nv_role
    base = datetime.now() - timedelta(days=42)
    for r in rows:
        pid = r["id"]
        if r["status"] == "Not eligible" or pid in ss.nv_decisions:
            continue
        if r["status"] == "Needs review" and rng.random() < 0.5:
            ss.nv_role = "Research officer"
            decide(pid, "request_info", "Missing item to confirm at next clinic visit")
            continue
        ss.nv_role = "Principal investigator"
        decide(pid, "approve", "")
        ss.nv_role = "Research officer"
        t = base + timedelta(days=rng.randint(0, 30))
        invite(pid, t)
        if rng.random() < 0.75:
            answers = [truth for _, truth in COMPREHENSION]
            if rng.random() < 0.2:
                answers[2] = not answers[2]
                answers[4] = not answers[4]  # 3/5: triggers a call-back
            record_consent(pid, answers, True, t + timedelta(days=rng.randint(2, 9)))
            if ss.nv_consent[pid].get("signed_at") and rng.random() < 0.7:
                enrol(pid, t + timedelta(days=rng.randint(10, 20)))
    ss.nv_role = prev_role
    log("Simulated demo progress", "Synthetic decisions and consent events added for demonstration")


def reset_progress():
    ss = _ss()
    ss.nv_decisions, ss.nv_consent, ss.nv_seq = {}, {}, 0
    log("Reset workflow", "All decisions and consent records cleared")
