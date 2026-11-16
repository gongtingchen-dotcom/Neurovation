"""Match score and ranking.

Verdict per criterion is "pass", "fail" or "unknown". For an exclusion criterion, "pass" means
the exclusion does NOT apply to the patient.

score = (passes + 0.5 * unknowns) / criteria, then halved for every "fail".
Status: any fail -> "Not eligible"; no fail and no unknown -> "Likely eligible";
otherwise "Needs review". The score orders the review queue. It is not a diagnosis.
"""

VERDICTS = ("pass", "fail", "unknown")


def score_patient(results):
    """`results` is a list of {"id", "verdict", "evidence"}. Returns a summary dict."""
    n = len(results)
    p = sum(r["verdict"] == "pass" for r in results)
    f = sum(r["verdict"] == "fail" for r in results)
    u = n - p - f
    base = (p + 0.5 * u) / n if n else 0.0
    score = base * (0.5**f)
    if f:
        status = "Not eligible"
    elif u:
        status = "Needs review"
    else:
        status = "Likely eligible"
    return {"score": round(score, 2), "status": status, "pass": p, "fail": f, "unknown": u}


def rank(patients, results_by_id):
    """Return summaries sorted by score (desc), then fewer unknowns, then id."""
    rows = []
    for patient in patients:
        summary = score_patient(results_by_id[patient["id"]])
        summary["id"] = patient["id"]
        rows.append(summary)
    rows.sort(key=lambda r: (-r["score"], r["unknown"], r["id"]))
    for i, row in enumerate(rows, start=1):
        row["rank"] = i
    return rows


def compare(truth_by_id, pred_by_id):
    """Agreement between predicted and ground-truth verdicts (synthetic data only)."""
    total = agree = 0
    tp = fp = fn = tn = 0  # positive = "has no fail" (could be eligible)
    for pid, truth in truth_by_id.items():
        pred = {r["id"]: r for r in pred_by_id.get(pid, [])}
        for t in truth:
            total += 1
            agree += pred.get(t["id"], {}).get("verdict") == t["verdict"]
        t_pos = not any(t["verdict"] == "fail" for t in truth)
        p_pos = not any(r["verdict"] == "fail" for r in pred.values())
        tp += t_pos and p_pos
        fp += (not t_pos) and p_pos
        fn += t_pos and (not p_pos)
        tn += (not t_pos) and (not p_pos)
    return {
        "criterion_agreement": agree / total if total else 0.0,
        "recall_of_possible_eligibles": tp / (tp + fn) if tp + fn else None,
        "precision_of_possible_eligibles": tp / (tp + fp) if tp + fp else None,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }
