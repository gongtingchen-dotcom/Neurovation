import { useEffect, useState } from 'react';
import { Icon } from './components/ui';
import type { Role } from './engine/types';
import { Assistant } from './pages/Assistant';
import { Audit } from './pages/Audit';
import { Dashboard } from './pages/Dashboard';
import { Participants } from './pages/Participants';
import { ProtocolPage } from './pages/Protocol';
import { Screening } from './pages/Screening';
import { Validation } from './pages/Validation';
import { StoreProvider, useStore } from './state/store';

const NAV = [
  { section: 'Study' },
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'protocol', label: 'Protocol & criteria', icon: 'protocol' },
  { id: 'screening', label: 'Screening queue', icon: 'screen' },
  { id: 'participants', label: 'Participants & consent', icon: 'people' },
  { id: 'assistant', label: 'Study assistant', icon: 'chat' },
  { section: 'Evidence' },
  { id: 'validation', label: 'Validation', icon: 'chart' },
  { id: 'audit', label: 'Audit trail', icon: 'log' },
] as const;

const ROLES: Role[] = ['Research officer', 'Principal investigator', 'Data custodian'];

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
  const { protocols, protocol, setProtocolId, role, setRole } = useStore();
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Main">
        <div className="brand">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="8" fill="#1f4466" /><path d="M7 19c3 0 3-7 6-7s3 10 6 10 3-6 6-6" fill="none" stroke="#7FC4C9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div><div className="brand-name">Neurovation</div><div className="brand-sub">Trial recruitment co-pilot</div></div>
        </div>
        {NAV.map((n, i) => 'section' in n
          ? <div key={i} className="nav-section">{n.section}</div>
          : <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => go(n.id)}><Icon name={n.icon} />{n.label}</button>)}
        <div className="sidebar-foot">Research prototype v0.1<br />Synthetic data only. Not for clinical use.</div>
      </nav>
      <div className="main">
        <header className="topbar">
          <label className="row small">
            <span className="muted">Protocol</span>
            <select className="select" value={protocol.id} onChange={(e) => setProtocolId(e.target.value)}>
              {protocols.map((p) => <option key={p.id} value={p.id}>{p.shortName}{p.illustrative ? ' (illustrative)' : ''}</option>)}
            </select>
          </label>
          <div className="spacer" />
          <span className="synthetic-pill">Synthetic data</span>
          <label className="row small">
            <span className="muted">Signed in as</span>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </header>
        <main className="content">
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
