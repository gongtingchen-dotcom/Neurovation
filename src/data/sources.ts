import type { Patient, PatientFacts } from '../engine/types';

/**
 * Where each kind of evidence physically lives in a typical hospital.
 * This is the core of "why manual screening is slow": the facts exist, but as sentences spread
 * across several systems that do not share a search box.
 */
export interface SourceSystem {
  id: string;
  name: string;
  format: 'Structured field' | 'Free-text note' | 'Scanned PDF' | 'External system' | 'Paper';
  searchable: boolean;
}

export const SYSTEMS: Record<string, SourceSystem> = {
  emrNotes: { id: 'emrNotes', name: 'EMR · clinical notes', format: 'Free-text note', searchable: false },
  emrSurgery: { id: 'emrSurgery', name: 'EMR · operative record', format: 'Free-text note', searchable: false },
  emrInpatient: { id: 'emrInpatient', name: 'EMR · discharge summaries', format: 'Free-text note', searchable: false },
  neuropsych: { id: 'neuropsych', name: 'Neuropsychology reports', format: 'Scanned PDF', searchable: false },
  programmer: { id: 'programmer', name: 'DBS programmer / vendor portal', format: 'External system', searchable: false },
  pas: { id: 'pas', name: 'Patient administration system', format: 'Structured field', searchable: true },
  diary: { id: 'diary', name: 'Motor diary', format: 'Paper', searchable: false },
};

const SOURCE_TO_SYSTEM: Record<string, string> = {
  'Neurology clinic note': 'emrNotes',
  'Operative report': 'emrSurgery',
  'Discharge summary': 'emrInpatient',
  'Neuropsychology assessment': 'neuropsych',
  'DBS programming report': 'programmer',
  'Registration record': 'pas',
  'Motor diary': 'diary',
};

export const systemOf = (source: string) => SYSTEMS[SOURCE_TO_SYSTEM[source] ?? 'emrNotes'];

/** Deterministic hash so record size does not disturb the seeded cohort. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Number of documents in the patient's record since DBS work-up (synthetic). */
export function recordSize(p: Patient) {
  return Math.round(60 + hash(p.id) * 260);
}

export interface SourceDoc {
  key: keyof PatientFacts;
  title: string;
  date: string;
  system: SourceSystem;
  quote: string;
}

const LABEL: Partial<Record<keyof PatientFacts, string>> = {
  diagnosis: 'Neurology clinic letter',
  dbsImplantDate: 'Operative report',
  sas: 'Neuropsychology report (SAS)',
  moca: 'Neuropsychology report (MoCA)',
  periopPermanentComplication: 'Discharge summary',
  mostDorsalContactBilateral: 'DBS programming session',
  languages: 'Registration record',
  age: 'Registration record',
  sensingIPG: 'Device implant record',
  updrs3Off: 'Movement disorders clinic note',
  dailyOffHours: 'Hauser motor diary',
};

/** The documents a coordinator would need to locate for this patient, given the protocol's fields. */
export function documentsFor(p: Patient, fields: (keyof PatientFacts)[]): SourceDoc[] {
  const seen = new Set<string>();
  const out: SourceDoc[] = [];
  for (const k of fields) {
    const o = p.documented[k];
    if (!o) continue;
    const id = `${o.source}-${o.date}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ key: k, title: LABEL[k] ?? o.source, date: o.date, system: systemOf(o.source), quote: o.quote });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** Fictional study staff (not patients) used to make the workflow concrete. */
export const STAFF = [
  { initials: 'MT', name: 'M. Tan', role: 'Research officer' },
  { initials: 'AR', name: 'A. Rahman', role: 'Research officer' },
  { initials: 'SK', name: 'S. Kumar', role: 'Research coordinator' },
];
export const assigneeOf = (p: Patient) => STAFF[Math.floor(hash(p.id + 'a') * STAFF.length)];
