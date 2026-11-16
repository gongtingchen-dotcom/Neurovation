import type { Protocol } from '../engine/types';

/**
 * Protocol A is a real, openly licensed (CC BY 4.0) protocol:
 * Zoon TJC et al. Trials 2024;25:104. doi:10.1186/s13063-024-07938-9
 * Eligibility sentences marked `paraphrased` should be checked against the full text before presenting.
 * The language criterion is localised from "insufficient Dutch" to Singapore's four official languages.
 */
export const dstnApathy: Protocol = {
  id: 'dstn-apathy',
  shortName: 'dSTN-DBS · Apathy in PD',
  title:
    'Dorsal subthalamic nucleus DBS versus standard care for apathy in Parkinson’s disease: multicentre, double-blind, randomised crossover trial',
  citation: 'Zoon et al., Trials 2024;25:104 · doi:10.1186/s13063-024-07938-9',
  licence: 'CC BY 4.0',
  registry: 'Dutch trial register (onderzoekmetmensen.nl)',
  design: 'Randomised crossover · 1 month dorsal contact vs 1 month standard contact · primary outcome: SAS',
  targetEnrolment: 26,
  illustrative: false,
  criteria: [
    {
      id: 'I1', kind: 'inclusion', section: 'Eligibility · inclusion (a)',
      label: 'Idiopathic Parkinson’s disease',
      sourceText: '(a) idiopathic PD',
      category: 'Diagnosis', evidenceSource: 'EHR', params: [], evaluator: 'idiopathicPD', enabled: true,
    },
    {
      id: 'I2', kind: 'inclusion', section: 'Eligibility · inclusion (b)',
      label: 'STN DBS for at least the minimum duration',
      sourceText: '(b) at least 3 months of STN DBS treatment',
      category: 'Time window', evidenceSource: 'EHR',
      params: [{ key: 'minMonths', label: 'Minimum months since implant', value: 3, unit: 'months' }],
      evaluator: 'stnDbsDuration', enabled: true,
    },
    {
      id: 'I3', kind: 'inclusion', section: 'Eligibility · inclusion (c)',
      label: 'Clinically significant apathy on the Starkstein Apathy Scale',
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
      id: 'E1', kind: 'exclusion', section: 'Eligibility · exclusion (a)',
      label: 'No permanent sequelae of perioperative complications',
      sourceText: 'Permanent changes due to perioperative intracerebral complications of STN DBS surgery, such as bleeding or infection.',
      paraphrased: true,
      category: 'Surgical history', evidenceSource: 'EHR', params: [], evaluator: 'noPermanentPeriopComplication', enabled: true,
    },
    {
      id: 'E2', kind: 'exclusion', section: 'Eligibility · exclusion (b)',
      label: 'No cognitive decline (MoCA above cut-off)',
      sourceText: '(b) cognitive decline, as measured by a Montreal Cognitive Assessment (MoCA) score of 25 or less',
      siteRule: 'Freshness window: a MoCA older than 365 days is treated as unknown.',
      category: 'Clinical scale', evidenceSource: 'EHR',
      params: [
        { key: 'maxExcluded', label: 'Exclude if MoCA ≤', value: 25, unit: '/30' },
        { key: 'maxAgeDays', label: 'Accept scores up to', value: 365, unit: 'days old' },
      ],
      evaluator: 'mocaAbove', enabled: true,
    },
    {
      id: 'E3', kind: 'exclusion', section: 'Eligibility · exclusion (c)',
      label: 'Adequate command of a study language',
      sourceText: 'Insufficient command of the Dutch language. [Localised for Singapore: English, Mandarin, Malay or Tamil.]',
      paraphrased: true,
      category: 'Language', evidenceSource: 'EHR', params: [], evaluator: 'languageAdequate', enabled: true,
    },
    {
      id: 'E4', kind: 'exclusion', section: 'Eligibility · exclusion (d)',
      label: 'Not already stimulated on the most dorsal contact on both leads',
      sourceText: 'Patients who are already stimulated on the most dorsal contact point on both electrodes.',
      paraphrased: true,
      category: 'Device state', evidenceSource: 'Device report', params: [], evaluator: 'notMostDorsalBilateral', enabled: true,
    },
    {
      id: 'E5', kind: 'exclusion', section: 'Eligibility · exclusion (e)',
      label: 'Written informed consent obtained',
      sourceText: '(e) no written informed consent',
      category: 'Consent', evidenceSource: 'Requires contact', params: [], evaluator: 'consentObtainable', enabled: true,
      fixedPrior: 0.7,
    },
  ],
};

/** Protocol B is written for this demo to show device-specific criteria. It is NOT a real trial. */
export const adaptiveDbs: Protocol = {
  id: 'adbs-fluct',
  shortName: 'Adaptive DBS · Motor fluctuations',
  title: 'Illustrative: closed-loop (adaptive) STN-DBS versus conventional DBS for motor fluctuations in PD',
  citation: 'Illustrative protocol written for this prototype. Not a real trial.',
  licence: 'Synthetic',
  registry: '—',
  design: 'Illustrative: randomised, double-blind, parallel group · 3 months',
  targetEnrolment: 40,
  illustrative: true,
  criteria: [
    {
      id: 'I1', kind: 'inclusion', section: '4.1 (a)', label: 'Idiopathic Parkinson’s disease',
      sourceText: 'Clinically established idiopathic Parkinson’s disease (MDS criteria).',
      category: 'Diagnosis', evidenceSource: 'EHR', params: [], evaluator: 'idiopathicPD', enabled: true,
    },
    {
      id: 'I2', kind: 'inclusion', section: '4.1 (b)', label: 'Bilateral STN DBS for at least 6 months',
      sourceText: 'Bilateral STN DBS implanted at least 6 months before screening.',
      category: 'Time window', evidenceSource: 'EHR',
      params: [{ key: 'minMonths', label: 'Minimum months since implant', value: 6, unit: 'months' }],
      evaluator: 'stnDbsDuration', enabled: true,
    },
    {
      id: 'I3', kind: 'inclusion', section: '4.1 (c)', label: 'Sensing-capable implantable pulse generator',
      sourceText: 'Implanted pulse generator capable of local field potential (LFP) sensing.',
      category: 'Device state', evidenceSource: 'Device report', params: [], evaluator: 'sensingIPG', enabled: true,
    },
    {
      id: 'I4', kind: 'inclusion', section: '4.1 (d)', label: 'Residual OFF time on motor diary',
      sourceText: 'At least 2 hours of daily OFF time on a 3-day Hauser motor diary.',
      category: 'Clinical scale', evidenceSource: 'Requires contact',
      params: [{ key: 'min', label: 'Minimum daily OFF time', value: 2, unit: 'h/day' }],
      evaluator: 'offHoursAtLeast', enabled: true,
    },
    {
      id: 'I5', kind: 'inclusion', section: '4.1 (e)', label: 'Motor severity OFF medication',
      sourceText: 'MDS-UPDRS part III score of 30 or more in the medication-OFF state.',
      category: 'Clinical scale', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'MDS-UPDRS III OFF (≥)', value: 30 }],
      evaluator: 'updrsOffAtLeast', enabled: true,
    },
    {
      id: 'E1', kind: 'exclusion', section: '4.2 (a)', label: 'No dementia (MoCA above cut-off)',
      sourceText: 'MoCA score of 20 or less.',
      category: 'Clinical scale', evidenceSource: 'EHR',
      params: [
        { key: 'maxExcluded', label: 'Exclude if MoCA ≤', value: 20, unit: '/30' },
        { key: 'maxAgeDays', label: 'Accept scores up to', value: 365, unit: 'days old' },
      ],
      evaluator: 'mocaAbove', enabled: true,
    },
    {
      id: 'E2', kind: 'exclusion', section: '4.2 (b)', label: 'Adult participant',
      sourceText: 'Age under 21 years.',
      category: 'Demographic', evidenceSource: 'EHR',
      params: [{ key: 'min', label: 'Minimum age', value: 21, unit: 'years' }],
      evaluator: 'ageAtLeast', enabled: true,
    },
  ],
};

export const PROTOCOLS: Protocol[] = [dstnApathy, adaptiveDbs];
