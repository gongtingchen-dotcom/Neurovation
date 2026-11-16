"""Module 3 · eConsent and onboarding: invitation, comprehension check, signature, study ID, identity vault."""
from datetime import datetime

import pandas as pd
import streamlit as st

from neurovation import state, ui

ui.page(
    "Consent and onboarding",
    "Approved patients receive electronic consent. They must answer a short comprehension check before signing; "
    "a score below 4 of 5 triggers a call-back. Signing issues a study ID, and the link to the hospital record "
    "stays in a separate identity vault.",
    "Consent and onboarding",
)
ss = state._ss()
_, _, rows, _ = state.ranked()
status = {r["id"]: r["status"] for r in rows}
pipeline = [pid for pid in status if state.stage_of(pid, status[pid]) in state.STAGES[1:]]

if not pipeline:
    ui.needs_progress_hint()
    st.stop()

signed = [ss.nv_consent[p] for p in pipeline if ss.nv_consent.get(p, {}).get("signed_at")]
c1, c2, c3, c4 = st.columns(4)
for col, label, val in [
    (c1, "Approved for contact", len(pipeline)),
    (c2, "Awaiting signature", sum(1 for p in pipeline if ss.nv_consent.get(p, {}).get("invited_at") and not ss.nv_consent[p].get("signed_at"))),
    (c3, "Signed", len(signed)),
    (c4, "Mean comprehension", f'{sum(c.get("comprehension", 0) for c in signed) / len(signed):.1f} / 5' if signed else "—"),
]:
    with col.container(border=True):
        st.metric(label, val)

st.subheader("Consent register")
table = []
for pid in pipeline:
    c = ss.nv_consent.get(pid, {})
    waiting = (datetime.now() - datetime.strptime(c["invited_at"], "%Y-%m-%d")).days if c.get("invited_at") and not c.get("signed_at") else None
    table.append({
        "Patient": pid,
        "Stage": state.stage_of(pid, status[pid]),
        "Form": c.get("form", "—"),
        "Invited": c.get("invited_at", "—"),
        "Signed": c.get("signed_at") or (f"waiting {waiting} d" + (" · overdue" if waiting > 7 else "") if waiting is not None else "—"),
        "Comprehension": f'{c["comprehension"]}/5' + (" · call back" if c.get("callback") else "") if "comprehension" in c else "—",
        "Study ID": c.get("study_id", "—"),
        "Identity": state.vault_key(pid) if ss.get(f"vault_{pid}") else "Locked",
    })
st.dataframe(pd.DataFrame(table), hide_index=True, width="stretch")

st.subheader("Work on one patient")
pid = st.selectbox("Patient", pipeline, format_func=lambda p: f"{p} · {state.stage_of(p, status[p])}")
c = ss.nv_consent.get(pid, {})
left, right = st.columns([3, 2], gap="large")
with left:
    with st.container(border=True):
        if not c.get("invited_at"):
            st.markdown("**Step 1 · Send the consent invitation**")
            st.caption(f"Consent form {state.CONSENT_FORM_VERSION}, sent by secure link.")
            if st.button("Send invitation", type="primary"):
                state.invite(pid)
                st.rerun()
        elif not c.get("signed_at"):
            st.markdown("**Step 2 · Comprehension check and signature** (as the participant would see it)")
            answers = []
            for i, (q, _) in enumerate(state.COMPREHENSION):
                answers.append(st.radio(f"{i + 1}. {q}", [True, False], format_func=lambda v: "True" if v else "False", horizontal=True, index=None, key=f"q{i}_{pid}") is True)
            sign = st.checkbox("I have read the information sheet and agree to take part.", key=f"sign_{pid}")
            if st.button("Submit", type="primary"):
                score = state.record_consent(pid, answers, sign)
                if score < 4:
                    st.warning(f"Comprehension {score}/5. The study team will call to explain again before signature.")
                elif not sign:
                    st.warning("Comprehension passed, but the consent box was not ticked.")
                else:
                    st.rerun()
        elif not c.get("enrolled_at"):
            st.markdown(f"**Step 3 · Enrol** · consent signed {c['signed_at']}, study ID **{c['study_id']}**")
            if st.button("Confirm enrolment after baseline visit", type="primary"):
                state.enrol(pid)
                st.rerun()
        else:
            st.success(f"Enrolled {c['enrolled_at']} as **{c['study_id']}**.")
with right:
    with st.container(border=True):
        st.markdown("**Identity vault**")
        st.caption("Study data uses study IDs only. The hospital record number is kept in a separate store with a separate key.")
        if ss.nv_role == "Data custodian":
            reason = st.text_input("Reason for access (logged)", key=f"reason_{pid}")
            if st.button("Resolve identity", disabled=not reason):
                ss[f"vault_{pid}"] = True
                state.log("Identity vault access", f"{pid} → vault key · reason: {reason}")
                st.rerun()
        else:
            st.caption("Locked. Only the **Data custodian** role can open the vault.")
