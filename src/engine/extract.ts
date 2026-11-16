import type { CriterionCategory } from './types';

/**
 * Step 1 of the pipeline: turn protocol free text into a draft criteria checklist.
 *
 * In production this step is done by an LLM with a JSON schema (see docs/ARCHITECTURE.md).
 * The prototype ships a transparent, offline heuristic so it runs with no API key and no data
 * leaves the browser. It splits the inclusion/exclusion sections into items and guesses a category
 * and any numeric thresholds. Every draft criterion must be reviewed by the research officer.
 */
export interface DraftCriterion {
  kind: 'inclusion' | 'exclusion';
  text: string;
  category: CriterionCategory | 'Unmapped';
  numbers: string[];
  mappedField?: string;
}

const RULES: [RegExp, CriterionCategory, string?][] = [
  [/\b(starkstein|sas|apathy)\b/i, 'Clinical scale', 'sas'],
  [/\b(moca|montreal cognitive|mmse|dementia|cognitive)\b/i, 'Clinical scale', 'moca'],
  [/\b(updrs|hoehn|yahr)\b/i, 'Clinical scale', 'updrs3Off'],
  [/\b(diary|off[- ]time)\b/i, 'Clinical scale', 'dailyOffHours'],
  [/\b(contact|electrode|lead|ipg|pulse generator|sensing|stimulat)/i, 'Device state', 'mostDorsalContactBilateral'],
  [/\b(months?|weeks?|years?) (of|since|after|before)\b|\bat least \d+ (months?|weeks?)/i, 'Time window', 'dbsImplantDate'],
  [/\b(bleed|haemorrhage|hemorrhage|infection|surgery|surgical|perioperative)/i, 'Surgical history', 'periopPermanentComplication'],
  [/\b(parkinson|diagnos|idiopathic|essential tremor|dystonia)/i, 'Diagnosis', 'diagnosis'],
  [/\b(language|english|dutch|speak)/i, 'Language', 'languages'],
  [/\b(consent)/i, 'Consent'],
  [/\b(age|aged|years old)\b/i, 'Demographic', 'age'],
];

export function extractCriteria(text: string): DraftCriterion[] {
  const lines = text.replace(/\r/g, '').split('\n');
  let mode: 'inclusion' | 'exclusion' | null = null;
  const out: DraftCriterion[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/inclusion criteria|eligible if|to be eligible/i.test(line)) { mode = 'inclusion'; continue; }
    if (/exclusion criteria|excluded if|not eligible/i.test(line)) { mode = 'exclusion'; continue; }
    if (!mode) continue;
    // split "(a) ... (b) ..." or "a) ..." enumerations on a single line
    const parts = line.split(/(?:^|;\s*|\s)(?=\(?[a-h1-9]\)\s)/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const clean = p.replace(/^[-•*\d.]+\s*|^\(?[a-h1-9]\)\s*/i, '').replace(/[;,.]?\s*(and|or)?$/i, '').trim();
      if (clean.length < 4) continue;
      const rule = RULES.find(([re]) => re.test(clean));
      out.push({
        kind: mode,
        text: clean,
        category: rule ? rule[1] : 'Unmapped',
        mappedField: rule?.[2],
        numbers: clean.match(/\d+(\.\d+)?/g) ?? [],
      });
    }
  }
  return out;
}

export const SAMPLE_PROTOCOL_TEXT = `4.2 Participants

Inclusion criteria
(a) idiopathic PD,
(b) at least 3 months of STN DBS treatment, and
(c) a score of 14 or more points on the Starkstein Apathy Scale (SAS).

Exclusion criteria
(a) permanent changes due to perioperative intracerebral complications of STN DBS surgery, such as bleeding or infection;
(b) cognitive decline, as measured by a Montreal Cognitive Assessment (MoCA) score of 25 or less;
(c) insufficient command of the Dutch language;
(d) already stimulated on the most dorsal contact point on both electrodes;
(e) no written informed consent.`;
