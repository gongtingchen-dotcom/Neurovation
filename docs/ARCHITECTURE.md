# Architecture: prototype → pilot

## Principle: the LLM reads, rules decide, people approve

```
Protocol PDF ──▶ [1] Criteria extraction (LLM → JSON schema) ──▶ human-verified checklist
                                                                    │
Patient records ──▶ [2] Evidence extraction (LLM span extraction) ──┤
  notes, neuropsych reports,      value + date + verbatim quote     │
  op notes, DBS programming                                         ▼
  reports                           [3] Deterministic rule evaluation → met / not met / unknown
                                                                    │
                                    [4] Ranking: P(eligible) = Π prior(unknown criteria)
                                                                    │
                                    [5] Research officer review → PI approval → contact
                                                                    │
                                    [6] eConsent, study ID, pseudonymised database, dashboard
```

| Step | Prototype | Pilot |
|---|---|---|
| 1. Criteria extraction | Offline regex heuristic (`engine/extract.ts`) | LLM with a fixed JSON schema (criterion, kind, field, operator, threshold, unit, recency window, source sentence). Two-pass self-consistency; a person reviews every draft |
| 2. Evidence extraction | Pre-structured synthetic facts with quotes | LLM span extraction per criterion. **The returned quote must string-match the source document, or the verdict is forced to "unknown"**, which blocks hallucinated evidence |
| 3. Rule evaluation | `engine/evaluators.ts` | Same code. Rules stay deterministic, versioned and unit-tested |
| 4. Ranking | Product of conditional empirical priors (estimated among patients who fail no other criterion; Laplace-smoothed) | Same, with priors re-estimated per site; calibration checked in shadow mode |
| 5. Review | Role switcher, decisions, audit | Hospital SSO, roles from the study delegation log |
| 6. Assistant | Intent matching over database queries | LLM with tool calls to the same query functions, so numbers always come from queries. Retrieval scoped by role |

## Why rules after extraction, not end-to-end LLM judgement?

* **Auditability.** An IRB or sponsor can read a rule. "MoCA ≤ 25 excludes" is checkable; a model's opinion is not.
* **Editability.** The research officer changes a threshold and the whole queue re-ranks instantly, with no re-prompting.
* **Separation of errors.** Validation can tell an extraction error (wrong value read) from a rule error (wrong logic), and the two need different fixes.
* **Unknown is honest.** If no quote is found, the rule cannot fire, so the system says "unknown" instead of guessing. Recent studies treat screenability as its own category for this reason.

## Deployment for the pilot

* Runs inside the hospital network. Records never leave it. Use either a locally hosted open-weight model or an approved enterprise LLM endpoint with a data-processing agreement.
* Identity vault in a separate database with a separate key; only the data custodian role can resolve IDs.
* Every LLM call is logged with model version, prompt hash, inputs (by reference), outputs and the human decision that followed.
* Reporting follows TRIPOD-LLM (model reporting) and DECIDE-AI (early-stage clinical evaluation of decision-support systems).
