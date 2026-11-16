# Neurovation: slide guide (version 3)

**Audience:** senior scientists and clinician-scientists at A\*STAR (Agency for Science, Technology and Research).
**Register:** scientific and engineering: problem, mechanism, evidence. Not a sales pitch.
**Structure (as requested):** 1 Title → 2 The problem → 3 Platform overview → 4 Module by module → 5 Conclusion.
**Length:** about 15 slides plus backups, 15–18 minutes.

> **Abbreviation rule.** Every abbreviation is spelled out the first time it appears in this guide, and again the first time it appears on each slide. On the slides, write the full term first, then the abbreviation in brackets: "deep brain stimulation (DBS)". The glossary below is also worth a backup slide.

---

## Glossary

| Abbreviation | Full name | What it means here |
|---|---|---|
| PD | Parkinson's disease | The condition all four trials study |
| DBS | Deep brain stimulation | Implanted electrodes that deliver electrical pulses to deep brain targets |
| aDBS | Adaptive deep brain stimulation | DBS that adjusts itself in real time from the brain's own signals ("closed loop") |
| STN | Subthalamic nucleus | The most common DBS target in PD |
| GPi | Globus pallidus internus | The other common DBS target |
| IPG | Implantable pulse generator | The battery and stimulator unit of a DBS system |
| LFP | Local field potential | The brain signal a "sensing" IPG records, which aDBS uses |
| SCS | Spinal cord stimulation | Electrodes over the spinal cord, being tested for gait problems |
| FOG | Freezing of gait | Sudden, brief inability to step forward ("feet glued to the floor") |
| NFOG-Q | New Freezing of Gait Questionnaire | Freezing severity score, 0–28 |
| MDS-UPDRS | Movement Disorder Society–Unified Parkinson's Disease Rating Scale | Standard PD rating scale; part III is the motor examination |
| H&Y | Hoehn and Yahr stage | PD severity stage from 1 (one side) to 5 (wheelchair or bed-bound) |
| ON / OFF | Medication ON / OFF state | ON = medication working well; OFF = medication worn off, symptoms return |
| MoCA | Montreal Cognitive Assessment | Cognitive screening test, 0–30 |
| SAS | Starkstein Apathy Scale | Apathy questionnaire, 0–42 |
| CAPSIT-PD | Core Assessment Program for Surgical Interventional Therapies in PD | The classic DBS candidate-selection guideline (1999) |
| EHR / EMR | Electronic health record / electronic medical record | The hospital's patient record system |
| NGEMR | Next Generation Electronic Medical Record | Singapore's shared public-sector EMR programme |
| LLM | Large language model | The AI model type that reads free text (e.g. the model family behind ChatGPT and Claude) |
| JSON | JavaScript Object Notation | A structured text format that software can read |
| PI | Principal investigator | The doctor responsible for the trial |
| IRB | Institutional review board | The ethics committee that approves studies |
| HBRA | Human Biomedical Research Act (Singapore) | The law governing human biomedical research |
| PDPA | Personal Data Protection Act (Singapore) | The data-protection law |
| RCT | Randomised controlled trial | — |
| CI | Confidence interval | The range the true value plausibly lies in (we use 95%) |
| PPV | Positive predictive value (precision) | Of the patients the tool flags, the share who are truly eligible |
| PR-AUC | Area under the precision–recall curve | One-number summary of ranking quality; 1.0 is perfect |

---

## Visual language

Match the deck to the prototype so they read as one body of work:
* White slides, near-black titles `#101828`, grey body text `#475467`, one blue accent `#2A56C6`. Use navy `#0F2742` as the background for the title and closing slides only.
* Status colours only for status: met = green `#067647`, not met = red `#B42318`, unknown = amber `#B54708`. Always pair the colour with a word.
* **Assertion titles**: each title states the slide's message. For example, not "The problem" but "One in five deep brain stimulation trials fails, most often because it cannot find patients".
* Put a grey "Synthetic data" tag on every slide that shows simulated numbers.
* Short citations in 10–11 pt grey at the bottom of the slide.
* Screenshots are in `docs/screenshots/` at 2× resolution. Crop them and add numbered callouts (1, 2, 3) rather than arrows everywhere.

---

# PART 1: TITLE

## Slide 1: Title

**On the slide**
* Title: **Neurovation: an AI-assisted platform for finding, consenting and tracking participants in Parkinson's disease neuromodulation trials**
* Subtitle: *Turning eligibility screening from hours of chart reading into minutes of evidence review, with a clinician deciding every step*
* Team: Ting Chen Gong, Kezia Susanto, Thaddeus, Jasiel · A\*STAR (Agency for Science, Technology and Research) Innovation Challenge 2026
* Visual: a cropped screenshot of the patient record panel (`screening.png`, right-hand side), faded at the edge.

**Speaker notes**
* "Neuromodulation" means treating the nervous system with electrical stimulation, such as deep brain stimulation (DBS) or spinal cord stimulation (SCS).
* Today: why finding patients for these trials is so hard; what we built; how each part works; and how we'll test it.
* The platform covers motor-symptom trials (fluctuations, early complications, freezing of gait) and non-motor trials (apathy) for Parkinson's disease (PD).

---

# PART 2: THE PROBLEM

The goal of Part 2 is that by its end the audience thinks: "Of course this is slow by hand, and of course a tool should help." Four slides, building in order: **trials fail → screening is a big task → doing it by hand is hard → others have shown AI helps, but not in our field.**

## Slide 2.1: One in five deep brain stimulation trials fails, and the most common reason is that it cannot recruit

**On the slide:** three numbers in a row, each with a one-line label and a small citation.

| Number | Label | Source |
|---|---|---|
| **20%** | of 325 deep brain stimulation (DBS) trials registered on ClinicalTrials.gov were unsuccessful. **Patient recruitment was the most common reason.** | Mishra et al., *World Neurosurgery: X* 2024 |
| **~1 in 5** | trials across medicine close early or under-enrolled because they cannot accrue enough patients | Carlisle et al., *Clinical Trials* 2015 (check the exact wording) |
| **n = 1** | Two real DBS trials (awake vs asleep surgery in Parkinson's disease (PD); DBS for tardive dyskinesia) stopped with **one** participant each, "lack of enrolment" | ClinicalTrials.gov NCT02401308, NCT02524886 (check both) |

* Bottom line: "Neuromodulation trials are small (often 20–40 people), so every eligible patient who is missed matters."
* Optional small chart: eligibility criteria per trial have grown over time; in lung-cancer drug trials, the median count rose from **17 to 28** between 1986–95 and 2006–16. More criteria were also linked to accrual failure (*Cancer Medicine*: odds ratio 1.09 per decile of criteria length).

**Speaker notes**
* "A trial that cannot recruit cannot answer its question, however good the science."
* The DBS figure is the most relevant: same device class, same registry. A revised analysis (242 interventional trials) gives the same picture: about 78% successful, with recruitment the top reason for failure.
* The n = 1 examples show it is not the science that failed. The trial never found its patients.
* Protocols are getting longer: more criteria means more to check per patient, and that is linked to failing to recruit.

---

## Slide 2.2: Before one patient can be approached, someone must check 15–30 facts in their record

**This slide answers "what do clinicians actually check?"**

**On the slide:** a checklist table for a typical Parkinson's disease (PD) **motor** neuromodulation trial. Bold the cells that are not simple database fields; that is most of them, and that is the point.

| What is checked | Example criterion (from the trials in our prototype) | Where it is written down |
|---|---|---|
| **Diagnosis** | Idiopathic Parkinson's disease, not atypical parkinsonism | **Neurology clinic letters (free text)** |
| **Age** | 18–60 years (early-stimulation trial); 40–80 years (gait trial) | Registration system (a field) |
| **Disease duration** | Diagnosed ≥ 4 years ago | **Clinic letters** |
| **Levodopa response** | ≥ 50% improvement in the Movement Disorder Society–Unified Parkinson's Disease Rating Scale (MDS-UPDRS) part III motor score on levodopa | **Levodopa challenge report** (often done only during surgical work-up) |
| **Motor fluctuations** | ≥ 2 hours a day in the medication-OFF state | **Paper motor diary** (rarely scanned into the record) |
| **Motor complications** | Fluctuations or dyskinesia for ≤ 3 years | **Clinic letters ("wearing-off since 2024")** |
| **Disease stage** | Hoehn and Yahr (H&Y) stage ≤ 2.5 in best ON, or 2.5–4 for the gait trial | **Clinic letters** |
| **Freezing of gait** | ≥ 1 freezing episode a day (New Freezing of Gait Questionnaire, NFOG-Q, items 1–2) | **Clinic letters ("freezes at doorways")** |
| **Cognition** | Montreal Cognitive Assessment (MoCA) above a cut-off, **and recent** | **Neuropsychology report, often a scanned PDF** |
| **Mood** | No moderate–severe depression or suicidality | **Psychiatry letters** |
| **Medication stability** | No dose change in the last 30 days | Prescribing record (dates must be compared) |
| **Device** | Has deep brain stimulation (DBS) or not; target; time since implant; implantable pulse generator (IPG) model with sensing | **Operative note; DBS programming report in the manufacturer's tablet or portal** |
| **Practical** | Language, ability to attend visits, willingness to consent | **Only by talking to the patient** |

* Corner callout: **1.6%**: the share of people with PD who meet the classic strict surgical-selection criteria (CAPSIT-PD, the Core Assessment Program for Surgical Interventional Therapies in PD); 4.5% with flexible criteria (Artusi et al., *Journal of Clinical Medicine* 2020). The eligible pool is tiny, so many must be screened to find a few.

**Speaker notes**
* "This is what screening means in practice. For each patient, a research coordinator has to confirm every row, and most rows have a threshold, and many a date."
* Walk through two rows. Levodopa response: you need the actual challenge-test report, and it usually exists only for patients already worked up for surgery. Motor fluctuations: the protocol asks for OFF hours from a diary that lives on paper in the patient's bag.
* Neuromodulation adds device rows (which electrode contact is active, can the battery sense brain signals) that sit in the manufacturer's system, not the hospital record.

---

## Slide 2.3: The hospital has the data, but not as answers anyone can search

**This is the key slide. It answers "don't hospitals already have all the data?"** Yes. But having the data is not the same as having the answers. It is like a library with every book and no index.

**On the slide:** left half, six reasons (icon + bold phrase + one line). Right half, the prototype's "Source documents" view for one patient (`screening-sources.png`): **125 documents → the 5 that matter, spread across 5 systems, 1 required fact not recorded anywhere.**

1. **Written, not coded.** Only part of a trial's criteria can be computed from structured database fields: a median of **55%** per protocol (range 38–89%) across 23 trials in 24 European hospitals (the EHR4CR/InSite feasibility study; EHR = electronic health record). An expert rating put primary-care criteria at **74%**, an optimistic upper bound (Ateya et al., *BMC Medical Informatics and Decision Making* 2016). The rest are sentences: "MoCA 24/30", "freezes at doorways about three times a day", "no haemorrhage on post-op CT".
2. **Scattered across systems.** Clinic notes in the electronic medical record (EMR); neuropsychology reports as scanned PDFs; DBS settings in the manufacturer's programmer; paper motor diaries; letters from other hospitals. In Singapore, the Next Generation Electronic Medical Record (NGEMR) went live across NUHS (National University Health System) and NHG (National Healthcare Group) in July 2024; SingHealth follows by 2026–28. Patients seen across clusters may still have records in two systems.
3. **Goes out of date.** "MoCA above 25" means a *recent* MoCA. Someone has to find the latest score and check its date; a two-year-old score may no longer be true.
4. **Needs interpretation.** Negation ("no permanent deficit"), uncertainty ("probable PD"), notes that contradict each other, and idiopathic vs atypical parkinsonism all need reading, not keyword search.
5. **Hospital search tools count codes, not criteria.** A diagnosis-code search returns "everyone coded with PD". It cannot say whose MoCA was 26 this year, who has had wearing-off for under 3 years, or whose stimulator can sense brain signals. Feasibility tools such as TriNetX give cohort counts, not patient-level answers with evidence.
6. **So it is slow, and it is repeated for every trial.** Manual pre-screening takes **45–60 minutes per patient** (Callies et al. 2025). In our synthetic clinic: 420 patients × about 193 documents ≈ **81,000 documents**, roughly **370 coordinator-hours to pre-screen everyone once for one trial**, to find 17–54 eligible patients depending on the trial.

**Speaker notes**
* Ask the question the audience is thinking: "Doesn't the hospital already have all this?"
* "Yes, the information exists. But it is written in sentences, spread over five or more systems, and some of it goes stale. The record can find patients with a PD code; it cannot tell you whose OFF time is over two hours."
* Point at the screenshot: one patient, 125 documents, 5 that matter, in 5 different places, and one fact that is missing entirely. A coordinator does this by hand for every patient, for every trial.
* Pre-empt "why not add more structured fields?" That helps in the long run, but it takes years of workflow change and still won't cover outside letters, scanned reports or device data.
* This is exactly what language models are good at: reading sentences and pointing to where the answer is. The decision stays with people.

---

## Slide 2.4: In oncology and cardiology, AI pre-screening already finds more eligible patients, faster

User request: "similar things have been done in oncology; how have they improved success rate?" Be precise: the evidence shows **faster screening and more patients identified and enrolled**. No study yet shows higher trial *completion* rates. Say that honestly; it is a strength.

**On the slide:** an evidence table (keep the "Limitation" column; scientists will look for it).

| Study | Field · design | What improved | Limitation |
|---|---|---|---|
| Unlu et al., *JAMA* 2025 (the RECTIFIER tool) | Cardiology (heart failure) · **randomised controlled trial (RCT)**, n = 4,476 | Eligible patients identified: **458 vs 284**; enrolled: **35 vs 19** (AI vs manual) | Single centre, single trial |
| Mayo Clinic with IBM Watson, 2018 | Oncology (breast cancer) · before/after, institutional report | **+80% enrolment** in systemic-therapy trials over 11 months | Not peer-reviewed; vendor-linked; early drop in use until the workflow was redesigned |
| Jin et al., *Nature Communications* 2024 (TrialGPT) | Mixed · retrospective, synthetic patients; small user study | **87.3%** criterion-level accuracy (experts 88.7–90.0%); **42.6%** less screening time | Synthetic patients; 2 clinicians in user study |
| Callies et al., arXiv 2025 (Inato) | Oncology and other · real-world, 485 patients, 36 trials | **< 9 min vs 45–60 min** per patient; 87% accuracy | Preprint; company-authored |
| Parikh et al., *Nature Communications* 2026 | Oncology · randomised, human vs human + AI | Accuracy **76% vs 71%**; but staff did **worse when the AI was badly wrong** (automation bias) | Retrospective records; single centre |

* Callout: **"The gap: none of this evidence is from neuromodulation or device trials, where key facts sit in device reports and recent scale scores, and none covers the whole path from screening to consent."**
* Aim statement (a single line at the bottom): **"We built and are validating a platform that finds every eligible patient for a neuromodulation trial while cutting the charts a human must read by more than 75%."**

**Speaker notes**
* The randomised heart-failure trial is the strongest evidence: randomised at patient level, and it measured enrolment, not just accuracy. AI roughly doubled enrolment (35 vs 19).
* The Mayo +80% is striking, but it is an institutional report. Present it as encouraging, not proof. Its lesson is useful too: use dropped until the workflow was redesigned. Workflow matters as much as the model.
* Parikh et al. is the cautionary result: people followed the AI when it was wrong. That shaped our design: unknowns are shown openly, every verdict carries a quote, and nothing is auto-approved.
* Accuracy numbers are not comparable across studies (different tasks and denominators), so don't rank them against each other.

---

# PART 3: PLATFORM OVERVIEW

## Slide 3: One platform, five modules, from protocol to enrolled participant

**On the slide:** a left-to-right flow chart (draw it in PowerPoint with rounded boxes and arrows; module colours all the same blue, with the human checkpoints in a different shape, e.g. a small person icon).

```
 Trial protocol ──▶ [M1 Protocol digitiser] ──▶ verified criteria checklist
                                                     │
 Patient records ──▶ [M2 Pre-screening engine] ◀─────┘
 (notes, scans,        reads records, checks each criterion, ranks patients
  device reports)      across ALL open trials
                              │
                     👤 Research officer reviews evidence
                     👤 Principal investigator approves contact
                              │
                     [M3 eConsent & onboarding] ──▶ consent, comprehension check, study ID
                              │                       (identity locked in a separate vault)
                              ▼
                     [M4 Recruitment dashboard] ◀──▶ [M5 Study assistant]
                       funnel, screen failures,        answers staff questions from
                       overdue actions                 the protocol and the database

 Running underneath everything: audit trail · role-based access · validation (shadow mode)
```

Under the chart, five one-line module summaries:

| Module | What it does | Is AI involved? |
|---|---|---|
| **M1 Protocol digitiser** | Turns the protocol's eligibility text into a checklist of machine-checkable rules, each linked to its original sentence | Yes: a large language model (LLM) drafts; a person verifies |
| **M2 Pre-screening engine** | Finds the evidence for each rule in each patient's records, gives met / not met / unknown, ranks patients by probability of eligibility, across every open trial | Yes: an LLM extracts evidence; fixed rules decide; maths ranks |
| **M3 eConsent & onboarding** | Electronic consent with a comprehension check and form-version control; issues study IDs; keeps identities in a separate vault | No: deterministic software |
| **M4 Recruitment dashboard** | Live funnel, which criteria exclude the most patients, enrolment against plan, overdue actions | No: database queries |
| **M5 Study assistant** | Answers staff questions ("who is overdue for consent?") using only the protocol and the database, citing sources | Yes in the full version: the LLM chooses the query; the numbers come from the database |

**Speaker notes**
* The two human checkpoints (marked with a person icon) are the design principle: **the AI reads, rules decide, people approve.**
* AI is used only where language is the problem: reading protocols and notes. Everything that decides eligibility is transparent code.
* The engine screens every patient against every open trial at once. A patient who doesn't fit the adaptive-DBS trial may fit the gait trial. Our prototype runs four Parkinson's trials: three motor (motor fluctuations, early motor complications, freezing of gait) and one non-motor (apathy).
* Screenshot to show: `trials.png` (the trial portfolio page).

---

# PART 4: MODULE BY MODULE

For each module: **what it does → how it works (the mechanism) → what it looks like → how it addresses the problem.** M2 is the scientific core, so it gets three slides.

## Slide 4.1 · Module 1, protocol digitiser: eligibility text becomes rules a computer can check, each traceable to its sentence

**What it does.** Reads a trial protocol and produces a structured checklist of inclusion and exclusion criteria that can be applied automatically and edited by staff.

**How it works (left half of the slide, a three-step diagram):**
1. **Extract.** A large language model (LLM) reads the eligibility section and fills a fixed template for each criterion: *what is measured* (e.g. levodopa response), *comparison* (≥), *threshold* (50%), *unit* (%), *how recent it must be*, and the *original sentence*. The template is enforced as JSON (JavaScript Object Notation), so the model cannot return free-form text. *Prototype: a transparent offline text parser stands in for the LLM, so no data leaves the browser.*
2. **Map.** Each criterion is linked to (a) a *data field* the engine knows how to read, (b) an *evidence source* (health record, device report, or "requires contact"), and (c) a small, tested *rule function*.
3. **Verify.** A research officer reviews and edits every criterion before screening starts. Thresholds are editable. Changing one (e.g. MoCA cut-off 20 → 24) re-ranks the whole queue instantly.

**A rule, shown as code (small box on the slide):**
```
levodopaResponseAtLeast(record, {min: 50}):
    if no levodopa challenge report found  → UNKNOWN  ("No levodopa challenge test on file")
    if improvement ≥ 50%                   → MET      + quote + document + date
    otherwise                              → NOT MET  + quote + document + date
```
* Add a **freshness window** to scale scores: a Montreal Cognitive Assessment (MoCA) older than 365 days counts as *unknown*, not as met. Label these as "site rules", added by the study team, not part of the protocol.

**Screenshot:** `protocol.png`, with callouts: (1) protocol wording kept verbatim, (2) editable threshold, (3) evidence-source badge (health record / device report / requires contact).

**How it addresses the problem:** Reasons 1 and 5 from slide 2.3 (written, not coded; hospital search counts codes). The protocol becomes a precise, checkable query, and every check stays traceable to the protocol sentence for the ethics board (institutional review board, IRB) and the sponsor.

**Speaker notes**
* "Why not let the AI decide eligibility directly? Because a rule can be read, tested and audited. 'MoCA ≤ 20 excludes' is one line of code with a unit test. A model's judgement is not."
* "Unknown" is built in from the start: if the evidence is not found, the rule cannot fire.
* Mention the four protocols loaded in the prototype: one real, openly licensed protocol (Zoon et al., *Trials* 2024, apathy), one modelled on the EARLYSTIM trial (Schuepbach et al., *New England Journal of Medicine* 2013), and two illustrative motor protocols modelled on registered trials (adaptive DBS; spinal cord stimulation for freezing of gait).

---

## Slide 4.2 · Module 2, pre-screening engine (part 1): every verdict comes with a quoted sentence, and "unknown" is a real answer

**What it does.** For every patient and every criterion, finds the evidence in the records and returns one of three verdicts: **met**, **not met** or **unknown**, with the sentence, document and date it came from.

**How it works (diagram across the slide):**
```
Patient records ─▶ [LLM evidence extraction] ─▶ value + date + verbatim quote ─▶ [quote check] ─▶ [rule from M1] ─▶ verdict
   notes, scans,      "find the latest MoCA"       "MoCA 29/30", 2025-06-04          quote must exist     MoCA > 20?        MET / NOT MET /
   device reports                                                                   in the source text   and < 365 days?    UNKNOWN
```
1. **Evidence extraction (AI).** For each criterion, the large language model (LLM) is asked a narrow question ("What is the most recent Montreal Cognitive Assessment (MoCA) score, its date, and the exact sentence?") over that patient's documents, including scanned PDFs after text recognition.
2. **Quote check (anti-hallucination guard).** The returned quote must be found word-for-word in the source document. If it isn't, the verdict is forced to *unknown*. This one string comparison blocks invented evidence.
3. **Rule evaluation (deterministic).** The rule from Module 1 turns the value into met or not met, or *unknown* if the value is missing or older than the freshness window.

* Three-verdict legend with an example each (from the screenshot):
  * ✓ **Met**: "Bilateral STN DBS implanted 2023-05-20" → deep brain stimulation (DBS) for ≥ 3 months.
  * ✕ **Not met**: e.g. "Levodopa/carbidopa dose last changed 12 days ago" → medication not stable for 30 days (pick a real example from your own screenshot).
  * ? **Unknown**: "Last MoCA (29) is 530 days old, outside the 365-day window" → re-test needed.

**Screenshot:** `screening.png`, the right-hand patient panel. Callouts on a quote box and on an *unknown* verdict.

**How it addresses the problem:** Reasons 1–4 from slide 2.3. The tool reads the sentences (written, not coded), across systems (scattered), checks dates (out of date) and handles negation (needs interpretation). The coordinator now **checks evidence** instead of **searching for it**.

**Speaker notes**
* The most important design choice: **unknown is not the same as not met.** If a tool says "not met" when it means "I couldn't find it", eligible patients silently disappear. In neuromodulation, many facts (OFF-time diaries, device settings) are often simply not in the record.
* The quote check is simple and strong. A clinician can verify any verdict in seconds by reading the quote.
* In the prototype, the extraction step is simulated with pre-structured synthetic records; the rules, verdicts and ranking are the real code.

---

## Slide 4.3 · Module 2, pre-screening engine (part 2): patients are ranked by their probability of being eligible, across every open trial

**What it does.** Turns each patient's verdicts into one interpretable number, the **match score**, and ranks the review queue by it. It does this for every trial at once.

**How it works:**
* The formula, large and centred:

  **Match score = P(eligible) = product over all criteria of { 1 if met · 0 if not met · π (the prior) if unknown }**

* **π (the prior)** is the probability that an *unknown* criterion would turn out *met*. It is estimated from the documented records of patients who fail no other criterion (a conditional estimate), with Laplace smoothing: π = (met + 1) / (known + 2). Consent cannot be known from records, so it uses a fixed prior (0.70, from historical consent rates).
* Bands: High ≥ 0.6 · Medium 0.3–0.6 · Low < 0.3 · Ineligible = 0 (any criterion not met).
* Worked example from the screenshot (adaptive DBS trial, patient PT-2676): four criteria met, none failed, three unknown: medication stability (no prescribing history, π 0.70), cognition (last MoCA is 530 days old, π 0.86) and consent (π 0.70) → **0.70 × 0.86 × 0.70 = 0.42 → Medium**. Next on the list, PT-1244: OFF-time diary missing (π 0.56) × consent (0.70) = **0.39**.
* **Cross-trial matching:** the same engine runs for all four trials, so each patient panel lists "Other trials for this patient". In the synthetic clinic, **89 patients are candidates (match score ≥ 0.30) for at least one trial, and 16 for two or more** (`screening-other-trials.png`, `trials.png`).

**Why this design (a small side box):**
* Interpretable: the panel shows the multiplication for every patient.
* Honest about missing data: unknowns lower the score but never remove the patient.
* A methods lesson we found while building it: priors must be *conditional*. Estimated across the whole clinic, "has a sensing pulse generator" got π = 0.14, because most patients have no DBS at all. That pushed eligible patients down the list. Estimated among patients still in the running, it is 0.43, and recall at our threshold went from 65% to 100% for that trial.
* Known simplification: criteria are treated as independent (e.g. cognition and disease stage are correlated). With small trial cohorts, an interpretable model comes first; a learned model can be compared later.

**Speaker notes**
* "The score orders the queue. It never decides. The principal investigator approves every contact."
* The conditional-prior finding is worth telling as a story: it is exactly the kind of subtle error that a validation step catches, and why we built validation into the platform.

---

## Slide 4.4 · Module 2, pre-screening engine (part 3): in simulation, the engine finds 96–100% of eligible patients while staff read 7–21% of charts

**Mark the slide "Simulation · synthetic cohort".**

**How we tested it (left, three lines):**
* A synthetic clinic of **420 people with Parkinson's disease (PD)**, about 40% with deep brain stimulation (DBS). Each has a complete "truth" and a "documented" view in which facts are realistically missing or out of date. Distributions are in `docs/DATA.md`.
* **Ground truth** = eligibility from the complete record. **The tool** sees only the documented record.
* We fix the score cut-off at **0.10** in advance and measure **recall** (share of truly eligible patients the tool flags), **precision** (share of flagged patients who are truly eligible) and **workload** (share of charts a human still has to read).

**Results table (right):**

| Trial (symptom) | Truly eligible | Recall (95% CI) | Precision (95% CI) | Charts to read | PR-AUC |
|---|---|---|---|---|---|
| Adaptive DBS (motor fluctuations) | 17 of 420 | **100%** (82–100) | 34% (22–48) | **12%** | 0.60 |
| Early STN-DBS (early motor complications) | 19 of 420 | **100%** (83–100) | 61% (44–76) | **7%** | 0.89 |
| Spinal cord stimulation (freezing of gait) | 54 of 420 | **96%** (87–99) | 58% (48–68) | **21%** | 0.86 |
| Dorsal STN-DBS (apathy) | 22 of 420 | **100%** (85–100) | 55% (40–69) | **10%** | 0.85 |

CI = confidence interval (Wilson method). PR-AUC = area under the precision–recall curve; a random ranking would score roughly the prevalence (0.04–0.13).

* Below the table: "What is most often **unknown** from records: OFF-time diary 70% · levodopa challenge 48% · freezing-of-gait frequency 37% · Hoehn and Yahr stage 26% · recent MoCA 24%." **These gaps are motor and neuromodulation-specific, which supports our problem statement.**
* Time model (clearly labelled "assumption-driven"): adaptive-DBS trial, manual **≈ 370 coordinator-hours** (420 charts × 52.5 min) vs AI-assisted **≈ 7.5 hours** (50 flagged charts × 9 min).
* Screenshot: `validation.png` (threshold chart).

**Speaker notes**
* "This tests the method, not real-world performance."
* Trade-off: raising the cut-off to 0.30 makes the list shorter and more precise but misses patients (e.g. early-DBS recall falls to 89%). For recruitment we prefer high recall: a false alarm costs minutes; a missed patient costs a participant.
* Honest limitation: in the simulation, documented facts can be missing or old but never *wrong*. Real extraction will make some errors and recall will be lower. Measuring that is the first step of the validation plan (conclusion slide).

---

## Slide 4.5 · Module 3, eConsent and onboarding: consent is checked for understanding, and identities never leave the vault

**What it does.** Once the principal investigator (PI) approves contact: sends electronic consent (eConsent), checks the participant understood it, tracks form versions, issues a study ID, and separates identity from research data.

**How it works:**
* **Comprehension check:** five true/false statements before signing (e.g. "Your stimulator settings will change for one month at a time"). A score below 4/5 triggers a call-back before signature.
* **Version control:** every signature is tied to the consent-form version. If the ethics board (institutional review board, IRB) approves a new version, participants on the old one are flagged for re-consent (the prototype flags v2.0 vs v2.1).
* **Pseudonymisation:** the study database holds only study IDs (e.g. PT-2676). The link to the hospital record number lives in a **separate identity vault** with a separate key. Only the "data custodian" role can open it, and every look-up is logged with a reason.
* **Overdue tracking:** invitations unsigned after 7 days are flagged.

**Screenshot:** `participants.png`. Callouts: re-consent flag, "Waiting 12 d" overdue badge, locked identity column.

**How it addresses the problem:** It removes the spreadsheets and emailed forms that follow screening, catches misunderstanding before signature, and keeps the research dataset clean for research use under Singapore's Human Biomedical Research Act (HBRA) and Personal Data Protection Act (PDPA).

**Speaker notes**
* No AI here, deliberately: consent must be deterministic and auditable.
* Mention the measured outcomes the dashboard can report: median days from invitation to signature, and mean comprehension score.

---

## Slide 4.6 · Module 4, recruitment dashboard: it shows where patients are lost, criterion by criterion

**What it does.** A live view per trial: the funnel (identified → not ruled out → approved for contact → consented → enrolled), **screen failures by criterion**, **unknowns by criterion**, enrolment against plan, and a "needs attention" list.

**How it works:** plain database queries over the screening results and the consent tracker. Everything is recomputed when a criterion or a decision changes. No AI is involved.

**Screenshot:** `overview.png`. Callouts: (1) funnel, (2) screen failures by criterion, (3) enrolment vs plan.

**How it addresses the problem:** Recruitment problems become visible and specific. "We're behind" becomes "the levodopa-challenge criterion is unknown for half the clinic: book challenge tests". The **screen-failure chart is also research data**: it shows which eligibility rules shrink the pool most, which can inform protocol design (an extension of the "criteria growth" point on slide 2.1).

**Speaker notes**
* Example to say aloud: in the adaptive-DBS trial, the OFF-time diary is unknown for most patients. The fix is operational (send diaries ahead of clinic visits), not more screening.

---

## Slide 4.7 · Module 5, study assistant: answers come from database queries, not from the model's memory

**What it does.** Lets staff ask questions in plain language: "Which patients are one criterion short?", "Who is overdue for consent?", "What is the cognitive cut-off in this protocol?". Answers are cited, scoped to the user's role and logged.

**How it works:**
* **Prototype:** intent matching. The question is matched to one of a set of query functions, which run on the database and return numbers plus their sources.
* **Full version:** a large language model (LLM) chooses which query function ("tool") to call and phrases the answer, but **every number comes from a query result, never from the model's memory**. This is the "tool-use" pattern.
* **Guardrails:** grounded (sources listed under every answer) · scoped (asking for a patient's name is refused unless the role allows it) · advisory ("it suggests; a clinician decides") · logged (every question goes into the audit trail).

**Screenshot:** `assistant.png`, showing one answer with source chips, and the refused identity question.

**How it addresses the problem:** Coordinators and PIs get answers in seconds without building spreadsheets, and without the risk of a chatbot inventing numbers.

**Speaker notes**
* Staff-facing only. A patient-facing pre-screening chatbot is future work, because ambiguous answers are the hard part.

---

## Slide 4.8 · Across all modules: trust by design

Short slide, presented as a failure-mode table. Scientists trust teams that name their failure modes.

| What could go wrong | How the design prevents it | How we will measure it |
|---|---|---|
| AI invents evidence | Quote must match the source word for word, otherwise "unknown" | % of quotes verbatim in source |
| Missing or old data read as "not met" | Three verdicts; freshness windows | Unknown rate; recall |
| Staff over-trust the AI (automation bias) | No auto-approval; unknowns shown; PI approval required | Override rate on deliberately seeded errors |
| Some groups excluded unfairly | Language criterion localised; subgroup analysis | Recall by language, sex and age |
| Privacy breach | Study IDs only; separate identity vault; role-scoped assistant; model run inside the hospital network | Audit-trail review |

* Footer: "Designed with HBRA (Human Biomedical Research Act) and PDPA (Personal Data Protection Act) in mind. Ethics board (IRB), data protection officer and Ministry of Health review to be confirmed with the partner hospital. No regulatory claim yet."

**Screenshot (small):** `audit.png`.

---

# PART 5: CONCLUSION

## Slide 5.1: Conclusion: what we showed, how we will test it, what we need

**On the slide**, three blocks:

**What we showed**
1. Recruitment is a leading cause of neuromodulation trial failure. The bottleneck is reading records: the facts exist, but as sentences across 5+ systems.
2. Our platform reads the evidence, applies transparent rules, gives *met / not met / unknown* with a quote, and ranks patients across all open trials. People make every decision.
3. In simulation across three motor trials and one apathy trial, it found **96–100%** of eligible patients while staff read only **7–21%** of charts.

**How we will test it for real (a three-step timeline)**
| Stage 1: shadow mode (retrospective) | Stage 2: pilot (prospective) | Stage 3: scale |
|---|---|---|
| Replay one closed Parkinson's neuromodulation trial. Reference standard: two blinded reviewers plus adjudication. **~380 charts** gives a ±7% interval on recall around 95%. | Randomise patients to AI-assisted vs manual pre-screening (as in the heart-failure RCT, randomised controlled trial). Outcomes: minutes per patient, time to consent, enrolled per month. | More trials (deep brain, spinal cord, vagus nerve stimulation), more sites. |

**What we need**
* One closed neuromodulation trial's protocol and screening log (for Stage 1)
* A principal investigator and research-coordinator partner
* [Funding amount] for 12 months · ethics (IRB) sponsorship

* QR codes: live prototype (GitHub Pages link) and code repository.

**Speaker notes**
* Restate the problem in one sentence, then the answer: "promising in simulation; here is exactly how we'll find out for real."
* Limitations to say out loud (don't hide them): the simulation does not include AI reading errors; the score assumes criteria are independent; priors must be re-estimated per site; device data may need manufacturer cooperation.
* Close: "If you run a neuromodulation trial, we'd like your closed trial for Stage 1." Then thank you and questions.

---

## Backup slides (after "Thank you")

1. **Glossary**: the table at the top of this guide.
2. **Worked sample-size calculation**: n = z² · p(1 − p) / d² = 1.96² × 0.95 × 0.05 / 0.07² ≈ 38 truly eligible patients; at ~10% prevalence ≈ 380 charts. The Wilson interval formula.
3. **Synthetic data generation**: the table from `docs/DATA.md`.
4. **Architecture and deployment**: from `docs/ARCHITECTURE.md` (model runs inside the hospital network; every model call logged with version and prompt).
5. **The four protocols and their sources**: adaptive DBS (modelled on the design of ADAPT-PD, NCT04547712; criteria illustrative); early STN-DBS (modelled on EARLYSTIM, NCT00354133); spinal cord stimulation for freezing of gait (drawing on NCT06798844 and NCT05148468; illustrative); dorsal STN-DBS for apathy (Zoon et al. 2024, real protocol, CC BY 4.0 licence).
6. **Competitive landscape**: Tempus/Deep 6 AI, Oncoshot, Antidote, TriNetX (from your earlier draft).

---

## References to verify before presenting

Some figures came from abstracts or press summaries. Check each against the primary source.

* Mishra et al. Why are clinical trials of deep brain stimulation terminated? An analysis of ClinicalTrials.gov. *World Neurosurgery: X* 2024 (and the revised version).
* Carlisle B et al. Unsuccessful trial accrual and human subjects protections. *Clinical Trials* 2015.
* Thoracic oncology clinical trial eligibility criteria and requirements continue to increase in number and complexity. *Journal of Thoracic Oncology* 2017.
* Eligibility-criteria growth and accrual failure in NCI-affiliated trials. *Cancer Medicine* (odds ratio 1.09 per decile).
* Artusi CA et al. Deep brain stimulation selection criteria for Parkinson's disease: time to go beyond CAPSIT-PD. *Journal of Clinical Medicine* 2020;9:3931.
* Ateya MB et al. *BMC Medical Informatics and Decision Making* 2016;16:1 (structured EHR data for trial criteria).
* EHR4CR/InSite feasibility study, 23 protocols, 24 hospitals, median 55% computable (find the exact 2019 citation).
* Ministry of Health Singapore / Synapxe: NGEMR rollout status.
* Unlu O et al. Manual vs AI-assisted prescreening for trial eligibility using large language models: a randomized clinical trial. *JAMA* 2025. doi:10.1001/jama.2024.28047
* Mayo Clinic and IBM Watson clinical-trial matching, 2018 coverage (e.g. Healthcare IT News; HealthExec).
* Jin Q et al. Matching patients to clinical trials with large language models. *Nature Communications* 2024. doi:10.1038/s41467-024-53081-z
* Callies A et al. arXiv:2503.15374 (2025), a preprint.
* Parikh RB et al. Human–AI teaming for eligibility prescreening in oncology trials. *Nature Communications* 2026. doi:10.1038/s41467-026-68873-8
* Schuepbach WMM et al. Neurostimulation for Parkinson's disease with early motor complications. *New England Journal of Medicine* 2013;368:610–622 (EARLYSTIM). Check the Hoehn and Yahr threshold; sources disagree (≤ 2.5 vs < 3).
* ADAPT-PD (NCT04547712), *JAMA Neurology* publication on adaptive DBS.
* Spinal cord stimulation for freezing of gait: NCT06798844 (KU Leuven), NCT05148468.
* Zoon TJC et al. *Trials* 2024;25:104. doi:10.1186/s13063-024-07938-9 (CC BY 4.0).
