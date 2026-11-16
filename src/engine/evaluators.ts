import type { CriterionResult, Observation, PatientFacts, Verdict } from './types';

/** Fixed reference date so the demo is reproducible. */
export const TODAY = '2026-11-16';

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

type Params = Record<string, number>;
type Evaluator = (facts: PatientFacts, p: Params) => Omit<CriterionResult, 'criterionId'>;

const ev = (o: Observation<unknown>) => ({ source: o.source, date: o.date, quote: o.quote });
const unknown = (reason: string): Omit<CriterionResult, 'criterionId'> => ({ verdict: 'unknown', reason });
const res = (verdict: Verdict, reason: string, o: Observation<unknown>) => ({ verdict, reason, evidence: ev(o) });

/**
 * Evaluators are deterministic and auditable. In a production system an LLM extracts the
 * Observation (value + quote) from free text; the eligibility rule itself stays a transparent rule.
 */
export const evaluators: Record<string, Evaluator> = {
  idiopathicPD: (f) => {
    const o = f.diagnosis;
    if (!o) return unknown('No diagnosis documented in the available records.');
    return o.value === 'Idiopathic PD'
      ? res('met', 'Diagnosis recorded as idiopathic Parkinson’s disease.', o)
      : res('not_met', `Diagnosis recorded as ${o.value.toLowerCase()}.`, o);
  },

  stnDbsDuration: (f, p) => {
    const t = f.dbsTarget;
    const d = f.dbsImplantDate;
    if (t && t.value !== 'STN') return res('not_met', `DBS target is ${t.value}, not STN.`, t);
    if (!d) return unknown('No DBS implant date found.');
    const months = daysBetween(d.value, TODAY) / 30.44;
    return months >= p.minMonths
      ? res('met', `${months.toFixed(1)} months since STN DBS implant (≥ ${p.minMonths}).`, d)
      : res('not_met', `Only ${months.toFixed(1)} months since implant (< ${p.minMonths}).`, d);
  },

  sasThreshold: (f, p) => {
    const o = f.sas;
    if (!o) return unknown('No Starkstein Apathy Scale score documented.');
    const age = daysBetween(o.date, TODAY);
    if (age > p.maxAgeDays)
      return { verdict: 'unknown', reason: `Last SAS (${o.value}) is ${age} days old, outside the ${p.maxAgeDays}-day window. Re-assess.`, evidence: ev(o) };
    return o.value >= p.min
      ? res('met', `SAS ${o.value}/42 (≥ ${p.min}).`, o)
      : res('not_met', `SAS ${o.value}/42 (< ${p.min}).`, o);
  },

  noPermanentPeriopComplication: (f) => {
    const o = f.periopPermanentComplication;
    if (!o) return unknown('Operative and discharge reports not available.');
    return o.value
      ? res('not_met', 'Permanent sequelae of a perioperative complication documented.', o)
      : res('met', 'No permanent perioperative sequelae documented.', o);
  },

  mocaAbove: (f, p) => {
    const o = f.moca;
    if (!o) return unknown('No MoCA documented.');
    const age = daysBetween(o.date, TODAY);
    if (age > p.maxAgeDays)
      return { verdict: 'unknown', reason: `Last MoCA (${o.value}) is ${age} days old, outside the ${p.maxAgeDays}-day window.`, evidence: ev(o) };
    return o.value > p.maxExcluded
      ? res('met', `MoCA ${o.value}/30 (> ${p.maxExcluded}).`, o)
      : res('not_met', `MoCA ${o.value}/30 (≤ ${p.maxExcluded}): cognitive decline per protocol.`, o);
  },

  languageAdequate: (f) => {
    const o = f.languages;
    if (!o) return unknown('Preferred language not recorded.');
    const ok = o.value.some((l) => ['English', 'Mandarin', 'Malay', 'Tamil'].includes(l));
    return ok
      ? res('met', `Speaks ${o.value.join(', ')}; translated study materials available.`, o)
      : res('not_met', `Speaks ${o.value.join(', ')}; no translated materials.`, o);
  },

  notMostDorsalBilateral: (f) => {
    const o = f.mostDorsalContactBilateral;
    if (!o) return unknown('No DBS programming report available.');
    return o.value
      ? res('not_met', 'Already stimulated on the most dorsal contact bilaterally.', o)
      : res('met', 'A more dorsal contact is available on at least one lead.', o);
  },

  consentObtainable: () => unknown('Can only be established at the consent visit.'),

  ageAtLeast: (f, p) => {
    const o = f.age;
    if (!o) return unknown('Date of birth missing.');
    return o.value >= p.min ? res('met', `Age ${o.value}.`, o) : res('not_met', `Age ${o.value} (< ${p.min}).`, o);
  },

  sensingIPG: (f) => {
    const o = f.sensingIPG;
    if (!o) return unknown('IPG model not recorded.');
    return o.value ? res('met', 'Sensing-capable IPG implanted.', o) : res('not_met', 'IPG cannot record local field potentials.', o);
  },

  updrsOffAtLeast: (f, p) => {
    const o = f.updrs3Off;
    if (!o) return unknown('No OFF-medication MDS-UPDRS III documented.');
    return o.value >= p.min
      ? res('met', `MDS-UPDRS III OFF ${o.value} (≥ ${p.min}).`, o)
      : res('not_met', `MDS-UPDRS III OFF ${o.value} (< ${p.min}).`, o);
  },

  offHoursAtLeast: (f, p) => {
    const o = f.dailyOffHours;
    if (!o) return unknown('No motor diary on file.');
    return o.value >= p.min
      ? res('met', `${o.value.toFixed(1)} h/day OFF time (≥ ${p.min}).`, o)
      : res('not_met', `${o.value.toFixed(1)} h/day OFF time (< ${p.min}).`, o);
  },
};

/** Which documented facts each evaluator reads (used to list the source documents for a patient). */
export const EVALUATOR_FIELDS: Record<string, (keyof PatientFacts)[]> = {
  idiopathicPD: ['diagnosis'],
  stnDbsDuration: ['dbsTarget', 'dbsImplantDate'],
  sasThreshold: ['sas'],
  noPermanentPeriopComplication: ['periopPermanentComplication'],
  mocaAbove: ['moca'],
  languageAdequate: ['languages'],
  notMostDorsalBilateral: ['mostDorsalContactBilateral'],
  consentObtainable: [],
  ageAtLeast: ['age'],
  sensingIPG: ['sensingIPG'],
  updrsOffAtLeast: ['updrs3Off'],
  offHoursAtLeast: ['dailyOffHours'],
};
