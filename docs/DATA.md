# Synthetic cohort

`src/data/cohort.ts` generates **420 people with parkinsonism** followed at two hypothetical movement-disorders clinics, with a fixed seed (`20261116`), so everyone sees the same cohort. About 40% already have deep brain stimulation (DBS). About a third of the rest have been referred for DBS work-up (younger, levodopa-responsive, with motor fluctuations).

Each patient has two views:

* **truth**: complete facts, as a full chart review plus interview would find. Used only for validation.
* **documented**: what the screening engine can see. Some facts are **missing**, some are **out of date** (an older score that has drifted from today's value).

## Distribution assumptions (plausible, not empirical)

| Fact | Truth | Missing from the documented record |
|---|---|---|
| Diagnosis | 92% idiopathic Parkinson's disease (PD); the rest atypical or vascular parkinsonism | 3% |
| Age | Normal(62–66, 9.5); work-up group Normal(55, 6) | 0% |
| Disease duration (years) | DBS Normal(12, 4); work-up Normal(7.5, 3); others Normal(5.5, 4) | 6% |
| Hoehn and Yahr stage (best ON) | 1.4 + 0.08 × duration + 0.02 × (age − 60) + noise, in 0.5 steps | 25% |
| Levodopa response (% improvement in MDS-UPDRS part III) | Normal(45, 15); work-up Normal(56, 12) | 20% with DBS, 35% work-up, 80% others (challenge tests are mostly done in surgical work-up) |
| Motor complications (fluctuations/dyskinesia) | P(present) rises with duration; years since onset | 20% |
| Daily OFF time (motor diary) | Normal(2.2–3, 1.4) h if fluctuating | **70%** (paper diaries rarely reach the record) |
| Freezing of gait (episodes/day) | P(present) rises with duration and stage | 40% |
| Medication stable (days since change) | 72% > 30 days | 8% |
| Moderate–severe depression | 12% | 30% |
| DBS: target, implant date, sensing pulse generator, active contact, surgical complications | STN 86% / GPi 14%; sensing 45%; most-dorsal contact 10%; complications 3% | 5–32% (programming reports often sit in the vendor portal) |
| Starkstein Apathy Scale | Normal(10–12.5, 6) | 22% missing + 18% stale (DBS); 60% + 15% (others) |
| Montreal Cognitive Assessment (MoCA) | Normal(25.6 − 0.08 × (age − 64), 2.9) | 14% missing + 10% stale |

Recruitment pipeline for each recruiting trial: of the truly eligible patients not already in another trial, about 55% have been actioned. Of those, 72% sign consent and 85% of signers enrol. No patient is enrolled in two trials.

Truly eligible per trial: adaptive DBS 17, early STN-DBS 19, spinal cord stimulation for freezing of gait 54, dorsal STN-DBS for apathy 22.

## Known limitation of the simulation

Documented values can be missing or stale, but they are never *wrong*. The simulation therefore isolates the effect of **missing data**, and shows recall close to 100% at a low threshold. Real LLM extraction will add misreads; Stage 1 of the validation plan measures this directly against dual chart review. A useful next step for the team: add an `extractionErrorRate` parameter that perturbs documented values, and show how recall degrades as a sensitivity analysis.
