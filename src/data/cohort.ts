import { TODAY } from '../engine/evaluators';
import type { Observation, Patient, PatientFacts, Stage } from '../engine/types';

/**
 * Synthetic cohort of patients with DBS at two hypothetical movement-disorder clinics.
 * Seeded, so every teammate and every reload sees exactly the same cohort.
 *
 * Each patient has:
 *   truth       – the complete facts (what a full chart review + interview would find)
 *   documented  – what the screening engine can actually see: some fields missing, some stale
 *
 * Distribution assumptions are documented in docs/DATA.md. They are plausible, not empirical.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261116);
const r = () => rand();
const chance = (p: number) => r() < p;
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
function normal(mean: number, sd: number) {
  const u = 1 - r();
  const v = r();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const addDays = (iso: string, d: number) => new Date(Date.parse(iso) + d * 86_400_000).toISOString().slice(0, 10);
const daysAgo = (d: number) => addDays(TODAY, -Math.round(d));

const SITES = ['Site A · Neurology', 'Site B · Neurosurgery'];
const LANG_SETS: string[][] = [
  ['English'], ['English'], ['English', 'Mandarin'], ['English', 'Mandarin'], ['Mandarin'],
  ['English', 'Malay'], ['Malay'], ['English', 'Tamil'], ['Hokkien'], ['Bengali'],
];

export const COHORT_SIZE = 220;

function buildPatient(i: number): Patient {
  const id = `PT-${String(1000 + i * 7 + Math.floor(r() * 7)).padStart(4, '0')}`;
  const obs = <T,>(value: T, date: string, source: string, quote: string): Observation<T> => ({ value, date, source, quote });

  // ---------- ground truth ----------
  const diagnosis = chance(0.92) ? 'Idiopathic PD' : chance(0.6) ? 'Atypical parkinsonism' : 'Vascular parkinsonism';
  const target = chance(0.86) ? 'STN' : 'GPi';
  const implantDaysAgo = clamp(normal(900, 700), 20, 4200);
  const implantDate = daysAgo(implantDaysAgo);
  const sas = Math.round(clamp(normal(12.5, 6), 0, 42));
  const moca = Math.round(clamp(normal(25.3, 2.9), 12, 30));
  const periop = chance(0.03);
  const dorsal = chance(0.1);
  const langs = pick(LANG_SETS);
  const age = Math.round(clamp(normal(64, 8.5), 38, 84));
  const sensing = chance(0.45);
  const updrs = Math.round(clamp(normal(34, 10), 8, 80));
  const offH = Math.round(clamp(normal(2.4, 1.5), 0, 8) * 2) / 2;

  const sasDate = daysAgo(r() * 150);
  const mocaDate = daysAgo(r() * 300);
  const opNote = 'Operative report';
  const prog = 'DBS programming report';
  const clinic = 'Neurology clinic note';
  const neuropsych = 'Neuropsychology assessment';

  const truth: PatientFacts = {
    diagnosis: obs(diagnosis, daysAgo(implantDaysAgo + 400), clinic, `Impression: ${diagnosis}${diagnosis === 'Idiopathic PD' ? ', levodopa-responsive, asymmetric onset' : ''}.`),
    dbsTarget: obs(target, implantDate, opNote, `Bilateral ${target} DBS leads implanted under general anaesthesia.`),
    dbsImplantDate: obs(implantDate, implantDate, opNote, `Date of surgery ${implantDate}. Bilateral ${target} lead placement, IPG implanted in the right infraclavicular pocket.`),
    sas: obs(sas, sasDate, neuropsych, `Starkstein Apathy Scale ${sas}/42${sas >= 14 ? '; caregiver reports loss of initiative since surgery' : ''}.`),
    moca: obs(moca, mocaDate, neuropsych, `MoCA ${moca}/30${moca <= 25 ? ', deficits in delayed recall and executive items' : ''}.`),
    periopPermanentComplication: obs(periop, implantDate, 'Discharge summary', periop ? 'Post-op CT: left frontal haemorrhage along the tract; residual right-sided weakness at discharge.' : 'Uneventful post-operative course; no haemorrhage on post-op CT.'),
    mostDorsalContactBilateral: obs(dorsal, daysAgo(r() * 120), prog, dorsal ? 'Active contacts: L3 / R11 (most dorsal on both leads).' : `Active contacts: L${pick([1, 2])} / R${pick([9, 10])}; dorsal contacts not yet tested for mood effects.`),
    languages: obs(langs, daysAgo(r() * 900), 'Registration record', `Preferred language(s): ${langs.join(', ')}.`),
    age: obs(age, TODAY, 'Registration record', `Age ${age}.`),
    sensingIPG: obs(sensing, implantDate, prog, sensing ? 'IPG with LFP sensing (BrainSense-class).' : 'Non-sensing rechargeable IPG.'),
    updrs3Off: obs(updrs, daysAgo(r() * 200), clinic, `MDS-UPDRS III (med OFF / stim ON): ${updrs}.`),
    dailyOffHours: obs(offH, daysAgo(r() * 60), 'Motor diary', `Hauser diary, 3-day mean OFF time ${offH.toFixed(1)} h/day.`),
  };

  // ---------- what the screener can see ----------
  const documented: PatientFacts = { ...truth };
  const drop = (k: keyof PatientFacts, p: number) => { if (chance(p)) delete documented[k]; };
  drop('diagnosis', 0.03);
  drop('dbsImplantDate', 0.05);
  drop('periopPermanentComplication', 0.12);
  drop('mostDorsalContactBilateral', 0.32); // programming reports often sit in the vendor portal, not the EHR
  drop('languages', 0.08);
  drop('sensingIPG', 0.25);
  drop('updrs3Off', 0.3);
  drop('dailyOffHours', 0.7); // diaries are rarely in the EHR

  // SAS: missing in 22%, stale in 18% (old value drifted from today's truth)
  const s = r();
  if (s < 0.22) delete documented.sas;
  else if (s < 0.4) {
    const old = Math.round(clamp(sas + normal(-2, 4), 0, 42));
    const d = daysAgo(220 + r() * 400);
    documented.sas = obs(old, d, neuropsych, `Starkstein Apathy Scale ${old}/42.`);
  }
  const m = r();
  if (m < 0.14) delete documented.moca;
  else if (m < 0.24) {
    const old = Math.round(clamp(moca + normal(1, 1.5), 12, 30));
    const d = daysAgo(400 + r() * 500);
    documented.moca = obs(old, d, neuropsych, `MoCA ${old}/30.`);
  }

  const vaultKey = `MRN-${Math.floor(1_000_000 + r() * 8_999_999)}`;
  return { id, vaultKey, site: pick(SITES), documented, truth, stage: 'Identified', consent: { formVersion: 'v2.1' } };
}

/** Is the patient truly eligible for the dSTN-apathy protocol (all record-assessable criteria, ground truth)? */
function trulyEligibleDstn(p: Patient) {
  const t = p.truth;
  const months = (Date.parse(TODAY) - Date.parse(t.dbsImplantDate!.value)) / 86_400_000 / 30.44;
  return (
    t.diagnosis!.value === 'Idiopathic PD' && t.dbsTarget!.value === 'STN' && months >= 3 &&
    t.sas!.value >= 14 && !t.periopPermanentComplication!.value && t.moca!.value > 25 &&
    t.languages!.value.some((l) => ['English', 'Mandarin', 'Malay', 'Tamil'].includes(l)) &&
    !t.mostDorsalContactBilateral!.value
  );
}

function simulatePipeline(p: Patient) {
  // Pipeline for the active trial (dSTN-apathy). Approximately 7 months of recruitment so far.
  if (!trulyEligibleDstn(p)) {
    p.stage = 'Pre-screened';
    return;
  }
  // Leave ~45% of eligible patients un-actioned so the demo has a live review queue.
  if (chance(0.45)) { p.stage = 'Pre-screened'; return; }
  const willSign = chance(0.72);
  // Non-signers are recent invitations (older non-responders would be closed as "declined").
  const invited = willSign ? daysAgo(5 + r() * 200) : daysAgo(2 + r() * 18);
  p.stage = 'Approved for contact';
  p.consent = { formVersion: chance(0.8) ? 'v2.1' : 'v2.0', invitedOn: invited };
  if (willSign) {
    const signed = addDays(invited, 3 + Math.round(r() * 12));
    if (signed > TODAY) return;
    p.stage = 'Consented';
    p.consent.signedOn = signed;
    p.consent.comprehension = chance(0.85) ? pick([4, 5, 5]) : 3;
    p.consent.surveysComplete = chance(0.8);
    if (chance(0.85)) {
      const enrolled = addDays(signed, 7 + Math.round(r() * 14));
      if (enrolled <= TODAY) { p.stage = 'Enrolled'; p.enrolledOn = enrolled; }
    }
  }
}

export const COHORT: Patient[] = Array.from({ length: COHORT_SIZE }, (_, i) => buildPatient(i));
COHORT.forEach(simulatePipeline);

export const STAGES: Stage[] = ['Identified', 'Pre-screened', 'Approved for contact', 'Consented', 'Enrolled'];
export const RECRUITMENT_START = daysAgo(210);
export { trulyEligibleDstn };
