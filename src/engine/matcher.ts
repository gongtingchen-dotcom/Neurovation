import { evaluators } from './evaluators';
import type { Criterion, CriterionResult, Patient, PatientFacts, Protocol, ScreeningResult } from './types';

const paramsOf = (c: Criterion) => Object.fromEntries(c.params.map((p) => [p.key, p.value]));

export function evaluateCriterion(c: Criterion, facts: PatientFacts): CriterionResult {
  const fn = evaluators[c.evaluator];
  if (!fn) return { criterionId: c.id, verdict: 'unknown', reason: `No evaluator mapped (${c.evaluator}).` };
  return { criterionId: c.id, ...fn(facts, paramsOf(c)) };
}

/**
 * Priors for "unknown" criteria are estimated empirically from the cohort's documented records.
 *
 * They are CONDITIONAL: for criterion c we only count patients who fail no OTHER criterion. That
 * approximates P(c met | patient still in the running), which is what matters when ranking. (A marginal
 * prior would, for example, say only 14% of patients have a sensing pulse generator, because most
 * patients have no DBS at all; among patients who already pass the DBS criteria it is much higher.)
 * Laplace smoothing keeps priors away from 0 and 1. Criteria that can never be assessed from records
 * (consent) use a fixed prior set by the study team.
 */
export function estimatePriors(protocol: Protocol, patients: Patient[]): Record<string, number> {
  const active = protocol.criteria.filter((c) => c.enabled);
  const verdicts = patients.map((p) => active.map((c) => evaluateCriterion(c, p.documented).verdict));
  const priors: Record<string, number> = {};
  active.forEach((c, j) => {
    if (c.fixedPrior !== undefined) { priors[c.id] = c.fixedPrior; return; }
    let met = 0, known = 0;
    verdicts.forEach((v) => {
      if (v.some((x, k) => k !== j && x === 'not_met')) return;
      if (v[j] !== 'unknown') { known++; if (v[j] === 'met') met++; }
    });
    priors[c.id] = (met + 1) / (known + 2);
  });
  protocol.criteria.filter((c) => !c.enabled).forEach((c) => (priors[c.id] = c.fixedPrior ?? 0.5));
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
