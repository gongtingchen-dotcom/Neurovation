"""Generate 20 SYNTHETIC patients with ground-truth verdicts for the bundled sample protocol.

No real patient data. Run after make_fixture.py:  python scripts/make_patients.py
Writes data/sample_criteria.json and data/patients.json.
"""
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from trialmatch.criteria import extract_heuristic  # noqa: E402
from trialmatch.pdf import extract_text  # noqa: E402

# Sentence templates per criterion id: pass / fail / vague (unknown with a partly relevant sentence).
# An "unknown" with no vague sentence simply leaves the topic out of the note.
T = {
    "I1": {
        "pass": ["Diagnosed with idiopathic Parkinson's disease {yrs} years ago.",
                 "Long-standing idiopathic Parkinson's disease, first symptoms {yrs} years ago."],
        "fail": ["Parkinsonism is attributed to multiple small strokes (vascular parkinsonism)."],
        "vague": ["Presents with parkinsonism; the underlying cause is still being worked up."],
    },
    "I2": {
        "pass": ["Hoehn and Yahr stage {hy} in the off-medication state.",
                 "Off medication, Hoehn and Yahr stage {hy} on examination."],
        "fail": ["Hoehn and Yahr stage 1 when off medication."],
        "vague": ["Hoehn and Yahr stage 2.5 recorded, but only in the on-medication state."],
    },
    "I3": {
        "pass": ["Antiparkinsonian regimen unchanged for the past {mo} months.",
                 "Levodopa dose has been stable for {mo} months."],
        "fail": ["Levodopa dose was increased two weeks ago."],
        "vague": [],
    },
    "I4": {"pass": [], "fail": [], "vague": []},  # age comes from the header sentence
    "I5": {
        "pass": ["Lives locally and is willing to attend scheduled follow-up visits.",
                 "Family can bring the patient to follow-up visits and the patient agrees to attend."],
        "fail": ["Moving overseas next month and unable to attend follow-up visits."],
        "vague": [],
    },
    "I6": {
        "pass": ["Pre-operative brain MRI shows no intracranial abnormality.",
                 "Brain MRI reported as normal for age, with no structural lesion."],
        "fail": ["Brain MRI shows an old left basal ganglia infarct."],
        "vague": ["Brain MRI has been requested but is not yet done."],
    },
    "E1": {
        "pass": ["No features of atypical parkinsonism and a clear levodopa response.",
                 "Good, sustained levodopa response; no red flags for Parkinson's plus syndromes."],
        "fail": ["Early postural instability and vertical gaze palsy, suspicious for progressive supranuclear palsy."],
        "vague": [],
    },
    "E2": {
        "pass": ["Anaesthesia review found no contraindication to surgery or stimulation.",
                 "Medically fit for stereotactic surgery per pre-operative assessment."],
        "fail": ["On anticoagulation for a mechanical heart valve, which contraindicates stereotactic surgery."],
        "vague": [],
    },
    "E3": {
        "pass": ["No alcohol or drug misuse reported.",
                 "Social history: non-drinker, no recreational drug use."],
        "fail": ["Reports daily heavy alcohol use."],
        "vague": [],
    },
    "E4": {
        "pass": ["MMSE {mmse}/30, no cognitive concerns.", "Cognitive screen normal, MMSE {mmse}/30."],
        "fail": ["MMSE 22/30 and a clinical picture consistent with dementia."],
        "vague": ["A cognitive screen was planned but has not been done."],
    },
    "E5": {
        "pass": ["Not enrolled in any other research study.",
                 "No current participation in other clinical trials."],
        "fail": ["Currently enrolled in an investigational drug trial."],
        "vague": [],
    },
}
FILLER = [
    "Referred from the movement disorders clinic.",
    "Family history is unremarkable.",
    "Tremor-dominant onset on the right side.",
    "Reports some morning stiffness.",
    "Sleep is fragmented at night.",
    "Seen with a family member today.",
]
CHANGEABLE = ["I1", "I2", "I3", "I5", "I6", "E1", "E2", "E3", "E4", "E5"]


def build_patient(pid, rng, fails, unknowns, crit_ids):
    age = rng.randint(48, 78)
    sex = rng.choice(["F", "M"])
    word = "woman" if sex == "F" else "man"
    header = f"{age}-year-old {word} referred for parkinsonism."
    ctx = {"yrs": rng.randint(6, 18), "hy": rng.choice(["2", "3", "3", "4"]),
           "mo": rng.choice([3, 4, 6, 9, 12]), "mmse": rng.randint(26, 30)}
    sentences, truth = [header], []
    for cid in crit_ids:
        if cid == "I4":
            truth.append({"id": cid, "verdict": "pass", "evidence": header})
            continue
        t = T[cid]
        if cid in fails:
            s = rng.choice(t["fail"]).format(**ctx)
            verdict = "fail"
        elif cid in unknowns:
            s = rng.choice(t["vague"]).format(**ctx) if t["vague"] and rng.random() < 0.6 else ""
            verdict = "unknown"
        else:
            s = rng.choice(t["pass"]).format(**ctx)
            verdict = "pass"
        if s:
            sentences.append(s)
        truth.append({"id": cid, "verdict": verdict, "evidence": s})
    body = sentences[1:] + rng.sample(FILLER, 2)
    rng.shuffle(body)
    note = " ".join([header] + body)
    return {"id": pid, "age": age, "sex": sex, "note": note, "truth": truth}


def main():
    rng = random.Random(7)
    text = extract_text(ROOT / "data" / "sample_protocol_NCT00056563.pdf")
    criteria = extract_heuristic(text)
    ids = [c["id"] for c in criteria]
    assert ids == ["I1", "I2", "I3", "I4", "I5", "I6", "E1", "E2", "E3", "E4", "E5"], ids
    (ROOT / "data" / "sample_criteria.json").write_text(json.dumps(criteria, indent=2), encoding="utf-8")

    plan = (
        [(0, 0)] * 6                       # likely eligible
        + [(0, k) for k in (1, 1, 2, 2, 3)]  # needs review
        + [(1, 0), (1, 1), (1, 1)]         # near miss
        + [(1, 2), (2, 0), (2, 1), (2, 2), (3, 0), (3, 1)]  # not eligible
    )
    rng.shuffle(plan)
    patients = []
    for i, (nf, nu) in enumerate(plan):
        pool = CHANGEABLE[:]
        rng.shuffle(pool)
        fails = set(pool[:nf])
        unknowns = set(pool[nf : nf + nu])
        patients.append(build_patient(f"PT-{101 + i}", rng, fails, unknowns, ids))
    (ROOT / "data" / "patients.json").write_text(json.dumps(patients, indent=2), encoding="utf-8")
    print(f"wrote {len(criteria)} criteria and {len(patients)} synthetic patients")


if __name__ == "__main__":
    main()
