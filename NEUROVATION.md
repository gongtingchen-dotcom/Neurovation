# Neurovation: the full workflow around protocol matching

This branch adds the rest of the Neurovation pipeline **around** the protocol-matching prototype. Nothing in `trialmatch/`, `data/`, `scripts/`, `tests/test_core.py`, `README.md` or `requirements.txt` was changed. `app.py` gains exactly two marked lines, an import and one call, that add the shared **Signed in as** role picker under its Status block, so every page has the same sidebar. Two tests check both of these against `main`.

## Run

```
pip install -r requirements.txt
streamlit run app.py
```

The sidebar now lists seven pages:

| Page | Module | What it does |
|---|---|---|
| **app** | 1–2 · Protocol matching (original, unchanged) | Upload a protocol, extract criteria, rank patients with evidence |
| **Review and approve** | 2b · Clinician review | Ranked queue → evidence per criterion → approve (principal investigator only), request information, or mark not eligible |
| **Consent and onboarding** | 3 · eConsent | Invitation → 5-question comprehension check (< 4/5 triggers a call-back) → signature → study ID → enrolment; role-gated identity vault |
| **Dashboard** | 4 · Recruitment dashboard | Funnel, screen failures and unknowns by criterion, needs-attention list |
| **Study assistant** | 5 · Staff assistant | Questions answered only from the criteria, matching results and study records, with sources; identity questions refused by role |
| **Validation** | Quality | The module's own `compare()` against the synthetic correct answers, plus a stress test that simulates reading errors |
| **Audit trail** | Quality | Every decision, consent event, vault access and assistant query, exportable as CSV |

Every page's sidebar shows the same **Status** block (AI mode, patients loaded) and the same **Signed in as** role picker. Pick a role: **Research officer**, **Principal investigator** or **Data custodian**. On the Dashboard, **Simulate demo progress** fills the workflow with synthetic decisions and consent events.

## How it connects to the matching module

* If you ran matching on the **app** page, the other pages use those results: your criteria, Demo or Live mode.
* Otherwise they call the module's own functions, `trialmatch.matcher.match_demo` and `trialmatch.scoring.rank`, on the bundled sample protocol.
* Ranking, score and status always come from `trialmatch.scoring`, unchanged.

## Shared look

`.streamlit/config.toml` sets one theme for every page, including the original one: colours, Inter font, borders, corner radius, status colours and chart colours. It is configuration only, with no code change. It matches the Neurovation design system: blue `#2A56C6` for actions, grey scale `#101828` / `#475467` / `#98A2B3`, green / red / amber for pass / fail / unknown.

## Files added

```
.streamlit/config.toml      shared theme
neurovation/state.py        shared session state, decisions, consent records, audit log
neurovation/ui.py           page header, sidebar role picker, badges
neurovation/assistant.py    grounded question answering
pages/1_…6_*.py             the six new pages
tests/test_neurovation.py   page smoke tests, role checks, "original files unchanged" check
NEUROVATION.md              this file
```

## Limits

* Workflow records (decisions, consent, audit) last for the browser session; there is no database yet.
* Correct answers exist only for the bundled sample protocol, so Validation needs that protocol loaded.
* All patients are synthetic.
