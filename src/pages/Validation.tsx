import { useMemo, useState } from 'react';
import { ThresholdChart } from '../components/charts';
import { Icon, PageHead, Panel, Stats } from '../components/ui';
import { evaluateCriterion, trulyEligible } from '../engine/matcher';
import { averagePrecision, sweep, wilson } from '../engine/metrics';
import { useStore } from '../state/store';

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
const ci = ([a, b]: [number, number]) => `${(a * 100).toFixed(0)}–${(b * 100).toFixed(0)}%`;

export function Validation() {
  const { protocol, patients, resultById } = useStore();
  const [threshold, setThreshold] = useState(0.1);
  const [manualMin, setManualMin] = useState(52.5);
  const [assistMin, setAssistMin] = useState(9);

  const { scores, labels, curve, ap, positives } = useMemo(() => {
    const scores = patients.map((p) => resultById.get(p.id)!.score);
    const labels = patients.map((p) => trulyEligible(protocol, p));
    const ts = Array.from({ length: 51 }, (_, i) => i / 50);
    return { scores, labels, curve: sweep(scores, labels, ts), ap: averagePrecision(scores, labels), positives: labels.filter(Boolean).length };
  }, [patients, protocol, resultById]);

  const at = sweep(scores, labels, [threshold])[0];
  const recallCI = wilson(at.tp, positives);
  const precCI = wilson(at.tp, at.flagged);
  const manualHours = (patients.length * manualMin) / 60;
  const assistedHours = (at.flagged * assistMin) / 60;

  const missed = patients.filter((_, i) => labels[i] && !(scores[i] >= threshold && scores[i] > 0));

  const agreement = useMemo(() => protocol.criteria.filter((c) => c.enabled && c.evidenceSource !== 'Requires contact').map((c) => {
    let unknown = 0, agree = 0, known = 0;
    patients.forEach((p) => {
      const d = evaluateCriterion(c, p.documented).verdict;
      const t = evaluateCriterion(c, p.truth).verdict;
      if (d === 'unknown') unknown++;
      else { known++; if (d === t) agree++; }
    });
    return { c, unknown: unknown / patients.length, agreement: known ? agree / known : 1, known };
  }), [protocol, patients]);

  return (
    <>
      <PageHead
        crumbs={[protocol.shortName, 'Validation']}
        title="Validation (shadow mode)"
        sub="We replay a closed trial. The AI ranks patients from their records alone, and we compare that ranking with ground truth from a full chart review and interview. Recall comes first: a missed eligible patient never hears about the trial."
      />
      <div className="callout warn"><Icon name="info" /><span>This is a simulation on a synthetic cohort, so the numbers show the method, not real performance. In the study, ground truth will come from the closed trial’s screening log and a blinded dual chart review.</span></div>

      <Stats items={[
        { label: 'Truly eligible (ground truth)', value: positives, sub: `of ${patients.length} · ${pct(positives / patients.length)} prevalence` },
        { label: 'Recall (sensitivity)', value: pct(at.recall), sub: `95% CI ${ci(recallCI)} · ${at.tp}/${positives}` },
        { label: 'Precision (PPV)', value: pct(at.precision), sub: `95% CI ${ci(precCI)} · ${at.tp}/${at.flagged}` },
        { label: 'Charts needing review', value: pct(at.workload), sub: `${at.flagged} of ${patients.length}` },
        { label: 'Average precision', value: ap.toFixed(2), sub: `PR-AUC · chance ${(positives / patients.length).toFixed(2)}` },
      ]} />

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <Panel title="Operating point" sub="Fix the threshold before unblinding">
          <div className="stack">
            <ThresholdChart points={curve} threshold={threshold} />
            <div className="legend">
              <span><i style={{ background: 'var(--c1)' }} />Recall</span>
              <span><i style={{ background: 'var(--c4)' }} />Precision (dashed)</span>
              <span><i style={{ background: 'var(--c3)' }} />Share of charts to review</span>
            </div>
            <label className="stack" style={{ gap: 4 }}>
              <span className="small muted">Decision threshold on the match score: <b style={{ color: 'var(--text-1)' }}>{threshold.toFixed(2)}</b></span>
              <input type="range" min={0} max={1} step={0.02} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
            </label>
          </div>
        </Panel>

        <Panel title="Coordinator time" sub="Modelled, not measured">
          <div className="stack">
            <label className="row small" style={{ justifyContent: 'space-between' }}>Manual pre-screen, minutes per chart
              <input className="input num" type="number" value={manualMin} onChange={(e) => setManualMin(Number(e.target.value) || 0)} /></label>
            <label className="row small" style={{ justifyContent: 'space-between' }}>AI-assisted review, minutes per flagged chart
              <input className="input num" type="number" value={assistMin} onChange={(e) => setAssistMin(Number(e.target.value) || 0)} /></label>
            <div className="divider" />
            <div className="grid g-2" style={{ gap: 12 }}>
              <div><div className="kpi-label">Manual</div><div className="kpi-value" style={{ fontSize: 22 }}>{manualHours.toFixed(0)} h</div></div>
              <div><div className="kpi-label">AI-assisted</div><div className="kpi-value" style={{ fontSize: 22, color: 'var(--primary)' }}>{assistedHours.toFixed(0)} h</div></div>
            </div>
            <p className="tiny muted">Default values: 45–60 minutes per manual pre-screen (midpoint 52.5) and under 9 minutes per AI-assisted review, as reported by Callies et al. 2025 (arXiv 2503.15374). The pilot will measure both directly.</p>
          </div>
        </Panel>
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <Panel title="Criterion-level performance" sub="Documented records vs ground truth" flush>
          <table className="table">
            <thead><tr><th>Criterion</th><th>Evidence from</th><th className="num">Unknown</th><th className="num">Agreement when known</th></tr></thead>
            <tbody>
              {agreement.map(({ c, unknown, agreement, known }) => (
                <tr key={c.id}>
                  <td><span className="mono faint" style={{ marginRight: 6 }}>{c.id}</span><span className="strong">{c.label}</span></td>
                  <td><span className="chip ink">{c.evidenceSource}</span></td>
                  <td className="num"><span className={unknown > 0.2 ? 'chip unknown' : ''}>{pct(unknown)}</span></td>
                  <td className="num">{pct(agreement)} <span className="faint tiny">n={known}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-foot">The engine never guesses, so agreement on known criteria is high. The open question is how often criteria are <b>unknown</b>. Device state and recent scale scores are the biggest gaps in neuromodulation trials.</div>
        </Panel>

        <Panel title="Missed eligible patients" sub={`${missed.length} below threshold`}>
          <div>
            {missed.length === 0 && <p className="muted small">No eligible patient falls below the threshold.</p>}
            {missed.slice(0, 8).map((p) => {
              const r = resultById.get(p.id)!;
              const u = r.results.filter((x) => x.verdict === 'unknown').map((x) => x.criterionId);
              return (
                <div key={p.id} className="row small" style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="mono">{p.id}</span>
                  <span className="muted">score {r.score.toFixed(2)} · unknown: {u.join(', ')}</span>
                </div>
              );
            })}
            <p className="tiny muted" style={{ marginTop: 10 }}>Each miss comes from missing data, never from a wrong rule. Lowering the threshold, or routing two or more unknown criteria to a short call, recovers them. That is why “unknown” is a state of its own and not a fail.</p>
          </div>
        </Panel>
      </div>
    </>
  );
}
