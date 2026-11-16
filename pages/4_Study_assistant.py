"""Module 5 · Study assistant (staff-facing, grounded, role-scoped, logged)."""
import streamlit as st

from neurovation import assistant, state, ui

ui.page(
    "Study assistant",
    "For study staff, not patients. Answers come only from the protocol, the matching results and the study records; "
    "each answer lists its sources. Identity questions are refused unless your role allows them.",
    "Study assistant",
)
ss = state._ss()
ss.setdefault("nv_chat", [])
AVATAR = {"user": ":material/person:", "assistant": ":material/neurology:"}

left, right = st.columns([3, 1.3], gap="large")
with right:
    with st.container(border=True):
        st.markdown("**Suggested questions**")
        clicked = None
        for q in assistant.SUGGESTIONS + ["Why is PT-101 ranked where it is?", "What is the name of PT-101?"]:
            if st.button(q, width="stretch", key=f"sugg_{q}"):
                clicked = q
    with st.container(border=True):
        st.markdown("**Guardrails**")
        st.caption("**Grounded:** every number comes from a query.  \n**Scoped:** no identities unless your role allows it.  \n"
                   "**Advisory:** it suggests; a clinician decides.  \n**Logged:** every question goes to the audit trail.")

with left:
    history = st.container(height=520, border=True)
    typed = st.chat_input("Ask about eligibility gaps, exclusions, consent or a patient ID…")
    q = typed or clicked
    if q:
        text, sources, refused = assistant.answer(q)
        ss.nv_chat += [("user", q, [], False), ("assistant", text, sources, refused)]
        state.log("Assistant query", f"“{q}”" + (" (refused for role)" if refused else ""))
    with history:
        if not ss.nv_chat:
            with st.chat_message("assistant", avatar=AVATAR["assistant"]):
                st.write("Ask a question about this study. I answer from the protocol and study records only.")
        for who, text, sources, refused in ss.nv_chat:
            with st.chat_message(who, avatar=AVATAR[who]):
                (st.warning if refused else st.write)(text)
                if sources:
                    st.markdown(" ".join(ui.badge(s) for s in sources), unsafe_allow_html=True)
