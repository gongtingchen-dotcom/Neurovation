"""Module 2b · Clinician review. Uses the ranking and evidence from the protocol-matching page."""
import html

import pandas as pd
import streamlit as st

from neurovation import state, ui

ui.page(
    "Review and approve",
    "The ranked list from protocol matching becomes a review queue. A research officer checks the evidence; "
    "only the principal investigator can approve a patient for contact. Every decision is logged.",
    "Review and approve",
)
ss = state._ss()
criteria, results, rows, source = state.ranked()
patients = {p["id"]: p for p in state.load_patients()}

c1, c2, c3, c4 = st.columns(4)
for col, label, n in [
    (c1, "Patients ranked", len(rows)),
    (c2, "Likely eligible", sum(r["status"] == "Likely eligible" for r in rows)),
    (c3, "Needs review", sum(r["status"] == "Needs review" for r in rows)),
    (c4, "Decided", len(ss.nv_decisions)),
]:
    with col.container(border=True):
        st.metric(label, n)

left, right = st.columns([3, 2], gap="large")
with left:
    pending = any(r["status"] != "Not eligible" and r["id"] not in ss.nv_decisions for r in rows)
    show = st.segmented_control("Show", ["To review", "All", "Decided"], default="To review" if pending else "All", label_visibility="collapsed") or "All"
    table = []
    for r in rows:
        d = ss.nv_decisions.get(r["id"], {})
        if show == "To review" and (d or r["status"] == "Not eligible"):
            continue
        if show == "Decided" and not d:
            continue
        table.append({
            "Rank": r["rank"], "Patient": r["id"], "Match score": r["score"], "Status": r["status"],
            "Pass": r["pass"], "Fail": r["fail"], "Unknown": r["unknown"],
            "Decision": {"approve": "Approved", "reject": "Not eligible", "request_info": "Info requested"}.get(d.get("action"), "—"),
        })
    df = pd.DataFrame(table)
    if df.empty:
        st.info("Nothing in this view.")
        pid = None
    else:
        event = st.dataframe(
            df, hide_index=True, width="stretch", on_select="rerun", selection_mode="single-row",
            column_config={"Match score": st.column_config.ProgressColumn("Match score", min_value=0.0, max_value=1.0, format="%.2f")},
            key="queue",
        )
        sel = event.selection.rows if event and event.selection else []
        pid = df.iloc[sel[0]]["Patient"] if sel else df.iloc[0]["Patient"]
    st.caption("Click a row to open the patient. Score and status are computed by the protocol-matching module, unchanged.")

with right:
    if pid:
        r = next(x for x in rows if x["id"] == pid)
        p = patients[pid]
        with st.container(border=True):
            st.markdown(f"#### {pid} &nbsp; {ui.badge(r['status'], ui.STATUS_TONE[r['status']])}", unsafe_allow_html=True)
            st.markdown(f'<span class="nv-muted">{p["age"]} years · {"female" if p["sex"] == "F" else "male"} · match score {r["score"]:.2f}</span>', unsafe_allow_html=True)
            res = {x["id"]: x for x in results[pid]}
            out = []
            for c in criteria:
                x = res.get(c["id"], {"verdict": "unknown", "evidence": ""})
                ev = f'<div class="nv-quote">“{html.escape(x["evidence"])}”</div>' if x.get("evidence") else '<div class="nv-muted">Not stated in the note.</div>'
                out.append(
                    f'<div class="nv-row"><div style="display:flex;justify-content:space-between;gap:8px">'
                    f'<b>{c["id"]}</b><span style="flex:1">{html.escape(c["text"])}</span>{ui.badge(ui.LABEL[x["verdict"]], ui.TONE[x["verdict"]])}</div>{ev}</div>'
                )
            st.markdown("".join(out), unsafe_allow_html=True)

        d = ss.nv_decisions.get(pid)
        if d:
            st.success(f'{ {"approve": "Approved for contact", "reject": "Marked not eligible", "request_info": "Information requested"}[d["action"]] } by {d["by"]} at {d["at"]}' + (f' · “{d["note"]}”' if d["note"] else ""))
            if st.button("Undo decision"):
                ss.nv_decisions.pop(pid)
                state.log("Decision undone", pid)
                st.rerun()
        else:
            note = st.text_input("Note for the audit trail (optional)", key=f"note_{pid}")
            is_pi = ss.nv_role == "Principal investigator"
            b1, b2, b3 = st.columns(3)
            if b1.button("Approve for contact", type="primary", disabled=not is_pi or r["status"] == "Not eligible", width="stretch"):
                state.decide(pid, "approve", note)
                st.rerun()
            if b2.button("Request info", width="stretch"):
                state.decide(pid, "request_info", note)
                st.rerun()
            if b3.button("Not eligible", width="stretch"):
                state.decide(pid, "reject", note)
                st.rerun()
            if not is_pi:
                st.caption("Approval needs the **Principal investigator** role (sidebar).")
