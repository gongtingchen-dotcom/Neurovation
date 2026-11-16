# Synthetic cohort

`src/data/cohort.ts` generates 220 patients with DBS across two hypothetical sites, using a fixed seed (`20261116`). Everyone sees the same cohort.

Each patient has two views:

* **truth**: complete facts, equivalent to a full chart review plus interview. Used only for validation.
* **documented**: what the screening engine can see. Some fields are **missing**, some are **stale** (an older score that has drifted from today's value).

## Distribution assumptions (plausible, not empirical)

| Variable | Truth | Documented |
|---|---|---|
| Diagnosis | 92% idiopathic PD; rest atypical or vascular parkinsonism | missing 3% |
| DBS target | 86% STN, 14% GPi | — |
| Time since implant | Normal(900 d, 700 d), clipped 20–4200 d | date missing 5% |
| Starkstein Apathy Scale | Normal(12.5, 6), 0–42 → about 40% ≥ 14 | missing 22%; stale (> 180 d, drifted) 18% |
| MoCA | Normal(25.3, 2.9), 12–30 | missing 14%; stale (> 365 d) 10% |
| Permanent perioperative sequelae | 3% | missing 12% |
| Most dorsal contact active bilaterally | 10% | missing 32% (programming reports often sit outside the EHR) |
| Language | English, Mandarin, Malay, Tamil combinations; about 10% other only | missing 8% |
| Sensing-capable IPG | 45% | missing 25% |
| MDS-UPDRS III OFF | Normal(34, 10) | missing 30% |
| Daily OFF time (diary) | Normal(2.4 h, 1.5 h) | missing 70% |

Recruitment pipeline (for the active dSTN trial): of the truly eligible, about 55% have been actioned. Of those, 72% sign consent and 85% of signers enrol.

## Known limitation of the simulation

Documented values can be missing or stale, but they are never *wrong*. The simulation therefore isolates the effect of **missing data**, and shows recall close to 100% at a low threshold. Real LLM extraction will add misreads; Stage 1 of the validation plan measures this directly against dual chart review. A useful next step for the team: add an `extractionErrorRate` parameter that perturbs documented values, and show how recall degrades as a sensitivity analysis.
