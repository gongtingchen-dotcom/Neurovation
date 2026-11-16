import { evaluators } from './evaluators';
import type { Criterion, CriterionResult, Patient, PatientFacts, Protocol, ScreeningResult } from './types';

const paramsOf = (c: Criterion) => Object.fromEntries(c.params.map((p) => [p.key, p.value]));

export function evaluateCriterion(c: Criterion, facts: PatientFacts): CriterionResult {
  const fn = evaluators[c.evaluator];
  if (!fn) return { criterionId: c.id, verdict: 'unknown', reason: `No evaluator mapped (${c.evaluator}).` };
  return { criterionId: c.id, ...fn(facts, paramsOf(c)) };
}

/**
 * Priors for "unknown" criteria are estimated empirically from the cohort: the share of patients
 * whose documented records satisfy the criterion. Criteria that can never be assessed from records
 * (e.g. consent) use a fixed prior set by the study team.
 */
export function estimatePriors(protocol: Protocol, patients: Patient[]): Record<string, number> {
  const priors: Record<string, number> = {};
  for (const c of protocol.criteria) {
    if (c.fixedPrior !== undefined) { priors[c.id] = c.fixedPrior; continue; }
    let met = 0, known = 0;
    for (const p of patients) {
      const v = evaluateCriterion(c, p.documented).verdict;
      if (v !== 'unknown') { known++; if (v === 'met') met++; }
    }
    // Laplace smoothing keeps priors away from 0 and 1 for rare criteria.
    priors[c.id] = (met + 1) / (known + 2);
  }
  return priors;
}

export function bandOf(score: number): ScreeningResult['band'] {
  if (score === 0) return 'Ineligible';
  if (score >= 0.6) return 'High';
  if (score >= 0.3) return 'Medium';
  return 'Low';
}

export function screenPatient(
  protocol: Protocol,
  patient: Patient,
  priors: Record<string, number>,
  facts: PatientFacts = patient.documented,
): ScreeningResult {
  const active = protocol.criteria.filter((c) => c.enabled);
  const results = active.map((c) => evaluateCriterion(c, facts));
  let score = 1;
  let met = 0, notMet = 0, unknown = 0;
  results.forEach((r) => {
    if (r.verdict === 'met') met++;
    else if (r.verdict === 'not_met') { notMet++; score = 0; }
    else { unknown++; score *= priors[r.criterionId] ?? 0.5; }
  });
  return { patientId: patient.id, results, met, notMet, unknown, score, band: bandOf(score) };
}

export function screenCohort(protocol: Protocol, patients: Patient[]) {
  const priors = estimatePriors(protocol, patients);
  const results = patients.map((p) => screenPatient(protocol, p, priors));
  results.sort((a, b) => b.score - a.score || a.unknown - b.unknown);
  return { priors, results };
}

/**
 * Ground-truth eligibility for validation: evaluate against complete facts, ignoring criteria that
 * can only be settled by contacting the patient (consent).
 */
export function trulyEligible(protocol: Protocol, patient: Patient): boolean {
  return protocol.criteria
    .filter((c) => c.enabled && c.evaluator !== 'consentObtainable')
    .every((c) => evaluateCriterion(c, patient.truth).verdict === 'met');
}
