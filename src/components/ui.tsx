import type { ReactNode } from 'react';
import type { ScreeningResult, Verdict } from '../engine/types';

/* ---------- icons (inline, stroke-based, 16px) ---------- */
const paths: Record<string, ReactNode> = {
  dashboard: <><rect x="2" y="2" width="5" height="6" rx="1" /><rect x="9" y="2" width="5" height="3" rx="1" /><rect x="9" y="7" width="5" height="7" rx="1" /><rect x="2" y="10" width="5" height="4" rx="1" /></>,
  protocol: <><path d="M4 2h6l3 3v9H4z" /><path d="M10 2v3h3M6 8h5M6 11h5" /></>,
  screen: <><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5" /></>,
  people: <><circle cx="6" cy="5.5" r="2.5" /><path d="M1.5 14c.5-2.5 2.2-4 4.5-4s4 1.5 4.5 4" /><path d="M11 3.5a2.2 2.2 0 0 1 0 4.4M12.5 10c1.2.6 1.9 2 2 4" /></>,
  chat: <><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" /></>,
  chart: <><path d="M2 14h12" /><path d="M4 11 7 7l2.5 2L13 4" /></>,
  log: <><path d="M3 3h10M3 6.5h10M3 10h6M3 13.5h8" /></>,
  check: <path d="m3.5 8.5 3 3 6-7" />,
  x: <path d="m4 4 8 8M12 4l-8 8" />,
  question: <><circle cx="8" cy="8" r="6" /><path d="M6.3 6.3a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1v.4" /><circle cx="8" cy="11.6" r=".4" fill="currentColor" /></>,
  lock: <><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></>,
  upload: <><path d="M8 11V3M5 6l3-3 3 3" /><path d="M3 11v2.5h10V11" /></>,
  info: <><circle cx="8" cy="8" r="6" /><path d="M8 7.2V11M8 5v.2" /></>,
  arrow: <path d="M3 8h10M9 4l4 4-4 4" />,
  shield: <><path d="M8 2 3 4v4c0 3 2.2 5.2 5 6 2.8-.8 5-3 5-6V4z" /><path d="m5.8 8 1.6 1.6L10.5 6.5" /></>,
};
export function Icon({ name, size = 16 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

/* ---------- verdicts ---------- */
const V = {
  met: { cls: 'met', label: 'Met', icon: 'check' },
  not_met: { cls: 'notmet', label: 'Not met', icon: 'x' },
  unknown: { cls: 'unknown', label: 'Unknown', icon: 'question' },
} as const;

export function VerdictDot({ v }: { v: Verdict }) {
  const m = V[v];
  return (
    <span className={`chip ${m.cls}`} style={{ padding: 3, borderRadius: 6 }} title={m.label}>
      <Icon name={m.icon} size={13} />
    </span>
  );
}
export function VerdictChip({ v }: { v: Verdict }) {
  const m = V[v];
  return <span className={`chip ${m.cls}`}><Icon name={m.icon} size={12} />{m.label}</span>;
}

export function Tally({ r }: { r: Pick<ScreeningResult, 'met' | 'notMet' | 'unknown'> }) {
  return (
    <span className="tally" aria-label={`${r.met} met, ${r.notMet} not met, ${r.unknown} unknown`}>
      <span className="chip met">{r.met}</span>
      <span className="chip notmet">{r.notMet}</span>
      <span className="chip unknown">{r.unknown}</span>
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="score">
      <div className="score-track"><div className="score-fill" style={{ width: `${score * 100}%`, opacity: score === 0 ? 0 : 1 }} /></div>
      <span className="score-val">{score.toFixed(2)}</span>
    </div>
  );
}

export function BandChip({ band }: { band: ScreeningResult['band'] }) {
  const cls = band === 'High' ? 'accent' : band === 'Medium' ? 'ink' : band === 'Low' ? '' : 'notmet';
  return <span className={`chip ${cls}`}>{band}</span>;
}

export function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function PageHead({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  );
}
