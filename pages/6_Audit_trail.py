"""Audit trail · every decision, consent event, vault access and assistant query, with role and time."""
import pandas as pd
import streamlit as st

from neurovation import state, ui

ui.page("Audit trail", "Append-only record of everything people did in this session, with role and time.", "Audit trail")
ss = state._ss()
df = pd.DataFrame(ss.nv_audit, columns=["time", "role", "action", "detail"])
if df.empty:
    st.info("No events yet.")
else:
    st.dataframe(df.rename(columns=str.capitalize), hide_index=True, width="stretch")
    st.download_button("Export CSV", df.to_csv(index=False).encode(), "neurovation-audit-trail.csv", "text/csv")
st.caption("In this prototype the trail lasts for the browser session. A deployed version would write it to append-only storage.")
