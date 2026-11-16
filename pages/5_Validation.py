"""Validation · compare matching against the synthetic ground truth, and stress-test it with simulated reading errors."""
import random

import altair as alt
import pandas as pd
import streamlit as st

from neurovation import state, ui
from trialmatch import scoring as S

ui.page(
    "Validation",
    "How well does pre-screening find the patients who could be eligible? Uses the protocol-matching module's own "
    "comparison function against the synthetic patients' correct answers. Recall comes first: a missed patient never hears about the trial.",
    "Validation",
)
criteria, results, rows, source = state.ranked()
patients = state.load_patients()
sample = state.load_sample_criteria()
truth = {p["id"]: p["truth"] for p in patients}

if [c["id"] for c in criteria] != [c["id"] for c in sample]:
    st.warning("Correct answers exist only for the bundled sample protocol. Load it on the protocol-matching page to validate.")
    st.stop()

cmp = S.compare(truth, results)
st.caption(f"Results being validated: {source}")
c1, c2, c3, c4 = st.columns(4)
for col, label, val, help_ in [
    (c1, "Criterion-level agreement", f'{cmp["criterion_agreement"]:.0%}', "Share of patient × criterion verdicts that match the correct answer"),
    (c2, "Recall of possible eligibles", "n/a" if cmp["recall_of_possible_eligibles"] is None else f'{cmp["recall_of_possible_eligibles"]:.0%}', "Possible eligible = no criterion fails"),
    (c3, "Precision", "n/a" if cmp["precision_of_possible_eligibles"] is None else f'{cmp["precision_of_possible_eligibles"]:.0%}', None),
    (c4, "Confusion (TP / FP / FN / TN)", f'{cmp["tp"]} / {cmp["fp"]} / {cmp["fn"]} / {cmp["tn"]}', "True/false positives and negatives"),
]:
    with col.container(border=True):
        st.metric(label, val, help=help_)
if "Demo" in source or "demo" in source:
    st.info("Demo verdicts are the correct answers themselves, so they score 100%. Run **Live (Claude)** matching on the "
            "protocol-matching page to measure a real model, or use the stress test below.")

st.subheader("Stress test: what if the reader makes mistakes?")
st.markdown('<div class="nv-sub">Simulates an imperfect reader by randomly changing a share of verdicts, then measures the effect '
            "on recall with the module's own comparison function. 200 repetitions per error rate.</div>", unsafe_allow_html=True)
st.write("")
left, right = st.columns([1, 2], gap="large")
with left:
    to_unknown = st.slider("Share of errors that become 'unknown' (vs a wrong pass/fail)", 0.0, 1.0, 0.5, 0.1)
    st.caption("A well-designed reader turns doubt into 'unknown', which keeps patients in the queue. Wrong 'fail' verdicts are what lose patients.")


def perturb(rng, rate):
    out = {}
    for pid, rs in truth.items():
        new = []
        for t in rs:
            v = t["verdict"]
            if rng.random() < rate:
                if rng.random() < to_unknown:
                    v = "unknown"
                else:
                    v = rng.choice([x for x in ("pass", "fail", "unknown") if x != v])
            new.append({"id": t["id"], "verdict": v, "evidence": t["evidence"]})
        out[pid] = new
    return out


rows_ = []
for rate in [0, 0.02, 0.05, 0.1, 0.15, 0.2]:
    rng = random.Random(1)
    rec, agr = [], []
    for _ in range(200):
        m = S.compare(truth, perturb(rng, rate))
        rec.append(m["recall_of_possible_eligibles"] or 0)
        agr.append(m["criterion_agreement"])
    rows_.append({"Error rate": rate, "Recall": sum(rec) / len(rec), "Agreement": sum(agr) / len(agr)})
df = pd.DataFrame(rows_)
with right:
    long = df.melt("Error rate", var_name="Metric", value_name="Value")
    chart = (
        alt.Chart(long).mark_line(point=True, strokeWidth=2.2)
        .encode(x=alt.X("Error rate:Q", axis=alt.Axis(format="%", labelColor="#667085", titleColor="#667085", gridColor="#E4E7EC")),
                y=alt.Y("Value:Q", title=None, scale=alt.Scale(domain=[0, 1]), axis=alt.Axis(format="%", labelColor="#667085", titleColor="#667085", gridColor="#E4E7EC")),
                color=alt.Color("Metric:N", scale=alt.Scale(domain=["Recall", "Agreement"], range=["#2A56C6", "#98A2B3"]), legend=alt.Legend(orient="bottom", title=None)))
        .properties(height=280).configure_view(strokeWidth=0)
    )
    st.altair_chart(chart, width="stretch")
st.dataframe(df.style.format({"Error rate": "{:.0%}", "Recall": "{:.0%}", "Agreement": "{:.0%}"}), hide_index=True, width="stretch")
st.caption("Synthetic patients (n = 20), so these numbers show the method, not real performance.")
