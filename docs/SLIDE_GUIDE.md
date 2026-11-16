# Neurovation: slide guide for a scientific presentation

**Audience:** senior scientists and clinician-scientists at A\*STAR. **Register:** a research proposal with a working prototype, not a pitch.
**Target length:** 14 main slides plus a backup section, about 15 minutes plus Q&A.

---

## 0. The reframe in one paragraph

The current draft reads as a product pitch: problem, solution, modules, competitors, ask. A scientific audience needs a **research question, a method, a falsifiable hypothesis, preliminary data, a validation design and limitations.** Keep almost all your content, but reorganise it around this question:

> **Can a clinician-in-the-loop LLM pipeline, with three-state, evidence-linked eligibility verdicts, find ≥ 95% of eligible patients for a neuromodulation trial while cutting coordinator pre-screening time by ≥ 50%?**

Three things make this scientifically interesting rather than "another AI matcher". Lead with them:

1. **Neuromodulation criteria are structurally different.** They depend on device state (active contact, IPG sensing capability), time since surgery, and *recent* scale scores (SAS, MoCA). That evidence sits in programming reports and neuropsychology letters, not structured EHR fields. All the published LLM-screening evidence is from oncology and cardiology.
2. **"Unknown" is a first-class outcome.** Missing or stale evidence is not "not met". Treating it as a third state, and ranking by the probability of eligibility, is a methods contribution you can test.
3. **The LLM reads, rules decide, people approve.** That split makes every decision auditable and lets you measure extraction errors and rule errors separately.

### Running thread

Use **one real protocol** all the way through: Zoon et al., *Trials* 2024, dorsal STN-DBS for apathy in PD (CC BY 4.0). Every method slide shows its criteria. Delete the current slide 2 (the "Database – DBS trials" notes) and fold its content into slides 4 and 7.

### Visual language for the deck

The deck should match the prototype so they read as one body of work:

* Navy `#16324F` for titles and structure, one teal accent `#1D7A85`, cool off-white background `#F5F7F9`.
* Status colours used **only** for verdicts: met `#2F7D5B`, not met `#B4473B`, unknown `#A8701A`. Always with an icon (✓ ✕ ?) as well as colour.
* Sentence-case **assertion titles**. The title states the finding: not "Results", but "In simulation, ranking finds every eligible patient after reviewing 21% of charts".
* A small grey "Synthetic data" tag in the corner of every slide that shows simulated numbers.
* Citations as short footers (Author, Journal Year) in 10–11 pt grey.

---

## Slide-by-slide

### Slide 1: Title

**On the slide**
* Title: **Neurovation: clinician-in-the-loop LLM pre-screening for neuromodulation trial recruitment**
* Subtitle: *A three-state, evidence-linked eligibility pipeline, with a working prototype and in-silico validation*
* Team names, affiliation, "A\*STAR Innovation Challenge 2026".
* Visual: a cropped screenshot of the screening queue's evidence panel (`docs/screenshots/screening.png`, right-hand side), faded to the right edge.

**Speaker notes**
* One line on who we are and why neuromodulation (team background).
* The question for today: can AI pre-screening work for trials where the eligibility evidence lives in device reports and neuropsychology letters?
* Roadmap: the problem, why neuromodulation is different, our method, simulation results, how we will validate it, and limits.

---

### Slide 2: Recruitment, not efficacy, is a leading reason neuromodulation trials fail

**On the slide**
* Left, large stat: **~1 in 5** registered DBS trials on ClinicalTrials.gov were unsuccessful, and **patient recruitment was the most common reason** (Mishra et al., *World Neurosurg X* 2024; n = 325 trials, 20.3% unsuccessful).
* Middle stat: **45–60 min** of manual chart review per patient pre-screened (Callies et al. 2025, citing usual practice).
* Right: a small "anatomy of a terminated trial" panel with two real registry examples of DBS trials stopped at **n = 1** for lack of enrolment (awake vs asleep DBS in PD, NCT02401308; DBS for tardive dyskinesia/dystonia, NCT02524886). *Check both on ClinicalTrials.gov before presenting.*
* Bottom line: "Every eligible patient we miss is one fewer in a trial that may already be underpowered."

**Replace** the Tufts "80%" number (it is a secondary source of a secondary source). If you want a general-trials figure, Carlisle et al., *Clinical Trials* 2015 reported that about 1 in 5 closed trials stopped early for poor accrual or finished with < 85% of planned enrolment. Verify the exact wording first.

**Speaker notes**
* The DBS analysis is the most relevant evidence: same device class, same registry.
* Note that a revised version of the analysis (n = 242 interventional trials) gives 78.1% successful and the same top reasons, so the finding holds.
* Neuromodulation trials are small (Zoon et al. plan n = 26), so each missed patient matters.
* Pause on the n = 1 examples: these were not failures of the science; the trials could not find their patients.

---

### Slide 3: Neuromodulation eligibility depends on evidence that structured EHR fields do not hold

**This slide is new. It is your core scientific insight.**

**On the slide:** a taxonomy table built from the Zoon et al. criteria.

| Criterion (Zoon et al. 2024) | Criterion type | Where the evidence lives | What makes it hard |
|---|---|---|---|
| Idiopathic PD | Diagnosis | Clinic letters | Free text; atypical parkinsonism must be distinguished |
| ≥ 3 months of STN DBS | Time window | Operative report | Date arithmetic; target (STN vs GPi) |
| SAS ≥ 14 | Clinical scale + **recency** | Neuropsychology report | Often missing; old scores may no longer be true |
| No permanent perioperative sequelae | Surgical history | Op note, discharge summary, imaging | Negation, temporality |
| MoCA > 25 | Clinical scale + recency | Neuropsychology report | Cut-off direction ("25 or less" excludes) |
| Not already on most dorsal contact bilaterally | **Device state** | **DBS programming report / vendor portal** | Often outside the EHR entirely |
| Language | Administrative | Registration | Must be localised (Dutch → SG languages) |
| Written informed consent | Process | Only at the consent visit | Unknowable from records by definition |

* Visual: colour the "Where the evidence lives" cells by source (EHR / device report / requires contact), the same chips as in the prototype.
* Footer: "Published oncology and cardiology LLM screening studies rarely face criteria like device state."

**Speaker notes**
* Walk one row in detail: the dorsal-contact criterion. It needs the programming report, which in many centres lives in the manufacturer's tablet or portal.
* This creates a new failure mode: a model that says "not met" when it really means "I couldn't find it" silently removes eligible patients.
* That is why our design treats *unknown* as a separate state, which leads to the research question.

---

### Slide 4: Research question and hypotheses

**On the slide**
* **Question:** In a neuromodulation trial, does clinician-in-the-loop LLM pre-screening with three-state, evidence-linked verdicts maintain recall while reducing coordinator workload?
* **H1 (sensitivity):** recall ≥ 0.95 for truly eligible patients against a blinded dual-reviewer reference standard.
* **H2 (efficiency):** ≥ 50% reduction in coordinator minutes per patient pre-screened, compared with manual review.
* **H3 (faithfulness):** ≥ 95% of displayed evidence quotes are verbatim present in the source document and support the verdict.
* **Exploratory:** unknown rate by criterion type (device state vs scale vs diagnosis); subgroup recall by language and sex.
* Small "primary outcome" badge on H1.

**Speaker notes**
* Recall is primary on purpose. In recruitment a false positive costs a few minutes of review; a false negative costs a participant.
* The 0.95 threshold is a design choice we would pre-register. Invite the audience to challenge it.
* H3 matters for trust: if the quote is real, the clinician can verify a verdict in seconds.

---

### Slide 5: LLM screening is promising but unproven outside oncology and cardiology

Keep your current "evidence" slide. Make it more rigorous by adding study design and the limitation of each study.

| Study | Design | Key result | Limitation |
|---|---|---|---|
| Jin et al., *Nat Commun* 2024 (TrialGPT) | Retrospective, synthetic patient cohorts; small user study | 87.3% criterion-level accuracy (experts 88.7–90.0%); 42.6% less screening time | Synthetic patients; pilot user study (2 clinicians) |
| Unlu et al., *JAMA* 2025 (RECTIFIER) | **Randomised**, n = 4,476, heart failure | AI arm: 458 vs 284 eligible identified; 35 vs 19 enrolled | Single centre, single trial |
| Callies et al., arXiv 2025 (Inato) | Real-world, 485 patients, 36 trials | 87% accuracy; < 9 min vs 45–60 min per patient | Preprint; company-authored |
| Parikh et al., *Nat Commun* 2026 | Randomised human vs human+AI, oncology | Accuracy 76% vs 71%; **worse when the AI was badly wrong** (automation bias) | Retrospective records; single centre |

* Callout box: "**Gap:** no published evaluation in neuromodulation or device trials, and none evaluating screen-to-consent as one workflow."

**Speaker notes**
* The RECTIFIER RCT is the strongest design: randomised at patient level, and it shows enrolment, not just accuracy.
* Parikh et al. is the cautionary result: humans followed the AI when it was wrong. That directly shaped our design, with unknowns shown openly, quotes required and no auto-approval.
* Accuracy numbers are not comparable across studies (different tasks and denominators), so don't rank them against each other.
* Mark Callies et al. as a preprint when you speak.

---

### Slide 6: Method: the LLM reads, rules decide, people approve

**On the slide:** a horizontal pipeline diagram, with five boxes and arrows. Under each box, one line on *who or what* does it and *what is checked*.

1. **Protocol → criteria checklist.** LLM extracts to a fixed JSON schema (field, operator, threshold, recency window, source sentence) → *research officer verifies*.
2. **Records → evidence.** LLM extracts the value, date and a **verbatim quote** per criterion → *if the quote does not string-match the source, the verdict becomes "unknown"*.
3. **Rules → verdict.** Deterministic, versioned rules → **met / not met / unknown**.
4. **Ranking.** P(eligible) (next slide) → ordered review queue.
5. **Clinician decision.** Research officer reviews, PI approves contact → eConsent → study ID → pseudonymised database.

* Side panel, "Why not end-to-end LLM judgement?": auditable rules · thresholds editable without re-prompting · extraction errors separable from logic errors · unknown cannot be hallucinated into "met".

**Speaker notes**
* The LLM is used only where language is the problem: reading protocols and notes.
* Decisions are code: "MoCA ≤ 25 excludes" is a line an IRB can read and we can unit-test.
* The quote-matching check is a simple, strong guard against fabricated evidence.
* Every step is logged with model version and prompt hash, for TRIPOD-LLM reporting.

---

### Slide 7: Ranking by the probability of eligibility, not by a black-box score

**On the slide**
* The formula, large and centred:

  **P(eligible) = ∏ over criteria of { 1 if met · 0 if not met · πᵢ if unknown }**

  where πᵢ = (met + 1) / (assessable + 2) is estimated from the cohort's documented records (Laplace-smoothed). Consent uses a fixed prior from historical consent rates (0.70).
* Worked example from the prototype (PT-1001): all criteria met except E4 (device state, unknown) and E5 (consent, unknown) → **0.88 × 0.70 = 0.61 (High)**.
* Small table of the estimated priors for the Zoon criteria: I1 0.92 · I2 0.73 · I3 0.41 · E1 0.98 · E2 0.51 · E3 0.78 · E4 0.88 · E5 0.70 (fixed).
* Freshness rule: SAS > 180 days old or MoCA > 365 days old → unknown, flagged for re-assessment. *These are site rules we added, not protocol rules. Say so.*

**Speaker notes**
* The score has a meaning: under an independence assumption, it is the chance this patient turns out eligible.
* It is fully decomposable. The UI shows the multiplication for every patient.
* Independence is a known simplification (MoCA and apathy are correlated). With a small n, an interpretable model is the right first step. A learned model can be compared in Stage 2.
* The score orders the queue. It never makes a decision.

---

### Slide 8: Prototype: from protocol to an evidence-linked queue

**On the slide:** two screenshots side by side, each with 2–3 numbered callouts.
* `docs/screenshots/protocol.png`: (1) source sentence kept verbatim, (2) editable threshold, (3) evidence source chip (EHR / Device report / Requires contact).
* `docs/screenshots/screening.png`: (1) ranked queue with met / not met / unknown tally, (2) score decomposition, (3) quoted evidence with document and date, (4) approve button enabled only for the PI role.
* Caption: "Working prototype · synthetic data · runs entirely in the browser · open source on GitHub".

**Speaker notes**
* Do the live demo here if time allows (90 seconds): change the SAS threshold from 14 to 12 and watch the queue re-rank; open a patient; show the PI-only approval.
* Mention that the protocol is real (CC BY), but the patients are synthetic.

---

### Slide 9: Prototype: consent, pseudonymisation, dashboard and a grounded assistant

**On the slide:** a 2 × 2 grid of cropped screenshots (overview, participants, assistant, audit). One line each:
* **Dashboard:** funnel 220 → 47 → 14 → 8 → 7; screen failures by criterion; enrolment vs plan (7 of 26, plan 15 by now).
* **eConsent:** form version control (v2.0 flagged for re-consent); 5-item comprehension check, < 4/5 triggers a call-back.
* **Identity vault:** study IDs everywhere; only the data-custodian role can resolve an ID, and each look-up is logged.
* **Assistant:** answers only from database queries and protocol text, cites its sources, and refuses identity questions by role.

**Speaker notes**
* The scientific point here is data governance, not features. Pseudonymisation by design keeps the analysis dataset clean for research use under HBRA.
* "Screen failures by criterion" is research data too: it shows which eligibility rules shrink the pool. That can feed back into protocol design (e.g. the MoCA > 25 cut-off removes many otherwise eligible patients).
* The assistant is staff-facing only. A patient-facing version is future work because ambiguous answers are the hard part.

---

### Slide 10: In-silico shadow mode: ranking finds every eligible patient after reviewing 21% of charts

**Mark this slide "Simulation · synthetic cohort" in the title area.**

**On the slide**
* Left, the threshold chart from `docs/screenshots/validation.png` (recall, precision and workload against threshold).
* Right, a results table:

| Metric (threshold 0.10) | Value | 95% CI (Wilson) |
|---|---|---|
| Truly eligible | 23 / 220 (10.5%) | — |
| Recall | **100%** (23/23) | 86–100% |
| Precision | 49% (23/47) | 35–63% |
| Charts needing human review | **21%** (47/220) | — |
| Average precision (PR-AUC) | 0.75 | chance = 0.10 |
| Modelled coordinator time | 193 h → 7 h | assumption-driven |

* Below: "Unknown from records: SAS 37% · MoCA 28% · device state 27% · perioperative 11% · diagnosis 3%."
* Trade-off sentence: "Raising the threshold to 0.20 cuts review to 15% of charts but recall falls to 83% (19/23)."

**Speaker notes**
* Be explicit: this is a simulation that tests the *method*, not real-world performance.
* How the cohort works: each synthetic patient has a full truth and a documented view with realistic missing and stale data. Distributions are in `docs/DATA.md`.
* The key finding is the unknown pattern: device state and recent scale scores are the biggest gaps, which supports slide 3's claim.
* An honest limit: in the simulation, documented values are never *wrong*, only missing. Real extraction errors will lower recall. That is exactly what Stage 1 measures.
* The time model uses the 45–60 min manual and < 9 min assisted figures from Callies et al. We will measure both ourselves.

---

### Slide 11: Validation plan: three stages, pre-registered, with reporting standards

**On the slide:** a three-column timeline.

| | Stage 1: Retrospective shadow mode | Stage 2: Prospective pilot | Stage 3: Multi-trial, multi-site |
|---|---|---|---|
| Setting | One closed neuromodulation trial at a partner hospital | One recruiting trial | 3+ trials (DBS, VNS, SCS), 2+ sites |
| Design | AI ranks the full historical screening population; **reference standard = two blinded independent chart reviewers plus adjudication** | Patient-level randomisation of the pre-screening method (AI-assisted vs manual), following the Unlu et al. design | Stepped rollout |
| Primary outcome | Recall at the pre-specified threshold (H1); quote faithfulness (H3) | Coordinator minutes per patient (H2); time from identification to consent | Enrolment rate per month; generalisability |
| Sample size | To estimate recall of 0.95 to ± 0.07 (95% CI) needs **≈ 38 eligible patients** (n = z²·p(1−p)/d²). At ~10% prevalence, about **380 charts** | Powered on minutes per patient from Stage 1 variance | — |
| Safety | Error analysis by criterion type | Automation-bias check: seeded "known wrong" AI suggestions, measure override rate | Subgroup recall by language, sex, age |

* Footer: "Reported per TRIPOD-LLM and DECIDE-AI. Protocol pre-registered before unblinding."

**Speaker notes**
* Stage 1 is cheap and uses no new patient contact, so it is the right first ask.
* We fix the threshold *before* seeing the reference standard, to avoid tuning to the answer.
* The seeded-error check directly addresses Parikh et al.'s automation-bias finding.
* Fairness: the language criterion could systematically exclude some groups, so we report recall by language.
* Fill in durations once the partner site is confirmed. Stage 1 is realistic in about 3–4 months after IRB approval.

---

### Slide 12: Safety and governance by design

Keep your "Trust by design" slide, but present it as a **failure-mode table**. Scientists trust a team that names its failure modes.

| Failure mode | Mitigation in the design | How we measure it |
|---|---|---|
| Hallucinated evidence | Quote must string-match the source, otherwise "unknown" | Quote faithfulness (H3) |
| Missing or stale data read as "not met" | Three-state verdicts; freshness windows | Unknown rate; recall |
| Automation bias | No auto-approval; unknowns shown openly; PI approval required | Override rate on seeded errors |
| Biased exclusion | Subgroup analysis; language criterion localised | Recall by subgroup |
| Privacy breach | Study IDs only; separate identity vault; role-scoped assistant; on-premise model | Audit log review |
| Protocol drift | Criteria versioned; consent-form version control | Audit trail |

* Footer: "Designed with Singapore's HBRA and PDPA in mind. IRB, DPO and MOH review to be confirmed with the partner hospital. We make no regulatory claim yet."

**Speaker notes**
* The PI approves every contact: decision support, not autonomous screening.
* Data stays inside the hospital network, either with a locally hosted model or an approved enterprise endpoint.
* Whether this counts as software as a medical device depends on intended use. Because it supports research recruitment, not diagnosis or treatment, we expect it falls outside, but we will confirm with HSA. Say this as a question, not a claim.

---

### Slide 13: Limitations and open questions

**On the slide:** two columns.

*Limitations*
* Simulation shows missing data only, not extraction error.
* The independence assumption in the score.
* Priors are site-specific and may be poorly calibrated at a new site.
* Device-state data may be unreachable without vendor-portal integration.
* One protocol so far; the dorsal-contact criterion is unusual.

*Open questions for the audience*
* What recall threshold would a PI accept?
* Is "time to consent" or "enrolment rate" the better primary outcome for Stage 2?
* Can programming-report data be accessed in A\*STAR-partner hospitals?

**Speaker notes**
* Inviting critique is a strength with a scientific audience.
* Use this slide to turn Q&A into collaboration: "if you run a neuromodulation trial, we would like your closed trial for Stage 1".

---

### Slide 14: Summary and what we need

**On the slide**
* Three takeaway lines:
  1. Neuromodulation eligibility depends on device-state and recency-sensitive scale evidence that standard EHR fields do not hold.
  2. Three-state, evidence-linked verdicts with probabilistic ranking found every eligible patient in simulation, with humans reviewing 21% of charts.
  3. A pre-registered three-stage validation will test whether this holds on real records.
* **What we need:** (a) one closed neuromodulation trial's protocol and screening log for Stage 1; (b) a clinical PI and research officer partner; (c) [funding amount] for 12 months; (d) IRB sponsorship.
* QR code to the live prototype (GitHub Pages link) and to the repository.

**Speaker notes**
* Restate the question from slide 4 and answer it: "promising in simulation; here is how we will find out for real".
* End on the ask, then say thank you and open the floor.

---

## Backup slides (after "Thank you")

1. **Competitive landscape** (your current slide 11). Seniors may ask, but it is not part of the scientific story. Keep it as backup.
2. **Workflow today vs with the co-pilot** (your current slide 5 table). Good for clinician questions.
3. **Synthetic data generation:** the table from `docs/DATA.md`.
4. **Second protocol: illustrative adaptive DBS**, showing that the method generalises to device criteria (sensing IPG, OFF-time diary). It is labelled illustrative in the prototype.
5. **Architecture and deployment:** the diagram from `docs/ARCHITECTURE.md`.
6. **Sample-size calculation** worked out, with the Wilson interval formula.

---

## Mapping from your current draft

| Current slide | Action |
|---|---|
| 1 (blank) | Delete |
| 2 Database – DBS trials | Delete; content moves to slides 3 and 7 |
| 3 Title | Retitle as on slide 1 above |
| 4 The problem | Rework as slide 2 (DBS-specific evidence, not Tufts) |
| 5 Research officer's day | Move to backup |
| 6 Four modules | Merge into slide 9 |
| 7 Protocol matching | Becomes slides 6–8 (method, scoring, prototype) |
| 8 Chatbot | Merge into slide 9 |
| 9 Funnel | Merge into slide 9 |
| 10 Evidence | Slide 5, with design and limitation columns added |
| 11 Landscape | Backup |
| 12 Trust by design | Slide 12 as a failure-mode table |
| 13 Plan | Slide 11, with sample size and outcomes |
| 14 Ask | Slide 14 |
| *new* | Slide 3 (taxonomy), 4 (hypotheses), 10 (simulation results), 13 (limitations) |

## References to verify before presenting

Check every figure against the primary source. Some figures came from abstracts or press summaries.

* Zoon TJC et al. *Trials* 2024;25:104. doi:10.1186/s13063-024-07938-9 (CC BY 4.0). Check the paraphrased exclusion criteria (a), (c), (d) against the full text.
* Mishra et al. Why are clinical trials of deep brain stimulation terminated? *World Neurosurg X* 2024; plus the revised version (Shafqat & Okon).
* Jin Q et al. Matching patients to clinical trials with large language models. *Nat Commun* 2024. doi:10.1038/s41467-024-53081-z
* Unlu O et al. Manual vs AI-assisted prescreening for trial eligibility using large language models: a randomized clinical trial. *JAMA* 2025. doi:10.1001/jama.2024.28047
* Callies A et al. Real-world validation of a multimodal LLM-powered pipeline… arXiv:2503.15374 (2025), a preprint.
* Parikh RB et al. Human-AI teaming to improve accuracy and efficiency of eligibility prescreening for oncology trials. *Nat Commun* 2026. doi:10.1038/s41467-026-68873-8 (NCT06561217)
* Carlisle B et al. Unsuccessful trial accrual and human subjects protections. *Clin Trials* 2015, if you use the general-trials figure.
* TRIPOD-LLM (Gallifant et al., *Nat Med* 2025) and DECIDE-AI (Vasey et al., *Nat Med* / *BMJ* 2022), the reporting guidelines.
