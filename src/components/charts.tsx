/* Small, dependency-free SVG charts. Quiet axes, direct labels, one accent colour. */

export function HBar({ data, max, color = 'var(--c1)' }: {
  data: { label: string; value: number }[];
  max?: number;
  color?: string;
}) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="stack" style={{ gap: 12 }}>
      {data.map((d) => (
        <div key={d.label}>
          <div className="row between" style={{ fontSize: 13, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-2)' }}>{d.label}</span>
            <span className="num" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{d.value}</span>
          </div>
          <div style={{ height: 6, background: 'var(--hover)', borderRadius: 3, marginTop: 6 }}>
            <div style={{ width: `${(d.value / m) * 100}%`, height: '100%', background: color, borderRadius: 3, opacity: 0.85 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="stack" style={{ gap: 0 }}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv = prev ? Math.round((s.value / Math.max(prev, 1)) * 100) : null;
        return (
          <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 56px 56px', alignItems: 'center', gap: 16, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 0 }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{s.label}</span>
            <div style={{ height: 8, background: 'var(--hover)', borderRadius: 4 }}>
              <div style={{ width: `${Math.max(1, (s.value / max) * 100)}%`, height: '100%', borderRadius: 4, background: 'var(--c1)', opacity: 1 - i * 0.12 }} />
            </div>
            <span className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-1)' }}>{s.value}</span>
            <span className="num tiny muted" style={{ textAlign: 'right' }}>{conv !== null ? `${conv}%` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Cumulative enrolment vs linear target. */
export function CumulativeChart({ points, target, start, end }: {
  points: { date: string; value: number }[];
  target: number;
  start: string;
  end: string;
}) {
  const W = 380, H = 230, L = 28, R = 10, T = 22, B = 24;
  const t0 = Date.parse(start), t1 = Date.parse(end);
  const tTarget = t0 + 365 * 86_400_000;
  const tMax = Math.max(t1, t0 + 1);
  const yMax = Math.max(target, ...points.map((p) => p.value)) * 1.05;
  const x = (t: number) => L + ((t - t0) / (tMax - t0)) * (W - L - R);
  const y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const step = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(Date.parse(p.date))},${y(i ? points[i - 1].value : 0)} L${x(Date.parse(p.date))},${y(p.value)}`).join(' ');
  const last = points[points.length - 1];
  const targetNow = (target * (tMax - t0)) / (tTarget - t0);
  const ticks = [0, Math.round(target / 2), target];
  const months = Array.from({ length: 8 }, (_, i) => new Date(t0 + i * 30.44 * 86_400_000)).filter((_, i) => i % 2 === 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cumulative enrolment against target">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={L - 6} y={y(v) + 4} fontSize="11" fill="var(--text-5)" textAnchor="end">{v}</text>
        </g>
      ))}
      {months.map((d) => (
        <text key={+d} x={x(+d)} y={H - 6} fontSize="11" fill="var(--text-5)" textAnchor="middle">{d.toLocaleString('en-GB', { month: 'short' })}</text>
      ))}
      <line x1={x(t0)} y1={y(0)} x2={x(tMax)} y2={y(targetNow)} stroke="var(--text-5)" strokeDasharray="3 4" />
      <text x={x(tMax)} y={y(targetNow) - 8} fontSize="11" fill="var(--text-4)" textAnchor="end">Plan: {Math.round(targetNow)} by now</text>
      {points.length > 0 && (
        <>
          <path d={`${step} L${x(tMax)},${y(last.value)}`} fill="none" stroke="var(--c1)" strokeWidth="2" />
          <circle cx={x(tMax)} cy={y(last.value)} r="3.5" fill="var(--c1)" />
          <text x={x(tMax)} y={y(last.value) + 18} fontSize="11.5" fill="var(--text-1)" fontWeight="600" textAnchor="end">Actual: {last.value}</text>
        </>
      )}
    </svg>
  );
}

/** Recall and workload against decision threshold. */
export function ThresholdChart({ points, threshold }: {
  points: { threshold: number; recall: number; precision: number; workload: number }[]; // precision undefined when nothing is flagged, so not drawn there
  threshold: number;
}) {
  const W = 560, H = 230, L = 36, R = 14, T = 12, B = 30;
  const x = (t: number) => L + t * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const line = (k: 'recall' | 'precision' | 'workload') => (k === 'precision' ? points.filter((p) => p.workload > 0) : points).map((p, i) => `${i ? 'L' : 'M'}${x(p.threshold)},${y(p[k])}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Recall, precision and workload by threshold">
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={L - 6} y={y(v) + 4} fontSize="11" fill="var(--text-5)" textAnchor="end">{Math.round(v * 100)}%</text>
          <text x={x(v)} y={H - 10} fontSize="11" fill="var(--text-5)" textAnchor="middle">{v.toFixed(2)}</text>
        </g>
      ))}
      <path d={line('workload')} fill="none" stroke="var(--c3)" strokeWidth="2" />
      <path d={line('precision')} fill="none" stroke="var(--c4)" strokeWidth="1.6" strokeDasharray="5 3" />
      <path d={line('recall')} fill="none" stroke="var(--c1)" strokeWidth="2.4" />
      <line x1={x(threshold)} x2={x(threshold)} y1={T} y2={H - B} stroke="var(--text-1)" strokeWidth="1" />
      <text x={x(threshold) + 6} y={T + 10} fontSize="11" fill="var(--text-1)">threshold {threshold.toFixed(2)}</text>
    </svg>
  );
}
