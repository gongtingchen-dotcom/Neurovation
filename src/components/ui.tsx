import type { ReactNode } from 'react';
import type { ScreeningResult, Verdict } from '../engine/types';

/* ---------- icons (16px stroke set) ---------- */
const paths: Record<string, ReactNode> = {
  dashboard: <><rect x="2" y="2" width="5" height="6" rx="1" /><rect x="9" y="2" width="5" height="3" rx="1" /><rect x="9" y="7" width="5" height="7" rx="1" /><rect x="2" y="10" width="5" height="4" rx="1" /></>,
  protocol: <><path d="M4 2h6l3 3v9H4z" /><path d="M10 2v3h3M6 8h5M6 11h5" /></>,
  screen: <><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5" /></>,
  people: <><circle cx="6" cy="5.5" r="2.5" /><path d="M1.5 14c.5-2.5 2.2-4 4.5-4s4 1.5 4.5 4" /><path d="M11 3.5a2.2 2.2 0 0 1 0 4.4M12.5 10c1.2.6 1.9 2 2 4" /></>,
  chat: <><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" /></>,
  chart: <><path d="M2 14h12" /><path d="M4 11 7 7l2.5 2L13 4" /></>,
  log: <><path d="M3 3h10M3 6.5h10M3 10h6M3 13.5h8" /></>,
  check: <path d="m3.5 8.5 3 3 6-7" />,
  x: <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />,
  question: <><path d="M6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4" /><circle cx="8" cy="11.8" r=".5" fill="currentColor" stroke="none" /></>,
  lock: <><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></>,
  upload: <><path d="M8 11V3M5 6l3-3 3 3" /><path d="M3 11v2.5h10V11" /></>,
  info: <><circle cx="8" cy="8" r="6" /><path d="M8 7.2V11M8 5v.2" /></>,
  arrow: <path d="M3 8h10M9 4l4 4-4 4" />,
  shield: <><path d="M8 2 3 4v4c0 3 2.2 5.2 5 6 2.8-.8 5-3 5-6V4z" /><path d="m5.8 8 1.6 1.6L10.5 6.5" /></>,
  search: <><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></>,
  chevrons: <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />,
  file: <><path d="M4 2h5l3 3v9H4z" /><path d="M9 2v3h3" /></>,
  scan: <><path d="M2 5V3a1 1 0 0 1 1-1h2M11 2h2a1 1 0 0 1 1 1v2M14 11v2a1 1 0 0 1-1 1h-2M5 14H3a1 1 0 0 1-1-1v-2" /><path d="M5 8h6" /></>,
  device: <><rect x="4" y="2" width="8" height="12" rx="2" /><path d="M7 11h2" /></>,
  database: <><ellipse cx="8" cy="4" rx="5" ry="2" /><path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" /></>,
  paper: <><path d="M3 2h10v12H3z" /><path d="M5.5 5h5M5.5 8h5M5.5 11h3" /></>,
  download: <><path d="M8 3v8M5 8l3 3 3-3" /><path d="M3 13h10" /></>,
  sliders: <><path d="M3 4h6M12 4h1M3 12h1M7 12h6M3 8h2M8 8h5" /><circle cx="10.5" cy="4" r="1.5" /><circle cx="5.5" cy="12" r="1.5" /><circle cx="6.5" cy="8" r="1.5" /></>,
  clock: <><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1.5" /></>,
};
export function Icon({ name, size = 16, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0f2742" />
      <path d="M7 19c3 0 3-7 6-7s3 10 6 10 3-6 6-6" fill="none" stroke="#8fb0f2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- verdicts ---------- */
const V = {
  met: { cls: 'met', label: 'Met', icon: 'check' },
  not_met: { cls: 'notmet', label: 'Not met', icon: 'x' },
  unknown: { cls: 'unknown', label: 'Unknown', icon: 'question' },
} as const;

export function VerdictIcon({ v }: { v: Verdict }) {
  const m = V[v];
  return <span className={`vicon ${m.cls}`} title={m.label}><Icon name={m.icon} size={12} stroke={2} /></span>;
}
export function VerdictChip({ v }: { v: Verdict }) {
  const m = V[v];
  return <span className={`chip ${m.cls}`}><span className="dot" />{m.label}</span>;
}

export function Tally({ r }: { r: Pick<ScreeningResult, 'met' | 'notMet' | 'unknown'> }) {
  return (
    <span className="tally" aria-label={`${r.met} met, ${r.notMet} not met, ${r.unknown} unknown`}>
      <span className="ok" title="Met"><i className="tdot" />{r.met}</span>
      <span className="bad" title="Not met"><i className="tdot" />{r.notMet}</span>
      <span className="warn" title="Unknown"><i className="tdot" />{r.unknown}</span>
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
  const cls = band === 'High' ? 'accent' : band === 'Ineligible' ? 'notmet' : 'ink';
  return <span className={`chip ${cls}`}><span className="dot" />{band}</span>;
}

export function Stats({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <div className="card stats">
      {items.map((s) => (
        <div key={s.label} className="stat">
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
          {s.sub && <div className="stat-sub">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function PageHead({ crumbs, title, sub, right }: { crumbs?: string[]; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {crumbs && <div className="crumbs">{crumbs.map((c, i) => <span key={i}>{i > 0 && <span className="faint" style={{ marginRight: 6 }}>/</span>}{c}</span>)}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right && <div className="actions">{right}</div>}
    </div>
  );
}

export function Panel({ title, sub, right, children, foot, flush, className = '', style }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; foot?: ReactNode; flush?: boolean; className?: string; style?: React.CSSProperties;
}) {
  return (
    <section className={`card ${className}`} style={style}>
      {title && (
        <header className="card-head">
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          {right}
        </header>
      )}
      {flush ? children : <div className="card-pad">{children}</div>}
      {foot && <div className="card-foot">{foot}</div>}
    </section>
  );
}

export function Avatar({ initials, sm }: { initials: string; sm?: boolean }) {
  return <span className={`avatar ${sm ? 'sm' : ''}`}>{initials}</span>;
}
