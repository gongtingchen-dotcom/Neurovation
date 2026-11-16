# Protocol matching prototype

Step 1 of the trial co-pilot. Upload a protocol PDF, match demo patients, see them ranked by match score with the evidence for each criterion.

All patients are **synthetic**. The score orders a review queue. A clinician decides.

## Run (PowerShell)

    pip install -r requirements.txt
    streamlit run app.py

Then: tab 1 -> "Use the bundled sample protocol" -> tab 2 -> "Run matching" -> tab 3 for the evidence.

## Modes

| Mode | Needs | What it does |
|---|---|---|
| Demo | nothing | Precomputed verdicts for the bundled sample protocol. No AI. |
| Live | `ANTHROPIC_API_KEY` | Claude reads each note, gives pass/fail/unknown with a quoted sentence. Evidence not found verbatim in the note is downgraded to unknown. |

Set a key in PowerShell with `$env:ANTHROPIC_API_KEY="sk-..."`. Model: `$env:TRIALMATCH_MODEL` (default `claude-sonnet-5-5`).

Without a key, uploaded PDFs use rule-based criteria extraction (bulleted or "(a) ... (b) ..." layouts). Check the criteria table and fix it by hand before matching.

## Honest status

- Tested here: PDF extraction, scoring, evidence validation, demo flow, app smoke test (`pytest`).
- **Not tested here: the live Claude path** (no API key in the build sandbox). Try it on your machine first.
- The bundled PDF is a **test fixture** written from the public ClinicalTrials.gov record NCT00056563, not the original protocol.
- Score = (passes + 0.5 x unknowns) / criteria, halved per fail. A heuristic, not a validated model.

## Real protocol to try

Zoon et al. 2024, Trials (CC BY 4.0): https://trialsjournal.biomedcentral.com/articles/10.1186/s13063-024-07938-9 -> Download PDF.
Live mode will not have ground truth for it, so read the evidence yourself.

## Layout

    app.py              Streamlit app
    trialmatch/         pdf, criteria, matcher, scoring, llm
    scripts/            make_fixture.py, make_patients.py (regenerate data/)
    data/               fixture PDF, 20 synthetic patients, sample criteria
    tests/
