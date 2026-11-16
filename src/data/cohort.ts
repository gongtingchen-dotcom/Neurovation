import { TODAY } from '../engine/evaluators';
import { trulyEligible } from '../engine/matcher';
import type { Observation, Patient, PatientFacts, Stage } from '../engine/types';
import { PROTOCOLS } from './protocols';

/**
 * Synthetic cohort: 420 people with parkinsonism followed at two hypothetical movement-disorders
 * clinics. About 40% already have deep brain stimulation (DBS). Seeded, so everyone sees the same cohort.
 *
 *   truth       – complete facts (what a full chart review plus interview would find)
 *   documented  – what the screening engine can see: some fields missing, some out of date
 *
 * Distributions are plausible, not empirical. See docs/DATA.md.
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
const half = (x: number) => Math.round(x * 2) / 2;
const addDays = (iso: string, d: number) => new Date(Date.parse(iso) + d * 86_400_000).toISOString().slice(0, 10);
const daysAgo = (d: number) => addDays(TODAY, -Math.round(d));

const SITES = ['Site A · Movement disorders clinic', 'Site B · Functional neurosurgery'];
const LANG_SETS: string[][] = [
  ['English'], ['English'], ['English', 'Mandarin'], ['English', 'Mandarin'], ['Mandarin'],
  ['English', 'Malay'], ['Malay'], ['English', 'Tamil'], ['Hokkien'], ['Bengali'],
];

export const COHORT_SIZE = 420;

function buildPatient(i: number): Patient {
  const id = `PT-${String(1000 + i * 7 + Math.floor(r() * 7)).padStart(4, '0')}`;
  const obs = <T,>(value: T, date: string, source: string, quote: string): Observation<T> => ({ value, date, source, quote });
  const clinic = 'Neurology clinic note';
  const neuropsych = 'Neuropsychology assessment';
  const opNote = 'Operative report';
  const prog = 'DBS programming report';

  // ---------- ground truth ----------
  const hasDBS = chance(0.4);
  // About 1 in 3 patients without DBS has been referred for DBS work-up: younger, levodopa-responsive, fluctuating.
  const workup = !hasDBS && chance(0.33);
  const diagnosis = chance(0.92) ? 'Idiopathic PD' : chance(0.6) ? 'Atypical parkinsonism' : 'Vascular parkinsonism';
  const age = Math.round(clamp(normal(hasDBS ? 62 : workup ? 55 : 66, workup ? 6 : 9.5), 35, 88));
  const duration = Math.round(clamp(hasDBS ? normal(12, 4) : workup ? normal(7.5, 3) : normal(5.5, 4), 0.3, 28) * 10) / 10;
  const hy = half(clamp(1.4 + duration * 0.08 + (age - 60) * 0.02 + normal(0, 0.5), 1, 5));
  const ldResponse = Math.round(clamp(normal(workup ? 56 : 45, workup ? 12 : 15), 5, 85));
  const hasComplications = chance(workup ? 0.9 : clamp(0.1 + duration * 0.075, 0, 0.92));
  const complicationsYears = hasComplications ? Math.round(clamp(workup ? 0.5 + r() * 4 : r() * Math.max(0.3, duration - 2), 0.2, 20) * 10) / 10 : null;
  const offHours = hasComplications ? Math.round(clamp(normal(hasDBS ? 2.2 : 3, 1.4), 0.3, 8) * 2) / 2 : 0;
  const hasFog = chance(clamp(0.03 + duration * 0.035 + (hy - 2) * 0.15, 0, 0.75));
  const fogPerDay = hasFog ? Math.max(1, Math.round(Math.exp(normal(1, 0.7)))) : 0;
  const updrs = Math.round(clamp(normal(26 + hy * 5, 9), 6, 80));
  const medsStable = chance(0.72) ? Math.round(31 + r() * 380) : Math.round(3 + r() * 27);
  const depression = chance(0.12);
  const target = chance(0.86) ? 'STN' : 'GPi';
  const implantDaysAgo = clamp(normal(900, 700), 20, 4200);
  const implantDate = daysAgo(implantDaysAgo);
  const sensing = chance(0.45);
  const dorsal = chance(0.1);
  const periop = chance(0.03);
  const sas = Math.round(clamp(normal(hasDBS ? 12.5 : 10, 6), 0, 42));
  const moca = Math.round(clamp(normal(25.6 - (age - 64) * 0.08, 2.9), 12, 30));
  const langs = pick(LANG_SETS);

  const dxDate = daysAgo(duration * 365);
  const clinicDate = daysAgo(r() * 120);
  const sasDate = daysAgo(r() * 150);
  const mocaDate = daysAgo(r() * 300);

  const truth: PatientFacts = {
    diagnosis: obs(diagnosis, daysAgo(r() * 300 + 60), clinic, `Impression: ${diagnosis}${diagnosis === 'Idiopathic PD' ? ', asymmetric onset, levodopa-responsive' : ''}.`),
    age: obs(age, TODAY, 'Registration record', `Age ${age}.`),
    diseaseDurationYears: obs(duration, dxDate, clinic, `Diagnosed with Parkinson’s disease in ${dxDate.slice(0, 4)}.`),
    hoehnYahrOn: obs(hy, clinicDate, clinic, `Hoehn and Yahr stage ${hy} (best ON).`),
    levodopaResponsePct: obs(ldResponse, daysAgo(r() * 700 + 30), 'Levodopa challenge report', `MDS-UPDRS III OFF ${Math.round(updrs * 1.0)} → best ON ${Math.round(updrs * (1 - ldResponse / 100))}: ${ldResponse}% improvement.`),
    motorComplicationsYears: obs(complicationsYears, clinicDate, clinic, complicationsYears === null ? 'No motor fluctuations or dyskinesia reported.' : `Wearing-off and peak-dose dyskinesia since ${(2026 - complicationsYears).toFixed(0)}.`),
    dailyOffHours: obs(offHours, daysAgo(r() * 60), 'Motor diary', `Hauser diary, 3-day mean OFF time ${offHours.toFixed(1)} h/day.`),
    fogEpisodesPerDay: obs(fogPerDay, clinicDate, clinic, fogPerDay > 0 ? `Freezing at doorways and on turning, about ${fogPerDay} episode${fogPerDay > 1 ? 's' : ''} a day.` : 'No freezing of gait reported.'),
    updrs3Off: obs(updrs, daysAgo(r() * 200), clinic, `MDS-UPDRS III (medication OFF): ${updrs}.`),
    medsStableDays: obs(medsStable, daysAgo(medsStable), 'Prescribing record', `Levodopa/carbidopa dose last changed ${daysAgo(medsStable)}.`),
    activeDepression: obs(depression, daysAgo(r() * 250), 'Psychiatry screening', depression ? 'Beck Depression Inventory 27; passive suicidal ideation reported.' : 'Beck Depression Inventory 8; no suicidal ideation.'),
    hasDBS: obs(hasDBS, hasDBS ? implantDate : daysAgo(r() * 200), hasDBS ? opNote : clinic, hasDBS ? `Bilateral ${target} DBS implanted ${implantDate}.` : 'No previous neurosurgery.'),
    languages: obs(langs, daysAgo(r() * 900), 'Registration record', `Preferred language(s): ${langs.join(', ')}.`),
    moca: obs(moca, mocaDate, neuropsych, `MoCA ${moca}/30${moca <= 25 ? ', deficits in delayed recall and executive items' : ''}.`),
    sas: obs(sas, sasDate, neuropsych, `Starkstein Apathy Scale ${sas}/42${sas >= 14 ? '; caregiver reports loss of initiative' : ''}.`),
  };
  if (hasDBS) {
    Object.assign(truth, {
      dbsTarget: obs(target, implantDate, opNote, `Bilateral ${target} DBS leads implanted under general anaesthesia.`),
      dbsImplantDate: obs(implantDate, implantDate, opNote, `Date of surgery ${implantDate}. Bilateral ${target} lead placement.`),
      sensingIPG: obs(sensing, implantDate, prog, sensing ? 'Pulse generator with local field potential sensing.' : 'Non-sensing rechargeable pulse generator.'),
      mostDorsalContactBilateral: obs(dorsal, daysAgo(r() * 120), prog, dorsal ? 'Active contacts: L3 / R11 (most dorsal on both leads).' : `Active contacts: L${pick([1, 2])} / R${pick([9, 10])}.`),
      periopPermanentComplication: obs(periop, implantDate, 'Discharge summary', periop ? 'Post-op CT: left frontal haemorrhage along the tract; residual right-sided weakness.' : 'Uneventful post-operative course; no haemorrhage on post-op CT.'),
    } satisfies PatientFacts);
  } else {
    // No DBS: these criteria resolve to "not met" via hasDBS. Surgical-history items are simply absent.
  }

  // ---------- what the screener can see ----------
  const documented: PatientFacts = { ...truth };
  const drop = (k: keyof PatientFacts, p: number) => { if (chance(p)) delete documented[k]; };
  drop('diagnosis', 0.03);
  drop('diseaseDurationYears', 0.06);
  drop('hoehnYahrOn', 0.25);
  drop('levodopaResponsePct', hasDBS ? 0.2 : workup ? 0.35 : 0.8); // challenge tests are mostly done during DBS work-up
  drop('motorComplicationsYears', 0.2);
  drop('dailyOffHours', 0.7); // paper diaries rarely reach the record
  drop('fogEpisodesPerDay', 0.4);
  drop('updrs3Off', 0.3);
  drop('medsStableDays', 0.08);
  drop('activeDepression', 0.3);
  drop('hasDBS', 0.02);
  drop('languages', 0.08);
  if (hasDBS) {
    drop('dbsImplantDate', 0.05);
    drop('sensingIPG', 0.25);
    drop('mostDorsalContactBilateral', 0.32); // programming reports often sit in the vendor portal
    drop('periopPermanentComplication', 0.12);
  }
  // Starkstein Apathy Scale: missing or stale (older value, drifted from today's truth)
  const s = r();
  if (s < (hasDBS ? 0.22 : 0.6)) delete documented.sas;
  else if (s < (hasDBS ? 0.4 : 0.75)) {
    const old = Math.round(clamp(sas + normal(-2, 4), 0, 42));
    documented.sas = obs(old, daysAgo(220 + r() * 400), neuropsych, `Starkstein Apathy Scale ${old}/42.`);
  }
  const m = r();
  if (m < 0.14) delete documented.moca;
  else if (m < 0.24) {
    const old = Math.round(clamp(moca + normal(1, 1.5), 12, 30));
    documented.moca = obs(old, daysAgo(400 + r() * 500), neuropsych, `MoCA ${old}/30.`);
  }

  const vaultKey = `MRN-${Math.floor(1_000_000 + r() * 8_999_999)}`;
  return { id, vaultKey, site: hasDBS ? pick(SITES) : SITES[0], documented, truth, pipelines: {} };
}

/** Simulate recruitment so far for each recruiting trial. A patient can be enrolled in only one trial. */
function simulatePipelines(patients: Patient[]) {
  for (const pr of PROTOCOLS.filter((p) => p.status === 'Recruiting')) {
    const start = pr.recruitmentStart!;
    const span = Math.max(10, (Date.parse(TODAY) - Date.parse(start)) / 86_400_000 - 10);
    for (const p of patients) {
      if (Object.values(p.pipelines).some((x) => x.stage !== 'Pre-screened')) continue; // no co-enrolment
      if (!trulyEligible(pr, p)) continue;
      if (chance(0.45)) continue; // leave part of the eligible pool un-actioned: the live review queue
      const willSign = chance(0.72);
      const invited = willSign ? addDays(start, 5 + r() * (span - 20)) : daysAgo(2 + r() * 18);
      const pl = { stage: 'Approved for contact' as Stage, consent: { formVersion: chance(0.8) ? 'v2.1' : 'v2.0', invitedOn: invited } as Patient['pipelines'][string]['consent'], enrolledOn: undefined as string | undefined };
      p.pipelines[pr.id] = pl;
      if (!willSign) continue;
      const signed = addDays(invited, 3 + Math.round(r() * 12));
      if (signed > TODAY) continue;
      pl.stage = 'Consented';
      pl.consent.signedOn = signed;
      pl.consent.comprehension = chance(0.85) ? pick([4, 5, 5]) : 3;
      pl.consent.surveysComplete = chance(0.8);
      if (chance(0.85)) {
        const enrolled = addDays(signed, 7 + Math.round(r() * 14));
        if (enrolled <= TODAY) { pl.stage = 'Enrolled'; pl.enrolledOn = enrolled; }
      }
    }
  }
}

export const COHORT: Patient[] = Array.from({ length: COHORT_SIZE }, (_, i) => buildPatient(i));
simulatePipelines(COHORT);

export const STAGES: Stage[] = ['Identified', 'Pre-screened', 'Approved for contact', 'Consented', 'Enrolled'];
