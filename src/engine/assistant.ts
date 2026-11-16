import { TODAY, daysBetween } from './evaluators';
import type { ConsentRecord, Patient, Pipeline, Protocol, Role, ScreeningResult, Stage } from './types';

/**
 * Grounded study assistant (prototype).
 *
 * Answers ONLY from the protocol and the study database, and returns the sources it used.
 * The prototype uses intent matching so it runs offline and is fully deterministic. A production
 * version would put an LLM in front of the same retrieval functions ("tools") so that every number
 * in an answer still comes from a database query, never from the model's memory.
 */
export interface Answer {
  text: string;
  sources: string[];
  patientIds?: string[];
  refused?: boolean;
}

export interface AssistantContext {
  protocol: Protocol;
  patients: Patient[];
  screening: ScreeningResult[];
  stageOf: (p: Patient) => Stage;
  pipelineOf: (p: Patient) => Pipeline | undefined;
  role: Role;
}

export const SUGGESTIONS = [
  'Which screened patients are one criterion short of eligibility?',
  'Who is overdue for a consent follow-up?',
  'Which criterion causes the most screen failures?',
  'How close are we to the enrolment target?',
  'What is the cognitive (MoCA) cut-off in this protocol?',
  'Which criteria are most often unknown?',
];

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function answer(q: string, ctx: AssistantContext): Answer {
  const s = q.toLowerCase();
  const { protocol, patients, screening, stageOf, role } = ctx;
  const cons = (p: Patient): ConsentRecord => ctx.pipelineOf(p)?.consent ?? { formVersion: '—' };
  const crit = (id: string) => protocol.criteria.find((c) => c.id === id)!;

  // ---- scope guard: identity questions ----
  if (/\b(name|nric|address|phone|contact details|who is pt|identity|mrn)\b/.test(s)) {
    if (role !== 'Data custodian')
      return {
        refused: true,
        text: `Your role (${role}) cannot see identifying information. Study IDs only. A data custodian can resolve an ID in the identity vault, and that access is logged.`,
        sources: ['Access policy · role-based permissions'],
      };
    return { text: 'Identity resolution happens in the Participants → Identity vault panel so that each look-up is logged individually.', sources: ['Access policy'] };
  }

  // ---- specific patient ----
  const idMatch = q.match(/PT-\d{4}/i);
  if (idMatch) {
    const id = idMatch[0].toUpperCase();
    const r = screening.find((x) => x.patientId === id);
    if (!r) return { text: `${id} is not in the study database.`, sources: ['Study database'] };
    const rank = screening.indexOf(r) + 1;
    const lines = r.results
      .filter((x) => x.verdict !== 'met')
      .map((x) => `• ${crit(x.criterionId).label}: ${x.verdict === 'unknown' ? 'unknown' : 'not met'}. ${x.reason}`);
    return {
      text: `${id} is ranked ${rank} of ${screening.length}, with a match score of ${r.score.toFixed(2)} (${r.band}). ${r.met} met, ${r.notMet} not met, ${r.unknown} unknown.${lines.length ? `\n${lines.join('\n')}` : '\nAll criteria are met.'}`,
      sources: [`Screening result · ${id}`, ...r.results.filter((x) => x.evidence).slice(0, 3).map((x) => `${x.evidence!.source}, ${x.evidence!.date}`)],
      patientIds: [id],
    };
  }

  // ---- one criterion short ----
  if (/one criterion|one short|almost|close to elig|nearly/.test(s)) {
    const consentIds = new Set(protocol.criteria.filter((c) => c.evaluator === 'consentObtainable').map((c) => c.id));
    const assessableUnknown = (r: ScreeningResult) => r.results.filter((x) => x.verdict === 'unknown' && !consentIds.has(x.criterionId));
    const near = screening.filter((r) => r.notMet === 0 && assessableUnknown(r).length === 1).slice(0, 6);
    if (!near.length) return { text: 'No patient is exactly one assessable criterion short.', sources: ['Screening results'] };
    const counts: Record<string, number> = {};
    near.forEach((r) => assessableUnknown(r).forEach((x) => (counts[x.criterionId] = (counts[x.criterionId] ?? 0) + 1)));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      text: `${near.length} patients have no failed criterion and exactly one criterion still unknown from the records (consent aside). The most common gap is “${crit(top[0]).label}” (${top[1]} of ${near.length}). Highest-ranked: ${near[0].patientId}, score ${near[0].score.toFixed(2)}.`,
      sources: ['Screening results', `Protocol ${crit(top[0]).section}`],
      patientIds: near.map((r) => r.patientId),
    };
  }

  // ---- overdue consent ----
  if (/overdue|follow.?up|unsigned|consent/.test(s) && !/cut.?off|threshold/.test(s)) {
    const overdue = patients.filter((p) => stageOf(p) === 'Approved for contact' && cons(p).invitedOn && !cons(p).signedOn && daysBetween(cons(p).invitedOn!, TODAY) > 7);
    if (!overdue.length) return { text: 'No consent forms are overdue.', sources: ['Consent tracker'] };
    return {
      text: `${overdue.length} patients have had an unsigned consent form for more than 7 days: ${overdue.map((p) => `${p.id} (${daysBetween(cons(p).invitedOn!, TODAY)} d, form ${cons(p).formVersion})`).join(', ')}.${overdue.some((p) => cons(p).formVersion !== 'v2.1') ? ' Some were sent the superseded v2.0 form and need re-consent on v2.1.' : ''}`,
      sources: ['Consent tracker', 'Consent form version register'],
      patientIds: overdue.map((p) => p.id),
    };
  }

  // ---- screen failures ----
  if (/screen fail|most fail|exclud|biggest barrier|block/.test(s)) {
    const counts: Record<string, number> = {};
    screening.forEach((r) => r.results.filter((x) => x.verdict === 'not_met').forEach((x) => (counts[x.criterionId] = (counts[x.criterionId] ?? 0) + 1)));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const failed = screening.filter((r) => r.notMet > 0).length;
    return {
      text: `${failed} of ${screening.length} patients fail at least one criterion. Leading causes: ${sorted.slice(0, 3).map(([id, n]) => `${crit(id).label} (${n})`).join('; ')}. Patients can fail more than one.`,
      sources: ['Screening results', ...sorted.slice(0, 3).map(([id]) => `Protocol ${crit(id).section}`)],
    };
  }

  // ---- target / progress ----
  if (/target|enrol|progress|how many|how close/.test(s)) {
    const enrolled = patients.filter((p) => stageOf(p) === 'Enrolled').length;
    const consented = patients.filter((p) => stageOf(p) === 'Consented').length;
    return {
      text: `${enrolled} of ${protocol.targetEnrolment} participants enrolled (${pct(enrolled / protocol.targetEnrolment)}). ${consented} more have consented and are awaiting the baseline visit.`,
      sources: ['Enrolment log', `Protocol · target n = ${protocol.targetEnrolment}`],
    };
  }

  // ---- unknowns ----
  if (/unknown|missing|data gap/.test(s)) {
    const counts: Record<string, number> = {};
    screening.forEach((r) => r.results.filter((x) => x.verdict === 'unknown').forEach((x) => (counts[x.criterionId] = (counts[x.criterionId] ?? 0) + 1)));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(([id]) => crit(id).evidenceSource !== 'Requires contact');
    return {
      text: `Most often unknown from the records: ${sorted.slice(0, 3).map(([id, n]) => `${crit(id).label} (${n} patients, ${pct(n / screening.length)})`).join('; ')}. Device-state criteria usually depend on programming reports held outside the EHR.`,
      sources: ['Screening results', 'Data source map'],
    };
  }

  // ---- protocol lookup ----
  const scale = /moca/.test(s) ? 'moca' : /sas|starkstein|apathy/.test(s) ? 'sas' : /month|duration|how long/.test(s) ? 'months' : /dorsal|contact/.test(s) ? 'dorsal' : /inclusion|exclusion|criteria|eligib/.test(s) ? 'all' : null;
  if (scale) {
    if (scale === 'all')
      return {
        text: protocol.criteria.map((c) => `${c.kind === 'inclusion' ? 'Inclusion' : 'Exclusion'} ${c.section.split('(').pop()?.replace(')', '') ?? ''}: ${c.sourceText}`).join('\n'),
        sources: [protocol.citation],
      };
    const want: Record<string, string[]> = {
      moca: ['mocaAbove'], sas: ['sasThreshold'], levodopa: ['levodopaResponseAtLeast'], fog: ['fogAtLeast'], hy: ['hoehnYahrBetween'],
      age: ['ageBetween', 'ageAtLeast'], months: ['stnDbsDuration', 'anyDbsDuration', 'diseaseDurationAtLeast'], dorsal: ['notMostDorsalBilateral'],
    };
    const c = protocol.criteria.find((c) => want[scale].includes(c.evaluator));
    if (!c) return { text: 'This protocol has no criterion on that.', sources: [protocol.citation] };
    return {
      text: `“${c.sourceText}”${c.params.length ? ` Current setting: ${c.params.map((p) => `${p.label.toLowerCase()} ${p.value}${p.unit ? ` ${p.unit}` : ''}`).join('; ')}.` : ''}${c.siteRule ? ` Site rule: ${c.siteRule}` : ''}`,
      sources: [`Protocol ${c.section}`, protocol.citation],
    };
  }

  return {
    text: 'I can only answer from this protocol and the study database. Try asking about eligibility gaps, consent follow-ups, screen failures, enrolment progress, a protocol threshold, or a study ID such as PT-1001.',
    sources: [],
  };
}
