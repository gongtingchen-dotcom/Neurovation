"""Trial matching prototype (local web app).  Run:  streamlit run app.py

Step 1 upload a protocol PDF and check the extracted criteria.
Step 2 match the demo patients and see them ranked by match score.
Step 3 open one patient to see the evidence for each criterion.
All patients are synthetic. The score orders a review queue; a clinician decides.
"""
import html
import json
from pathlib import Path

import pandas as pd
import streamlit as st

from trialmatch import criteria as C
from trialmatch import matcher as M
from trialmatch import scoring as S
from trialmatch.llm import DEFAULT_MODEL, get_client
from trialmatch.pdf import extract_text
from neurovation.ui import role_picker  # Neurovation: shared sidebar role picker

ROOT = Path(__file__).parent
DATA = ROOT / "data"
SAMPLE_PDF = DATA / "sample_protocol_NCT00056563.pdf"
LABEL = {"pass": "Pass", "fail": "Fail", "unknown": "Unknown"}
MARK = {"pass": "#d6eadf", "fail": "#f4d6d2", "unknown": "#f6e8c3"}

st.set_page_config(page_title="Trial matching prototype", layout="wide")


@st.cache_data
def load_data():
    patients = json.loads((DATA / "patients.json").read_text(encoding="utf-8"))
    sample = json.loads((DATA / "sample_criteria.json").read_text(encoding="utf-8"))
    return patients, sample


patients, sample_criteria = load_data()
client = get_client()
ss = st.session_state
for key, default in {
    "base_criteria": None, "current": None, "method": "", "source": "",
    "version": 0, "results": None, "results_mode": "",
}.items():
    ss.setdefault(key, default)


def set_criteria(items, method, source):
    ss.base_criteria, ss.current = items, items
    ss.method, ss.source = method, source
    ss.version += 1  # new editor state
    ss.results = None


# ---------------------------------------------------------------- header + sidebar
st.title("Protocol matching prototype")
st.caption("Upload a protocol PDF, match patients, and see the evidence behind every score. Synthetic patients only.")
with st.sidebar:
    st.subheader("Status")
    if client:
        st.success(f"Claude connected\n\nModel: {DEFAULT_MODEL}")
    else:
        st.info("Offline mode: no ANTHROPIC_API_KEY. Demo matching and rule-based criteria extraction only.")
    st.write(f"{len(patients)} synthetic patients loaded")
    st.caption("Pass = requirement met. For an exclusion criterion, Pass = the exclusion does not apply.")
    role_picker()  # Neurovation: shared "Signed in as" block, same on every page

tab1, tab2, tab3 = st.tabs(["1 · Protocol", "2 · Ranked patients", "3 · Evidence"])

# ---------------------------------------------------------------- tab 1
with tab1:
    left, right = st.columns([2, 1])
    with left:
        upload = st.file_uploader("Upload a protocol PDF", type=["pdf"])
        if upload is not None and st.button("Extract criteria", type="primary"):
            with st.spinner("Reading the protocol..."):
                try:
                    items, method = C.extract(extract_text(upload), client)
                except Exception as exc:
                    items, method = [], f"failed: {type(exc).__name__}"
            if items:
                set_criteria(items, method, upload.name)
            else:
                st.warning(
                    "No criteria found. The layout may be unusual or the PDF may be scanned. "
                    "Add criteria by hand in the table below, or set ANTHROPIC_API_KEY for AI extraction."
                )
                set_criteria([{"id": "I1", "type": "inclusion", "text": ""}], method, upload.name)
    with right:
        st.write("No PDF to hand?")
        if st.button("Use the bundled sample protocol"):
            items, method = C.extract(extract_text(SAMPLE_PDF), None)
            set_criteria(items, method, SAMPLE_PDF.name)

    if ss.base_criteria:
        st.markdown(f"**Criteria from `{ss.source}`** · extracted by {ss.method}. Edit anything that looks wrong; the matcher uses this table.")
        edited = st.data_editor(
            pd.DataFrame(ss.base_criteria),
            num_rows="dynamic",
            hide_index=True,
            use_container_width=True,
            key=f"criteria_editor_{ss.version}",
            column_config={
                "id": st.column_config.TextColumn("ID", required=True, width="small"),
                "type": st.column_config.SelectboxColumn("Type", options=["inclusion", "exclusion"], required=True, width="small"),
                "text": st.column_config.TextColumn("Criterion", required=True, width="large"),
            },
        )
        current = [
            {"id": str(r["id"]).strip(), "type": r["type"], "text": str(r["text"]).strip()}
            for r in edited.to_dict("records")
            if r.get("id") and r.get("text") and str(r["text"]).strip()
        ]
        if current != ss.current:
            ss.current, ss.results = current, None
        ids = [c["id"] for c in current]
        if len(ids) != len(set(ids)):
            st.error("Criterion IDs must be unique.")
    else:
        st.info("Upload a PDF, or use the bundled sample, to begin.")

# ---------------------------------------------------------------- tab 2
with tab2:
    if not ss.current:
        st.info("Load a protocol in step 1 first.")
    else:
        demo_ok = M.demo_available(ss.current, sample_criteria)
        modes = (["Demo (precomputed verdicts)"] if demo_ok else []) + (["Live (Claude)"] if client else [])
        if not modes:
            st.warning(
                "Demo verdicts exist only for the bundled sample protocol, and live matching needs an "
                "ANTHROPIC_API_KEY. Use the bundled sample, or set a key."
            )
        else:
            mode = st.radio("Matching mode", modes, horizontal=True)
            if st.button("Run matching", type="primary"):
                results = {}
                if mode.startswith("Demo"):
                    results = {p["id"]: M.match_demo(p, ss.current) for p in patients}
                else:
                    bar = st.progress(0.0, text="Matching patients...")
                    for i, p in enumerate(patients, start=1):
                        try:
                            results[p["id"]] = M.match_live(client, p, ss.current)
                        except Exception as exc:
                            results[p["id"]] = [
                                {"id": c["id"], "verdict": "unknown", "evidence": "", "flag": f"error: {type(exc).__name__}"}
                                for c in ss.current
                            ]
                        bar.progress(i / len(patients), text=f"Matched {i} of {len(patients)}")
                    bar.empty()
                ss.results, ss.results_mode = results, mode

        if ss.results:
            ranked = S.rank(patients, ss.results)
            table = pd.DataFrame(ranked)[["rank", "id", "score", "status", "pass", "fail", "unknown"]]
            st.dataframe(
                table,
                hide_index=True,
                use_container_width=True,
                column_config={
                    "rank": st.column_config.NumberColumn("Rank", width="small"),
                    "id": "Patient",
                    "score": st.column_config.ProgressColumn("Match score", min_value=0.0, max_value=1.0, format="%.2f"),
                    "status": "Status",
                    "pass": "Pass",
                    "fail": "Fail",
                    "unknown": "Unknown",
                },
            )
            if ss.results_mode.startswith("Demo"):
                st.caption("Demo mode: these verdicts were written with the synthetic patients. No AI was used.")
            st.caption("Score = (passes + 0.5 × unknowns) ÷ criteria, halved for each fail. It orders the review queue; a clinician decides.")
            flagged = sum(1 for rs in ss.results.values() for r in rs if r.get("flag"))
            if flagged:
                st.warning(f"{flagged} verdicts were set to Unknown because the model's evidence could not be verified or a call failed.")
            if ss.results_mode.startswith("Live") and M.demo_available(ss.current, sample_criteria):
                with st.expander("Check Claude against the synthetic ground truth"):
                    truth = {p["id"]: p["truth"] for p in patients}
                    cmp = S.compare(truth, ss.results)
                    c1, c2, c3 = st.columns(3)
                    c1.metric("Criterion-level agreement", f"{cmp['criterion_agreement']:.0%}")
                    rec, prec = cmp["recall_of_possible_eligibles"], cmp["precision_of_possible_eligibles"]
                    c2.metric("Recall of possible eligibles", "n/a" if rec is None else f"{rec:.0%}")
                    c3.metric("Precision", "n/a" if prec is None else f"{prec:.0%}")
                    st.caption("A patient counts as 'possible eligible' when no criterion is Fail. Recall is the number to watch: a missed patient never hears about the trial.")

# ---------------------------------------------------------------- tab 3
with tab3:
    if not ss.results:
        st.info("Run matching in step 2 first.")
    else:
        ranked = S.rank(patients, ss.results)
        options = [f'{r["rank"]}. {r["id"]} · score {r["score"]:.2f} · {r["status"]}' for r in ranked]
        choice = st.selectbox("Patient", options)
        pid = ranked[options.index(choice)]["id"]
        patient = next(p for p in patients if p["id"] == pid)
        res = {r["id"]: r for r in ss.results[pid]}
        summary = next(r for r in ranked if r["id"] == pid)
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Match score", f'{summary["score"]:.2f}')
        m2.metric("Status", summary["status"])
        m3.metric("Pass / Fail / Unknown", f'{summary["pass"]} / {summary["fail"]} / {summary["unknown"]}')
        m4.metric("Age, sex", f'{patient["age"]}, {patient["sex"]}')

        left, right = st.columns([3, 2])
        with left:
            rows = []
            for c in ss.current:
                r = res.get(c["id"], {"verdict": "unknown", "evidence": "", "flag": ""})
                rows.append({
                    "ID": c["id"], "Type": c["type"], "Criterion": c["text"],
                    "Result": LABEL[r["verdict"]],
                    "Evidence": r["evidence"] or ("(not stated in the note)" if r["verdict"] == "unknown" else ""),
                })
            st.dataframe(pd.DataFrame(rows), hide_index=True, use_container_width=True,
                         column_config={"ID": st.column_config.TextColumn(width="small"),
                                        "Type": st.column_config.TextColumn(width="small"),
                                        "Result": st.column_config.TextColumn(width="small")})
        with right:
            st.markdown("**Patient note** (evidence highlighted)")
            body = html.escape(patient["note"])
            for c in ss.current:
                r = res.get(c["id"])
                if r and r["evidence"]:
                    e = html.escape(r["evidence"])
                    body = body.replace(e, f'<mark style="background:{MARK[r["verdict"]]};padding:2px 4px;border-radius:4px">{e}</mark>', 1)
            st.markdown(f'<div style="line-height:1.7;font-size:0.95rem">{body}</div>', unsafe_allow_html=True)
            st.caption("Green = pass, red = fail, amber = unknown. The Result column states each verdict in words.")
