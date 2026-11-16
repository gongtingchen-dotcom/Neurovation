import { describe, expect, it } from 'vitest';
import { COHORT } from '../src/data/cohort';
import { dstnApathy, PROTOCOLS } from '../src/data/protocols';
import { extractCriteria, SAMPLE_PROTOCOL_TEXT } from '../src/engine/extract';
import { screenCohort, screenPatient, trulyEligible } from '../src/engine/matcher';
import { wilson } from '../src/engine/metrics';
import type { Patient } from '../src/engine/types';

describe('synthetic cohort', () => {
  it('is deterministic and the right size', () => {
    expect(COHORT).toHaveLength(220);
    expect(new Set(COHORT.map((p) => p.id)).size).toBe(220);
  });
});

describe('matcher', () => {
  it('never scores a truly eligible patient as 0 (documented data only goes missing or stale, never contradicts)', () => {
    const { results } = screenCohort(dstnApathy, COHORT);
    const byId = new Map(results.map((r) => [r.patientId, r]));
    COHORT.filter((p) => trulyEligible(dstnApathy, p)).forEach((p) => expect(byId.get(p.id)!.score).toBeGreaterThan(0));
  });

  it('treats a stale SAS as unknown, not as a fail', () => {
    const p = structuredClone(COHORT[0]) as Patient;
    p.documented.sas = { value: 20, date: '2024-01-01', source: 'x', quote: 'x' };
    const r = screenPatient(dstnApathy, p, {});
    expect(r.results.find((x) => x.criterionId === 'I3')!.verdict).toBe('unknown');
  });

  it('applies the MoCA cut-off as "25 or less excluded"', () => {
    const p = structuredClone(COHORT[0]) as Patient;
    p.documented.moca = { value: 25, date: '2026-10-01', source: 'x', quote: 'x' };
    expect(screenPatient(dstnApathy, p, {}).results.find((x) => x.criterionId === 'E2')!.verdict).toBe('not_met');
    p.documented.moca.value = 26;
    expect(screenPatient(dstnApathy, p, {}).results.find((x) => x.criterionId === 'E2')!.verdict).toBe('met');
  });

  it('prints cohort summary', () => {
    for (const pr of PROTOCOLS) {
      const { results } = screenCohort(pr, COHORT);
      const bands: Record<string, number> = {};
      results.forEach((r) => (bands[r.band] = (bands[r.band] ?? 0) + 1));
      console.log(pr.id, bands, 'truly eligible:', COHORT.filter((p) => trulyEligible(pr, p)).length);
    }
  });
});

describe('extractor', () => {
  it('finds 3 inclusion and 5 exclusion criteria in the sample text', () => {
    const d = extractCriteria(SAMPLE_PROTOCOL_TEXT);
    expect(d.filter((x) => x.kind === 'inclusion')).toHaveLength(3);
    expect(d.filter((x) => x.kind === 'exclusion')).toHaveLength(5);
  });
});

describe('metrics', () => {
  it('computes a Wilson interval', () => {
    const [lo, hi] = wilson(18, 20);
    expect(lo).toBeCloseTo(0.699, 2);
    expect(hi).toBeCloseTo(0.972, 2);
  });
});
