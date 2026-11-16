// Core data model. Everything in this prototype is synthetic; see docs/DATA.md.

/** A single documented observation with its provenance. */
export interface Observation<T> {
  value: T;
  /** ISO date the value was recorded. */
  date: string;
  /** Document type, e.g. "Neurology clinic note". */
  source: string;
  /** Sentence quoted from the source document (shown as evidence). */
  quote: string;
}

/**
 * Facts the screening engine can read. Any field may be undocumented (undefined).
 * Abbreviations: PD = Parkinson's disease; DBS = deep brain stimulation; STN = subthalamic nucleus;
 * GPi = globus pallidus internus; IPG = implantable pulse generator; MoCA = Montreal Cognitive Assessment;
 * MDS-UPDRS = Movement Disorder Society–Unified Parkinson's Disease Rating Scale; H&Y = Hoehn and Yahr stage.
 */
export interface PatientFacts {
  diagnosis?: Observation<'Idiopathic PD' | 'Atypical parkinsonism' | 'Vascular parkinsonism'>;
  age?: Observation<number>;
  diseaseDurationYears?: Observation<number>;
  hoehnYahrOn?: Observation<number>; // Hoehn and Yahr stage (1–5) in the best medication-ON state
  levodopaResponsePct?: Observation<number>; // % improvement in MDS-UPDRS part III on a levodopa challenge test
  motorComplicationsYears?: Observation<number | null>; // years since motor fluctuations/dyskinesia began; null = none
  dailyOffHours?: Observation<number>; // from a 3-day Hauser motor diary
  fogEpisodesPerDay?: Observation<number>; // freezing-of-gait episodes per day (New Freezing of Gait Questionnaire items 1–2)
  updrs3Off?: Observation<number>; // MDS-UPDRS part III, medication OFF
  medsStableDays?: Observation<number>; // days since last change to dopaminergic medication
  activeDepression?: Observation<boolean>; // moderate–severe depression or suicidality on psychiatric screening
  hasDBS?: Observation<boolean>;
  dbsTarget?: Observation<'STN' | 'GPi'>;
  dbsImplantDate?: Observation<string>;
  sensingIPG?: Observation<boolean>;
  mostDorsalContactBilateral?: Observation<boolean>;
  periopPermanentComplication?: Observation<boolean>;
  sas?: Observation<number>; // Starkstein Apathy Scale, 0–42
  moca?: Observation<number>; // Montreal Cognitive Assessment, 0–30
  languages?: Observation<string[]>;
}

export type FactKey = keyof PatientFacts;

export type Verdict = 'met' | 'not_met' | 'unknown';

export type CriterionCategory =
  | 'Diagnosis'
  | 'Clinical scale'
  | 'Time window'
  | 'Surgical history'
  | 'Device state'
  | 'Language'
  | 'Consent'
  | 'Demographic'
  | 'Motor symptom'
  | 'Treatment response'
  | 'Medication'
  | 'Psychiatric';

/** Where the evidence for a criterion normally lives. */
export type EvidenceSource = 'EHR' | 'Device report' | 'Requires contact';

export interface CriterionParam {
  key: string;
  label: string;
  value: number;
  unit?: string;
}

export interface Criterion {
  id: string;
  kind: 'inclusion' | 'exclusion';
  /** Plain-language requirement, phrased so that "met" always means "OK for eligibility". */
  label: string;
  /** Sentence from the protocol (verbatim unless `paraphrased`). */
  sourceText: string;
  paraphrased?: boolean;
  /** Operational parameters added by the study team (e.g. data-freshness windows), not in the protocol. */
  siteRule?: string;
  section: string;
  category: CriterionCategory;
  evidenceSource: EvidenceSource;
  params: CriterionParam[];
  /** Name of the evaluator function in engine/evaluators.ts */
  evaluator: string;
  enabled: boolean;
  /** Fixed prior P(met) used when the criterion cannot be assessed from records (e.g. consent). */
  fixedPrior?: number;
}

export interface Protocol {
  id: string;
  shortName: string;
  /** The symptom the trial targets, e.g. "Motor fluctuations". */
  focus: string;
  intervention: string;
  status: 'Recruiting' | 'Feasibility';
  /** ISO date recruitment opened (recruiting trials only). */
  recruitmentStart?: string;
  title: string;
  citation: string;
  licence: string;
  registry: string;
  design: string;
  targetEnrolment: number;
  illustrative: boolean;
  criteria: Criterion[];
}

export interface CriterionResult {
  criterionId: string;
  verdict: Verdict;
  reason: string;
  evidence?: { source: string; date: string; quote: string };
}

export interface ScreeningResult {
  patientId: string;
  results: CriterionResult[];
  met: number;
  notMet: number;
  unknown: number;
  /** P(eligible) under independence, with unknown criteria replaced by their prior. */
  score: number;
  band: 'High' | 'Medium' | 'Low' | 'Ineligible';
}

export type Stage = 'Identified' | 'Pre-screened' | 'Approved for contact' | 'Consented' | 'Enrolled';

export interface ConsentRecord {
  formVersion: string;
  invitedOn?: string;
  signedOn?: string;
  /** Comprehension check score out of 5. */
  comprehension?: number;
  surveysComplete?: boolean;
}

/** A patient's progress through one trial's recruitment pipeline. */
export interface Pipeline {
  stage: Stage;
  consent: ConsentRecord;
  enrolledOn?: string;
}

export interface Patient {
  id: string; // study ID, e.g. PT-0412
  /** Pseudonymised identity key; resolvable only in the vault. */
  vaultKey: string;
  site: string;
  documented: PatientFacts;
  /** Complete ground truth (what a full manual chart review + interview would find). Validation only. */
  truth: PatientFacts;
  /** Recruitment state per trial (keyed by protocol id). Absent = only identified/pre-screened. */
  pipelines: Record<string, Pipeline>;
}

export type Role = 'Research officer' | 'Principal investigator' | 'Data custodian';

export interface Decision {
  patientId: string;
  protocolId: string;
  action: 'approve' | 'reject' | 'request_info';
  note: string;
  by: Role;
  at: string;
}

export interface AuditEntry {
  at: string;
  role: Role;
  action: string;
  detail: string;
}
