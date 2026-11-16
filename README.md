# Neurovation: clinical trial recruitment pipeline

A prototype that takes a Parkinson's disease (PD) trial from **protocol** to **enrolled participant** in one app:

1. Read the protocol's eligibility criteria.
2. Pre-screen patients, with the evidence for every criterion.
3. A clinician reviews and approves who may be contacted.
4. Electronic consent (eConsent) with a comprehension check.
5. Track recruitment, ask questions of the study data, and check how well screening works.

All patients are **synthetic**. The match score only orders a review queue; **a clinician decides**.

## Quick start

You need Python 3.10 or newer.

    pip install -r requirements.txt
    streamlit run app.py

Then:

1. On **app**: tab 1 → **Use the bundled sample protocol**; tab 2 → **Run matching**; tab 3 shows the evidence.
2. Open **Dashboard** → **Simulate demo progress** to fill the workflow with synthetic decisions and consent events.
3. Switch roles under **Signed in as** in the sidebar to try what each role is allowed to do.

Run the tests with `python -m pytest`.

## The pipeline

```
 Protocol PDF ─▶ [1 · Protocol matching] ─▶ ranked patients + evidence per criterion
                                                  │
                                [2 · Review and approve]  research officer reviews, principal investigator approves
                                                  │
                                [3 · Consent and onboarding]  invitation → comprehension check → signature → study ID → enrolment
                                                  │
                     [4 · Dashboard] ◀──▶ [5 · Study assistant]
                                                  │
         Running underneath: [Validation] · [Audit trail] · roles · one shared look
```

| Sidebar page | Module | What it does |
|---|---|---|
| **app** | 1 · Protocol matching | Upload a protocol PDF, extract inclusion and exclusion criteria (edit them by hand if needed), match the patients, rank them by match score, and show the quoted evidence for each criterion. Details below. |
| **Review and approve** | 2 · Clinician review | The ranked list becomes a review queue. Open a patient to see pass / fail / unknown with the quoted sentence for every criterion. **Only the principal investigator** can approve a patient for contact; anyone can request more information or mark a patient not eligible. Every decision is logged. |
| **Consent and onboarding** | 3 · eConsent | For approved patients: send the invitation → 5-question true/false comprehension check (a score below 4/5 triggers a call-back before signature) → signature → a study ID (NV-001…) → enrolment. An **identity vault** links the study ID to the hospital record number; only the **data custodian** can open it, and must give a reason, which is logged. |
| **Dashboard** | 4 · Recruitment dashboard | Funnel (identified → not ruled out → approved → invited → consented → enrolled), screen failures by criterion, unknowns by criterion, and a "needs attention" list (unreviewed patients, consent unsigned for over 7 days, comprehension call-backs, open information requests). |
| **Study assistant** | 5 · Staff assistant | Answers staff questions ("Which patients are one criterion short?", "Who is overdue for consent?") using only the criteria, the matching results and the study records, and lists its sources. Questions about a patient's identity are refused unless the role is data custodian. Every question is logged. |
| **Validation** | Quality | Compares the matching results with the synthetic patients' correct answers (criterion-level agreement, recall and precision of possible eligibles). Includes a **stress test** that simulates a reader making mistakes, to show how recall falls as errors rise. |
| **Audit trail** | Quality | Every role switch, decision, consent event, vault access and assistant question, with role and time. Export as CSV. |

### Roles

| Role | Can do |
|---|---|
| Research officer | Review patients, request information, mark not eligible, run consent steps |
| Principal investigator | Everything above, plus **approve a patient for contact** |
| Data custodian | Open the **identity vault** (with a logged reason) |

## Module 1 · Protocol matching (`app.py`, `trialmatch/`)

Upload a protocol PDF, match the synthetic patients, and see them ranked by match score with the evidence for each criterion.

### Modes

| Mode | Needs | What it does |
|---|---|---|
| Demo | nothing | Precomputed verdicts for the bundled sample protocol. No AI. |
| Live | `ANTHROPIC_API_KEY` | Claude reads each note and gives pass/fail/unknown with a quoted sentence. Evidence not found word for word in the note is downgraded to unknown. |

Set a key in PowerShell with `$env:ANTHROPIC_API_KEY="sk-..."` (macOS/Linux: `export ANTHROPIC_API_KEY=sk-...`). Model: `$env:TRIALMATCH_MODEL` (default `claude-sonnet-5-5`).

Without a key, uploaded PDFs use rule-based criteria extraction (bulleted or "(a) ... (b) ..." layouts). Check the criteria table and fix it by hand before matching.

### Score

Score = (passes + 0.5 × unknowns) ÷ criteria, halved for each fail. Status: any fail → **Not eligible**; no fail and no unknown → **Likely eligible**; otherwise **Needs review**. A heuristic for ordering the queue, not a validated model. All later modules use this score and status unchanged.

### Honest status

- Tested: PDF extraction, scoring, evidence validation, demo flow, app smoke test (`pytest`).
- **Not yet tested: the live Claude path.** Try it on your machine first.
- The bundled PDF is a **test fixture** written from the public ClinicalTrials.gov record NCT00056563 (deep brain stimulation vs best medical therapy in Parkinson's disease), not the original protocol.

### Real protocol to try

Zoon et al. 2024, *Trials* (CC BY 4.0): https://trialsjournal.biomedcentral.com/articles/10.1186/s13063-024-07938-9 → Download PDF. Live mode has no correct answers for it, so read the evidence yourself.

## Data

- `data/patients.json`: **20 synthetic patients** (PT-101 to PT-120). Each has age, sex, one free-text clinic note, and the correct verdict with evidence for each of the 11 sample criteria. Generated by `scripts/make_patients.py`, which mixes likely-eligible, needs-review, near-miss and not-eligible patients.
- `data/sample_criteria.json`: the 11 criteria (6 inclusion, 5 exclusion) from the fixture protocol.
- Modules 2–5 add **workflow records only**: decisions, consent events, study IDs and the audit log. They live in the browser session and are not written to `data/`. The identity-vault number is a placeholder computed from the patient ID; it is not stored and not real.

## How the modules connect

- If you ran matching on the **app** page, the other pages use those results: your criteria, Demo or Live mode.
- Otherwise they call the matching module's own functions (`trialmatch.matcher.match_demo`, `trialmatch.scoring.rank`) on the bundled sample protocol.
- Every page shows the same sidebar: the **Status** block (AI mode, patients loaded), then **Signed in as**.

## Look and feel

`.streamlit/config.toml` gives every page one theme: Inter font, blue `#2A56C6` for actions, a cool grey scale, light borders, and green / red / amber for pass / fail / unknown. It is configuration only.

## Layout

    app.py                     Module 1: protocol matching (Streamlit entry page)
    trialmatch/                matching engine: pdf, criteria, matcher, scoring, llm
    pages/                     Modules 2–5 and quality pages (one file per sidebar page)
    neurovation/state.py       shared session state: decisions, consent records, audit log
    neurovation/ui.py          page header, shared sidebar (Status + Signed in as), badges
    neurovation/assistant.py   grounded study assistant
    .streamlit/config.toml     shared theme
    scripts/                   make_fixture.py, make_patients.py (regenerate data/)
    data/                      fixture PDF, 20 synthetic patients, sample criteria
    tests/                     test_core.py (matching), test_neurovation.py (other modules)

## Limits

- Workflow records last for the browser session; there is no database yet.
- Correct answers exist only for the bundled sample protocol, so Validation needs that protocol loaded.
- All patients are synthetic. Not for clinical use.
