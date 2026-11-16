"""Module 4 · Recruitment dashboard: funnel, screen failures and unknowns by criterion, needs attention."""
from datetime import datetime

import altair as alt
import pandas as pd
import streamlit as st

from neurovation import state, ui

ui.page(
    "Recruitment dashboard",
    "Where patients are lost, step by step and criterion by criterion. Recomputed live from the matching "
    "results, clinician decisions and consent records.",
    "Dashboard",
)
ss = state._ss()
criteria, results, rows, _ = state.ranked()
stages = {r["id"]: state.stage_of(r["id"], r["status"]) for r in rows}
order = state.STAGES
reached = lambda s: sum(1 for v in stages.values() if v and order.index(v) >= order.index(s))
funnel = [("Identified", len(rows))] + [(s, reached(s)) for s in order]

c = st.columns(len(funnel))
for col, (label, n) in zip(c, funnel):
    with col.container(border=True):
        st.metric(label, n)

if not ss.nv_decisions:
    ui.needs_progress_hint()

BLUE = "#2A56C6"
AXIS = dict(labelColor="#667085", titleColor="#667085", gridColor="#E4E7EC", domainColor="#E4E7EC", labelFont="Inter", titleFont="Inter")


def hbar(df, color, title):
    return (
        alt.Chart(df).mark_bar(color=color, cornerRadiusEnd=3, height=14)
        .encode(x=alt.X("n:Q", title=None, axis=alt.Axis(tickMinStep=1, **AXIS)),
                y=alt.Y("label:N", sort="-x", title=None, axis=alt.Axis(labelLimit=320, **AXIS)),
                tooltip=["label", "n"])
        .properties(height=max(120, 32 * len(df)), title=alt.TitleParams(title, anchor="start", font="Inter", fontSize=14, fontWeight=600, color="#101828"))
        .configure_view(strokeWidth=0)
    )


left, right = st.columns(2, gap="large")
with left:
    with st.container(border=True):
        df = pd.DataFrame(funnel, columns=["label", "n"])
        df["order"] = range(len(df))
        chart = (
            alt.Chart(df).mark_bar(color=BLUE, cornerRadiusEnd=3, height=18)
            .encode(x=alt.X("n:Q", title=None, axis=alt.Axis(tickMinStep=1, **AXIS)), y=alt.Y("label:N", sort=alt.SortField("order"), title=None, axis=alt.Axis(labelLimit=200, **AXIS)))
            .properties(height=230, title=alt.TitleParams("Recruitment funnel", anchor="start", font="Inter", fontSize=14, fontWeight=600, color="#101828"))
            .configure_view(strokeWidth=0)
        )
        st.altair_chart(chart, width="stretch")
with right:
    with st.container(border=True):
        st.markdown("**Needs attention**")
        overdue = [p for p, cr in ss.nv_consent.items() if cr.get("invited_at") and not cr.get("signed_at")
                   and (datetime.now() - datetime.strptime(cr["invited_at"], "%Y-%m-%d")).days > 7]
        callbacks = [p for p, cr in ss.nv_consent.items() if cr.get("callback")]
        info = [p for p, d in ss.nv_decisions.items() if d["action"] == "request_info"]
        unreviewed = [r["id"] for r in rows if r["status"] != "Not eligible" and r["id"] not in ss.nv_decisions]
        for label, items, tone in [
            ("Unreviewed patients in the queue", unreviewed, "nv-blue"),
            ("Consent unsigned for more than 7 days", overdue, "nv-bad"),
            ("Comprehension call-backs", callbacks, "nv-warn"),
            ("Open information requests", info, "nv-warn"),
        ]:
            st.markdown(f'<div class="nv-row" style="display:flex;justify-content:space-between"><span>{label}</span>{ui.badge(str(len(items)), tone)}</div>', unsafe_allow_html=True)
            if items:
                st.caption(", ".join(items))

ids = {c["id"]: c for c in criteria}
fails, unknowns = {}, {}
for rs in results.values():
    for x in rs:
        key = (f'{x["id"]} · {ids[x["id"]]["text"][:42]}' + ("…" if len(ids[x["id"]]["text"]) > 42 else "")) if x["id"] in ids else x["id"]
        if x["verdict"] == "fail":
            fails[key] = fails.get(key, 0) + 1
        elif x["verdict"] == "unknown":
            unknowns[key] = unknowns.get(key, 0) + 1

l2, r2 = st.columns(2, gap="large")
with l2:
    with st.container(border=True):
        if fails:
            st.altair_chart(hbar(pd.DataFrame(list(fails.items()), columns=["label", "n"]), "#B42318", "Screen failures by criterion"), width="stretch")
        st.caption("Which rules exclude the most patients. Useful feedback on protocol design.")
with r2:
    with st.container(border=True):
        if unknowns:
            st.altair_chart(hbar(pd.DataFrame(list(unknowns.items()), columns=["label", "n"]), "#B54708", "Unknown from the notes"), width="stretch")
        st.caption("Facts the notes do not state. Each one is a question to resolve at the next visit, not a failure.")
