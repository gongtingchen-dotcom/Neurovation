import type { Criterion, Protocol } from '../engine/types';

/**
 * Trial portfolio of a hypothetical movement-disorders research unit.
 * Three trials target MOTOR symptoms of Parkinson's disease (PD); one targets apathy (non-motor).
 *
 * Abbreviations used below (spelled out in the UI labels):
 *   DBS  deep brain stimulation        STN  subthalamic nucleus      GPi  globus pallidus internus
 *   IPG  implantable pulse generator   SCS  spinal cord stimulation  FOG  freezing of gait
 *   MoCA Montreal Cognitive Assessment SAS  Starkstein Apathy Scale
 *   MDS-UPDRS Movement Disorder Society–Unified Parkinson's Disease Rating Scale
 */

const consent = (id: string, section: string, sourceText = 'Unable or unwilling to give written informed consent.'): Criterion => ({
  id, kind: 'exclusion', section, label: 'Written informed consent obtained', sourceText,
  category: 'Consent', evidenceSource: 'Requires contact', params: [], evaluator: 'consentObtainable', enabled: true, fixedPrior: 0.7,
});

const idiopathic = (id: string, section: string, sourceText: string): Criterion => ({
  id, kind: 'inclusion', section, label: 'Idiopathic Parkinson’s disease', sourceText,
  category: 'Diagnosis', evidenceSource: 'EHR', params: [], evaluator: 'idiopathicPD', enabled: true,
});

const moca = (id: string, section: string, cutoff: number, sourceText: string): Criterion => ({
  id, kind: 'exclusion', section, label: 'No significant cognitive impairment (Montreal Cognitive Assessment, MoCA)', sourceText,
  siteRule: 'Freshness window: a MoCA older than 365 days is treated as unknown.',
  category: 'Clinical scale', evidenceSource: 'EHR',
  params: [
    { key: 'maxExcluded', label: 'Exclude if MoCA ≤', value: cutoff, unit: '/30' },
    { key: 'maxAgeDays', label: 'Accept scores up to', value: 365, unit: 'days old' },
  ],
  evaluator: 'mocaAbove', enabled: true,
});

/* ---------------------------------------------------------------- 1. MOTOR: fluctuations */
/** Illustrative, modelled on the design of ADAPT-PD (NCT04547712). Criteria are NOT the real ADAPT-PD criteria. */
export const adaptiveDbs: Protocol = {
  id: 'adbs-fluct',
  shortName: 'Adaptive DBS · Motor fluctuations',
  focus: 'Motor fluctuations (ON/OFF)',
  intervention: 'Adaptive (closed-loop) deep brain stimulation',
  status: 'Recruiting',
  recruitmentStart: '2026-04-20',
  title: 'Adaptive (closed-loop) versus conventional deep brain stimulation for motor fluctuations in Parkinson’s disease',
  citation: 'Illustrative protocol modelled on the design of ADAPT-PD (NCT04547712). Criteria written for this demo.',
  licence: 'Synthetic',
  registry: '—',
  design: 'Randomised, single-blind crossover · adaptive vs conventional DBS · 1 month each · primary outcome: daily ON time without troublesome dyskinesia',
  targetEnrolment: 30,
  illustrative: true,
  criteria: [
    idiopathic('I1', '4.1 (a)', 'Clinically established idiopathic Parkinson’s disease (MDS clinical diagnostic criteria).'),
    {
      id: 'I2', kind: 'inclusion', section: '4.1 (b)', label: 'Bilateral STN or GPi deep brain stimulation (DBS) for at least 3 months',
      sourceText: 'Bilateral subthalamic nucleus (STN) or globus pallidus internus (GPi) DBS implanted at least 3 months before screening.',
      category: 'Time window', evidenceSource: 'EHR', params: [{ key: 'minMonths', label: 'Minimum months since implant', value: 3, unit: 'months' }],
      evaluator: 'anyDbsDuration', enabled: true,
    },
    {
      id: 'I3', kind: 'inclusion', section: '4.1 (c)', label: 'Sensing-capable implantable pulse generator (IPG)',
      sourceText: 'Implanted pulse generator capable of recording local field potentials.',
      category: 'Device state', evidenceSource: 'Device report', params: [], evaluator: 'sensingIPG', enabled: true,
    },
    {
      id: 'I4', kind: 'inclusion', section: '4.1 (d)', label: 'Residual OFF time on a motor diary',
      sourceText: 'At least 2 hours of daily OFF time on a 3-day Hauser motor diary.',
      category: 'Motor symptom', evidenceSource: 'Requires contact', params: [{ key: 'min', label: 'Minimum daily OFF time', value: 2, unit: 'h/day' }],
      evaluator: 'offHoursAtLeast', enabled: true,
    },
    {
      id: 'I5', kind: 'inclusion', section: '4.1 (e)', label: 'Stable dopaminergic medication',
      sourceText: 'No change to dopaminergic medication in the 30 days before screening.',
      category: 'Medication', evidenceSource: 'EHR', params: [{ key: 'minDays', label: 'Unchanged for at least', value: 30, unit: 'days' }],
      evaluator: 'medsStable', enabled: true,
    },
    moca('E1', '4.2 (a)', 20, 'Dementia, defined as a Montreal Cognitive Assessment (MoCA) score of 20 or less.'),
    consent('E2', '4.2 (b)'),
  ],
};

/* ---------------------------------------------------------------- 2. MOTOR: early complications */
/** Modelled on EARLYSTIM (Schuepbach et al., N Engl J Med 2013; NCT00354133). Check thresholds against the paper. */
export const earlyDbs: Protocol = {
  id: 'early-dbs',
  shortName: 'Early STN-DBS · Motor complications',
  focus: 'Early motor complications (fluctuations, dyskinesia)',
  intervention: 'Subthalamic nucleus deep brain stimulation plus best medical therapy',
  status: 'Recruiting',
  recruitmentStart: '2026-02-02',
  title: 'Subthalamic deep brain stimulation versus best medical therapy for Parkinson’s disease with early motor complications',
  citation: 'Eligibility modelled on EARLYSTIM (Schuepbach et al., N Engl J Med 2013;368:610–622; NCT00354133). Psychiatric and cognitive criteria simplified.',
  licence: 'Adapted',
  registry: 'Model: NCT00354133',
  design: 'Randomised, parallel group · DBS + medication vs medication alone · 2 years · primary outcome: quality of life (PDQ-39)',
  targetEnrolment: 40,
  illustrative: true,
  criteria: [
    idiopathic('I1', 'Inclusion (a)', 'Idiopathic Parkinson’s disease.'),
    {
      id: 'I2', kind: 'inclusion', section: 'Inclusion (b)', label: 'Age 18–60 years',
      sourceText: 'Age 18 to 60 years.', category: 'Demographic', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum age', value: 18, unit: 'years' }, { key: 'max', label: 'Maximum age', value: 60, unit: 'years' }],
      evaluator: 'ageBetween', enabled: true,
    },
    {
      id: 'I3', kind: 'inclusion', section: 'Inclusion (c)', label: 'Disease duration of at least 4 years',
      sourceText: 'Disease duration of 4 years or more.', category: 'Time window', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum years since diagnosis', value: 4, unit: 'years' }],
      evaluator: 'diseaseDurationAtLeast', enabled: true,
    },
    {
      id: 'I4', kind: 'inclusion', section: 'Inclusion (d)', label: 'Strong levodopa response (MDS-UPDRS part III)',
      sourceText: 'Improvement of motor signs of at least 50% with dopaminergic medication (Unified Parkinson’s Disease Rating Scale part III).',
      category: 'Treatment response', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum improvement', value: 50, unit: '%' }],
      evaluator: 'levodopaResponseAtLeast', enabled: true,
    },
    {
      id: 'I5', kind: 'inclusion', section: 'Inclusion (e)', label: 'Motor fluctuations or dyskinesia for 3 years or less',
      sourceText: 'Motor fluctuations or dyskinesia present for 3 years or less.', category: 'Motor symptom', evidenceSource: 'EHR',
      params: [{ key: 'max', label: 'Maximum years of complications', value: 3, unit: 'years' }],
      evaluator: 'recentMotorComplications', enabled: true,
    },
    {
      id: 'I6', kind: 'inclusion', section: 'Inclusion (f)', label: 'Mild disease in best ON state (Hoehn and Yahr stage)',
      sourceText: 'Hoehn and Yahr stage 2.5 or lower in the best ON condition.', paraphrased: true,
      category: 'Motor symptom', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum stage', value: 1, unit: '' }, { key: 'max', label: 'Maximum stage', value: 2.5, unit: '' }],
      evaluator: 'hoehnYahrBetween', enabled: true,
    },
    {
      id: 'E1', kind: 'exclusion', section: 'Exclusion (a)', label: 'No previous deep brain stimulation (DBS)',
      sourceText: 'Previous neurosurgical treatment for Parkinson’s disease.', category: 'Surgical history', evidenceSource: 'EHR',
      params: [], evaluator: 'noPriorDbs', enabled: true,
    },
    moca('E2', 'Exclusion (b)', 24, 'Dementia. [Simplified for this demo to a Montreal Cognitive Assessment (MoCA) score of 24 or less; EARLYSTIM used the Mattis Dementia Rating Scale.]'),
    {
      id: 'E3', kind: 'exclusion', section: 'Exclusion (c)', label: 'No moderate–severe depression or suicidality',
      sourceText: 'Major depression with suicidal thoughts, or other severe psychiatric disease.', paraphrased: true,
      category: 'Psychiatric', evidenceSource: 'EHR', params: [], evaluator: 'noActiveDepression', enabled: true,
    },
    consent('E4', 'Exclusion (d)'),
  ],
};

/* ---------------------------------------------------------------- 3. MOTOR: gait */
/** Illustrative, drawing on registered trials of spinal cord stimulation for freezing of gait (e.g. NCT06798844, NCT05148468). */
export const scsFog: Protocol = {
  id: 'scs-fog',
  shortName: 'Spinal cord stimulation · Freezing of gait',
  focus: 'Freezing of gait and axial symptoms',
  intervention: 'Thoracic spinal cord stimulation (SCS)',
  status: 'Feasibility',
  title: 'Spinal cord stimulation for freezing of gait in Parkinson’s disease',
  citation: 'Illustrative protocol drawing on registered spinal cord stimulation trials for freezing of gait (NCT06798844, NCT05148468). Criteria written for this demo.',
  licence: 'Synthetic',
  registry: '—',
  design: 'Randomised, double-blind, placebo-controlled crossover · primary outcome: New Freezing of Gait Questionnaire (NFOG-Q)',
  targetEnrolment: 24,
  illustrative: true,
  criteria: [
    idiopathic('I1', 'Inclusion (a)', 'Diagnosis of idiopathic Parkinson’s disease.'),
    {
      id: 'I2', kind: 'inclusion', section: 'Inclusion (b)', label: 'Age 40–80 years',
      sourceText: 'Age between 40 and 80 years.', category: 'Demographic', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum age', value: 40, unit: 'years' }, { key: 'max', label: 'Maximum age', value: 80, unit: 'years' }],
      evaluator: 'ageBetween', enabled: true,
    },
    {
      id: 'I3', kind: 'inclusion', section: 'Inclusion (c)', label: 'Daily freezing of gait (New Freezing of Gait Questionnaire)',
      sourceText: 'At least one freezing-of-gait episode per day (New Freezing of Gait Questionnaire, items 1–2).',
      category: 'Motor symptom', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum episodes per day', value: 1, unit: '/day' }],
      evaluator: 'fogAtLeast', enabled: true,
    },
    {
      id: 'I4', kind: 'inclusion', section: 'Inclusion (d)', label: 'Moderate disease (Hoehn and Yahr stage 2.5–4)',
      sourceText: 'Hoehn and Yahr stage between 2.5 and 4.0.', category: 'Motor symptom', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum stage', value: 2.5, unit: '' }, { key: 'max', label: 'Maximum stage', value: 4, unit: '' }],
      evaluator: 'hoehnYahrBetween', enabled: true,
    },
    {
      id: 'I5', kind: 'inclusion', section: 'Inclusion (e)', label: 'Stable medication (and DBS settings, if any)',
      sourceText: 'Stable Parkinson’s medication and, if applicable, DBS settings for at least one month.', category: 'Medication', evidenceSource: 'EHR',
      params: [{ key: 'minDays', label: 'Unchanged for at least', value: 30, unit: 'days' }],
      evaluator: 'medsStable', enabled: true,
    },
    moca('E1', 'Exclusion (a)', 20, 'Significant cognitive impairment (Montreal Cognitive Assessment, MoCA, of 20 or less).'),
    consent('E2', 'Exclusion (b)'),
  ],
};

/* ---------------------------------------------------------------- 4. NON-MOTOR: apathy */
/**
 * Real, openly licensed (CC BY 4.0) protocol: Zoon TJC et al. Trials 2024;25:104. doi:10.1186/s13063-024-07938-9
 * Sentences marked `paraphrased` should be checked against the full text.
 */
export const dstnApathy: Protocol = {
  id: 'dstn-apathy',
  shortName: 'Dorsal STN-DBS · Apathy',
  focus: 'Apathy after STN deep brain stimulation (non-motor)',
  intervention: 'Switching DBS to a more dorsal subthalamic contact',
  status: 'Recruiting',
  recruitmentStart: '2026-04-20',
  title: 'Dorsal subthalamic nucleus deep brain stimulation versus standard care for apathy in Parkinson’s disease: multicentre, double-blind, randomised crossover trial',
  citation: 'Zoon et al., Trials 2024;25:104 · doi:10.1186/s13063-024-07938-9',
  licence: 'CC BY 4.0',
  registry: 'Dutch trial register (onderzoekmetmensen.nl)',
  design: 'Randomised crossover · 1 month dorsal contact vs 1 month standard contact · primary outcome: Starkstein Apathy Scale',
  targetEnrolment: 26,
  illustrative: false,
  criteria: [
    idiopathic('I1', 'Eligibility · inclusion (a)', '(a) idiopathic PD'),
    {
      id: 'I2', kind: 'inclusion', section: 'Eligibility · inclusion (b)', label: 'Subthalamic nucleus (STN) DBS for at least 3 months',
      sourceText: '(b) at least 3 months of STN DBS treatment',
      category: 'Time window', evidenceSource: 'EHR', params: [{ key: 'minMonths', label: 'Minimum months since implant', value: 3, unit: 'months' }],
      evaluator: 'stnDbsDuration', enabled: true,
    },
    {
      id: 'I3', kind: 'inclusion', section: 'Eligibility · inclusion (c)', label: 'Clinically significant apathy (Starkstein Apathy Scale, SAS)',
      sourceText: '(c) a score of 14 or more points on the Starkstein Apathy Scale (SAS)',
      siteRule: 'Freshness window: an SAS older than 180 days is treated as unknown and flagged for re-assessment.',
      category: 'Clinical scale', evidenceSource: 'EHR',
      params: [
        { key: 'min', label: 'SAS threshold (≥)', value: 14, unit: '/42' },
        { key: 'maxAgeDays', label: 'Accept scores up to', value: 180, unit: 'days old' },
      ],
      evaluator: 'sasThreshold', enabled: true,
    },
    {
      id: 'E1', kind: 'exclusion', section: 'Eligibility · exclusion (a)', label: 'No permanent sequelae of perioperative complications',
      sourceText: 'Permanent changes due to perioperative intracerebral complications of STN DBS surgery, such as bleeding or infection.', paraphrased: true,
      category: 'Surgical history', evidenceSource: 'EHR', params: [], evaluator: 'noPermanentPeriopComplication', enabled: true,
    },
    moca('E2', 'Eligibility · exclusion (b)', 25, '(b) cognitive decline, as measured by a Montreal Cognitive Assessment (MoCA) score of 25 or less'),
    {
      id: 'E3', kind: 'exclusion', section: 'Eligibility · exclusion (c)', label: 'Adequate command of a study language',
      sourceText: 'Insufficient command of the Dutch language. [Localised for Singapore: English, Mandarin, Malay or Tamil.]', paraphrased: true,
      category: 'Language', evidenceSource: 'EHR', params: [], evaluator: 'languageAdequate', enabled: true,
    },
    {
      id: 'E4', kind: 'exclusion', section: 'Eligibility · exclusion (d)', label: 'Not already stimulated on the most dorsal contact of both leads',
      sourceText: 'Patients who are already stimulated on the most dorsal contact point on both electrodes.', paraphrased: true,
      category: 'Device state', evidenceSource: 'Device report', params: [], evaluator: 'notMostDorsalBilateral', enabled: true,
    },
    consent('E5', 'Eligibility · exclusion (e)', '(e) no written informed consent'),
  ],
};

export const PROTOCOLS: Protocol[] = [adaptiveDbs, earlyDbs, scsFog, dstnApathy];
