/* Small, dependency-free SVG charts. Quiet axes, direct labels, one accent colour. */

export function HBar({ data, max, color = 'var(--chart-2)', valueSuffix = '' }: {
  data: { label: string; value: number; sub?: string }[];
  max?: number;
  color?: string;
  valueSuffix?: string;
}) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="stack" style={{ gap: 10 }}>
      {data.map((d) => (
        <div key={d.label}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--text)' }}>{d.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.value}{valueSuffix}{d.sub && <span className="muted" style={{ fontWeight: 400 }}> · {d.sub}</span>}</span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, marginTop: 4 }}>
            <div style={{ width: `${(d.value / m) * 100}%`, height: '100%', background: color, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="stack" style={{ gap: 8 }}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv = prev ? Math.round((s.value / Math.max(prev, 1)) * 100) : null;
        return (
          <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 70px', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13 }}>{s.label}</span>
            <div style={{ height: 22, background: 'var(--surface-2)', borderRadius: 4 }}>
              <div style={{ width: `${Math.max(1.5, (s.value / max) * 100)}%`, height: '100%', borderRadius: 4, background: i === steps.length - 1 ? 'var(--chart-1)' : 'var(--chart-2)', opacity: 1 - i * 0.1 }} />
            </div>
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              <b style={{ color: 'var(--ink)' }}>{s.value}</b>
              {conv !== null && <span className="tiny muted"> {conv}%</span>}
            </span>
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
  const W = 380, H = 240, L = 28, R = 10, T = 26, B = 24;
  const t0 = Date.parse(start), t1 = Date.parse(end);
  // project target over 12 months from start
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
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 6} y={y(v) + 4} fontSize="11" fill="var(--faint)" textAnchor="end">{v}</text>
        </g>
      ))}
      {months.map((d) => (
        <text key={+d} x={x(+d)} y={H - 6} fontSize="11" fill="var(--faint)" textAnchor="middle">{d.toLocaleString('en-GB', { month: 'short' })}</text>
      ))}
      <line x1={x(t0)} y1={y(0)} x2={x(tMax)} y2={y(targetNow)} stroke="var(--faint)" strokeDasharray="4 4" />
      <text x={x(tMax)} y={y(targetNow) - 8} fontSize="11" fill="var(--muted)" textAnchor="end">Plan: {Math.round(targetNow)} by now</text>
      {points.length > 0 && (
        <>
          <path d={`${step} L${x(tMax)},${y(last.value)}`} fill="none" stroke="var(--chart-1)" strokeWidth="2" />
          <circle cx={x(tMax)} cy={y(last.value)} r="3.5" fill="var(--chart-1)" />
          <text x={x(tMax)} y={y(last.value) + 18} fontSize="11.5" fill="var(--ink)" fontWeight="600" textAnchor="end">Actual: {last.value}</text>
        </>
      )}
    </svg>
  );
}

/** Recall and workload against decision threshold. */
export function ThresholdChart({ points, threshold }: {
  points: { threshold: number; recall: number; precision: number; workload: number }[];  // precision is undefined when nothing is flagged, so it is not drawn there
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
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 6} y={y(v) + 4} fontSize="10.5" fill="var(--faint)" textAnchor="end">{Math.round(v * 100)}%</text>
          <text x={x(v)} y={H - 10} fontSize="10.5" fill="var(--faint)" textAnchor="middle">{v.toFixed(2)}</text>
        </g>
      ))}
      <path d={line('workload')} fill="none" stroke="var(--chart-3)" strokeWidth="2" />
      <path d={line('precision')} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeDasharray="5 3" />
      <path d={line('recall')} fill="none" stroke="var(--chart-2)" strokeWidth="2.4" />
      <line x1={x(threshold)} x2={x(threshold)} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth="1" />
      <text x={x(threshold) + 5} y={T + 10} fontSize="10.5" fill="var(--ink)">threshold {threshold.toFixed(2)}</text>
    </svg>
  );
}
