"""Shared look for the Neurovation pages: page header, sidebar, badges.

Colours and font come from .streamlit/config.toml, which also styles the original matching page.
The small CSS block below only adds badge and card styles that Streamlit has no setting for.
"""
import html

import streamlit as st

from trialmatch.llm import DEFAULT_MODEL, get_client

from . import state

CSS = """
<style>
.nv-crumbs {font-size: 13px; color: #667085; margin-bottom: -6px;}
.nv-sub {color: #475467; font-size: 14px; max-width: 820px; margin-top: -6px;}
.nv-badge {display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 8px; border-radius: 6px;
  border: 1px solid #E4E7EC; background: #F9FAFB; font-size: 12px; font-weight: 500; color: #344054; white-space: nowrap;}
.nv-badge i {width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block;}
.nv-ok {background: #ECFDF3; border-color: #ABEFC6; color: #067647;}
.nv-bad {background: #FEF3F2; border-color: #FECDCA; color: #B42318;}
.nv-warn {background: #FFFAEB; border-color: #FEDF89; color: #B54708;}
.nv-blue {background: #EEF3FE; border-color: #C7D6FB; color: #2A56C6;}
.nv-quote {margin-top: 6px; padding: 8px 12px; background: #F9FAFB; border: 1px solid #E4E7EC; border-radius: 8px;
  font-size: 13px; color: #344054;}
.nv-row {padding: 10px 0; border-bottom: 1px solid #E4E7EC;}
.nv-row:last-child {border-bottom: 0;}
.nv-muted {color: #667085; font-size: 12.5px;}
</style>
"""

TONE = {"pass": "nv-ok", "fail": "nv-bad", "unknown": "nv-warn"}
LABEL = {"pass": "Pass", "fail": "Fail", "unknown": "Unknown"}
STATUS_TONE = {"Likely eligible": "nv-ok", "Needs review": "nv-warn", "Not eligible": "nv-bad"}
STAGE_TONE = {"Not ruled out": "", "Approved for contact": "nv-blue", "Invited": "nv-warn", "Consented": "nv-blue", "Enrolled": "nv-ok"}


def badge(text: str, tone: str = "") -> str:
    return f'<span class="nv-badge {tone}"><i></i>{html.escape(text)}</span>'


def role_picker():
    """'Signed in as' block. Called inside `with st.sidebar:` on every page, including app.py."""
    ss = state._ss()
    st.divider()
    st.subheader("Signed in as")
    role = st.selectbox("Role", state.ROLES, index=state.ROLES.index(ss.nv_role), label_visibility="collapsed")
    if role != ss.nv_role:
        ss.nv_role = role
        state.log("Switched role", role)
    st.caption("Roles control who can approve contact (principal investigator) and who can open the identity vault (data custodian).")


def page(title: str, subtitle: str, crumb: str):
    st.set_page_config(page_title=f"{title} · Neurovation", layout="wide")
    st.markdown(CSS, unsafe_allow_html=True)
    ss = state._ss()
    with st.sidebar:
        # Same "Status" block as the protocol-matching page (app.py), then the shared role picker,
        # so every page's sidebar is identical.
        st.subheader("Status")
        if get_client():
            st.success(f"Claude connected\n\nModel: {DEFAULT_MODEL}")
        else:
            st.info("Offline mode: no ANTHROPIC_API_KEY. Demo matching and rule-based criteria extraction only.")
        st.write(f"{len(state.load_patients())} synthetic patients loaded")
        st.caption("Pass = requirement met. For an exclusion criterion, Pass = the exclusion does not apply.")
        role_picker()
    st.markdown(f'<div class="nv-crumbs">Neurovation / {html.escape(crumb)}</div>', unsafe_allow_html=True)
    st.title(title)
    st.markdown(f'<div class="nv-sub">{subtitle}</div>', unsafe_allow_html=True)
    st.write("")


def needs_progress_hint():
    ss = state._ss()
    if not ss.nv_decisions:
        st.info("No decisions yet. Approve patients on **Review and approve**, or fill the workflow with synthetic demo progress.")
        if st.button("Simulate demo progress", key="simulate"):
            state.simulate_progress()
            st.rerun()
