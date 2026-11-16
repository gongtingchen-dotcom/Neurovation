import { useEffect, useState } from 'react';
import { Avatar, Icon, Logo } from './components/ui';
import type { Role } from './engine/types';
import { Assistant } from './pages/Assistant';
import { Audit } from './pages/Audit';
import { Dashboard } from './pages/Dashboard';
import { Participants } from './pages/Participants';
import { ProtocolPage } from './pages/Protocol';
import { Screening } from './pages/Screening';
import { Validation } from './pages/Validation';
import { StoreProvider, useStore } from './state/store';

const ROLES: { role: Role; initials: string; name: string }[] = [
  { role: 'Research officer', initials: 'MT', name: 'M. Tan' },
  { role: 'Principal investigator', initials: 'LC', name: 'Dr L. Chua' },
  { role: 'Data custodian', initials: 'DO', name: 'Data Office' },
];

function useHashPage() {
  const read = () => window.location.hash.replace('#/', '') || 'overview';
  const [page, setPage] = useState(read);
  useEffect(() => {
    const on = () => setPage(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [page, (p: string) => { window.location.hash = `/${p}`; }] as const;
}

function Shell() {
  const [page, go] = useHashPage();
  const { protocols, protocol, setProtocolId, role, setRole, screening, stageOf, patients, decisions, setSelectedId, audit } = useStore();
  const [q, setQ] = useState('');
  const me = ROLES.find((r) => r.role === role)!;
  const enrolled = patients.filter((p) => stageOf(p) === 'Enrolled').length;
  const queue = screening.filter((r) => r.score > 0 && !decisions[`${protocol.id}:${r.patientId}`] && stageOf(patients.find((p) => p.id === r.patientId)!) === 'Pre-screened').length;
  const recruiting = protocol.id === 'dstn-apathy';

  const nav: ({ group: string } | { id: string; label: string; icon: string; count?: number })[] = [
    { group: 'Study' },
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'protocol', label: 'Eligibility criteria', icon: 'protocol', count: protocol.criteria.filter((c) => c.enabled).length },
    { id: 'screening', label: 'Pre-screening', icon: 'screen', count: queue },
    { id: 'participants', label: 'Participants', icon: 'people' },
    { id: 'assistant', label: 'Study assistant', icon: 'chat' },
    { group: 'Quality' },
    { id: 'validation', label: 'Validation', icon: 'chart' },
    { id: 'audit', label: 'Audit trail', icon: 'log', count: audit.length },
  ];

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const id = q.trim().toUpperCase().replace(/^(PT)?-?/, 'PT-');
    if (screening.some((r) => r.patientId === id)) { setSelectedId(id); go('screening'); setQ(''); }
  };

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Main">
        <div className="side-top">
          <div className="brand"><Logo /><span className="brand-name">Neurovation</span><span className="env-tag">SANDBOX</span></div>
          <div className="study-switch">
            <div className="label">Study</div>
            <div className="name">{protocol.shortName}</div>
            <div className="meta"><span className={`status-dot ${recruiting ? '' : 'idle'}`} />{recruiting ? `Recruiting · ${enrolled}/${protocol.targetEnrolment}` : 'Feasibility'}</div>
            <span className="chev"><Icon name="chevrons" size={14} /></span>
            <select aria-label="Switch study" value={protocol.id} onChange={(e) => setProtocolId(e.target.value)}>
              {protocols.map((p) => <option key={p.id} value={p.id}>{p.shortName}{p.illustrative ? ' (illustrative)' : ''}</option>)}
            </select>
          </div>
          <form className="search" onSubmit={search}>
            <Icon name="search" size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Go to study ID…" aria-label="Go to study ID" />
            <span className="kbd">↵</span>
          </form>
        </div>
        <nav className="nav">
          {nav.map((n, i) => 'group' in n
            ? <div key={i} className="nav-group">{n.group}</div>
            : (
              <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => go(n.id)}>
                <Icon name={n.icon} />{n.label}
                {n.count !== undefined && n.count > 0 && <span className="nav-count">{n.count}</span>}
              </button>
            ))}
        </nav>
        <div className="side-foot" title="Switch role (demo)">
          <Avatar initials={me.initials} />
          <div style={{ minWidth: 0 }}>
            <div className="strong small">{me.name}</div>
            <div className="tiny muted">{role}</div>
          </div>
          <span className="faint" style={{ marginLeft: 'auto' }}><Icon name="chevrons" size={14} /></span>
          <select aria-label="Switch role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => <option key={r.role} value={r.role}>{r.name} · {r.role}</option>)}
          </select>
        </div>
      </aside>
      <div className="main">
        <main className="page">
          {page === 'overview' && <Dashboard go={go} />}
          {page === 'protocol' && <ProtocolPage />}
          {page === 'screening' && <Screening />}
          {page === 'participants' && <Participants />}
          {page === 'assistant' && <Assistant />}
          {page === 'validation' && <Validation />}
          {page === 'audit' && <Audit />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
