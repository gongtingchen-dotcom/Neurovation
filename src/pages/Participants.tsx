import { useState } from 'react';
import { Avatar, Icon, PageHead, Panel, Stats } from '../components/ui';
import { assigneeOf } from '../data/sources';
import { TODAY, daysBetween } from '../engine/evaluators';
import { useStore } from '../state/store';

const QUESTIONS = [
  'Taking part means your stimulator settings will change for one month at a time.',
  'You can stop taking part at any time without it affecting your usual care.',
  'Neither you nor the person rating your apathy will know which setting is active.',
  'Your data is stored under a study ID, not your name.',
  'If you notice a change in mood, you should contact the study team the same day.',
];

export function Participants() {
  const { patients, stageOf, role, log, protocol } = useStore();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const rows = patients.filter((p) => ['Approved for contact', 'Consented', 'Enrolled'].includes(stageOf(p)))
    .sort((a, b) => (b.consent.invitedOn ?? '').localeCompare(a.consent.invitedOn ?? ''));

  const reveal = (id: string) => {
    if (role !== 'Data custodian') return;
    setRevealed((r) => ({ ...r, [id]: true }));
    log('Identity vault access', `Resolved ${id} → vault key (reason: scheduling consent visit)`);
  };

  if (protocol.id !== 'dstn-apathy')
    return <><PageHead crumbs={[protocol.shortName, 'Participants']} title="Participants" /><section className="card card-pad muted">This study is in feasibility assessment. Switch to the recruiting study to see participants.</section></>;

  const signed = rows.filter((p) => p.consent.signedOn);
  const avgComp = signed.length ? signed.reduce((a, p) => a + (p.consent.comprehension ?? 0), 0) / signed.length : 0;
  const waiting = rows.filter((p) => !p.consent.signedOn);
  const medianDays = (() => { const d = signed.map((p) => daysBetween(p.consent.invitedOn!, p.consent.signedOn!)).sort((a, b) => a - b); return d.length ? d[Math.floor(d.length / 2)] : 0; })();

  return (
    <>
      <PageHead
        crumbs={[protocol.shortName, 'Participants']}
        title="Participants & consent"
        sub="eConsent, comprehension checks and onboarding, by study ID only. The identity vault is a separate store: only a data custodian can open it, and every look-up is logged."
      />
      <Stats items={[
        { label: 'Invited', value: rows.length },
        { label: 'Awaiting signature', value: waiting.length, sub: `${waiting.filter((p) => daysBetween(p.consent.invitedOn!, TODAY) > 7).length} over 7 days` },
        { label: 'Median invite → signature', value: <>{medianDays}<small> days</small></> },
        { label: 'Mean comprehension score', value: <>{avgComp.toFixed(1)}<small> / 5</small></> },
      ]} />

      <Panel title="Consent register" sub="Most recent invitations first" flush>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Study ID</th><th>Stage</th><th>Consent form</th><th>Invited</th><th>Signed</th><th className="num">Comprehension</th><th>Baseline surveys</th><th>Owner</th><th>Identity</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stageOf(p);
                const wait = p.consent.invitedOn && !p.consent.signedOn ? daysBetween(p.consent.invitedOn, TODAY) : null;
                return (
                  <tr key={p.id}>
                    <td className="mono id">{p.id}</td>
                    <td><span className={`chip ${st === 'Enrolled' ? 'met' : st === 'Consented' ? 'accent' : 'ink'}`}><span className="dot" />{st}</span></td>
                    <td>{p.consent.formVersion === 'v2.1' ? <span className="chip ink">v2.1 · current</span> : <span className="chip unknown">v2.0 · re-consent</span>}</td>
                    <td className="small">{p.consent.invitedOn ?? '—'}</td>
                    <td className="small">{p.consent.signedOn ?? (wait !== null ? <span className={`chip ${wait > 7 ? 'notmet' : 'unknown'}`}>Waiting {wait} d</span> : '—')}</td>
                    <td className="num">{p.consent.comprehension !== undefined ? (p.consent.comprehension < 4 ? <span className="chip unknown">{p.consent.comprehension}/5 · call back</span> : `${p.consent.comprehension}/5`) : '—'}</td>
                    <td>{p.consent.surveysComplete === undefined ? '—' : p.consent.surveysComplete ? <span className="chip met">Complete</span> : <span className="chip unknown">Pending</span>}</td>
                    <td><Avatar sm initials={assigneeOf(p).initials} /></td>
                    <td className="nowrap">
                      {revealed[p.id] ? <span className="mono small">{p.vaultKey}</span> : (
                        <button className="btn ghost sm" disabled={role !== 'Data custodian'} onClick={() => reveal(p.id)} title={role === 'Data custodian' ? 'Resolve identity (logged)' : 'Only a data custodian can open the vault'}>
                          <Icon name="lock" size={14} />{role === 'Data custodian' ? 'Resolve' : 'Locked'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid g-2" style={{ alignItems: 'start' }}>
        <Panel title="Comprehension check" sub="Consent form v2.1 · answered True / False before signing" flush foot="A score below 4 of 5 triggers a call-back to explain again before signature.">
          {QUESTIONS.map((q, i) => (
            <div key={i} className="list-row" style={{ justifyContent: 'flex-start', gap: 14 }}>
              <span className="mono faint">{String(i + 1).padStart(2, '0')}</span><span>{q}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Pseudonymisation model" foot="Designed with Singapore’s HBRA and PDPA in mind. Not yet reviewed by an IRB.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
            <div className="card card-pad" style={{ boxShadow: 'none' }}><div className="row strong small"><Icon name="database" size={14} />Study database</div><div className="muted tiny" style={{ marginTop: 4 }}>Study ID, criteria, scales, consent status</div></div>
            <span className="faint"><Icon name="arrow" /></span>
            <div className="card card-pad" style={{ boxShadow: 'none', background: 'var(--subtle)' }}><div className="row strong small"><Icon name="lock" size={14} />Identity vault</div><div className="muted tiny" style={{ marginTop: 4 }}>Study ID ↔ MRN. Separate store, separate key.</div></div>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>The analysis team and the study assistant only ever see study IDs.</p>
        </Panel>
      </div>
    </>
  );
}
