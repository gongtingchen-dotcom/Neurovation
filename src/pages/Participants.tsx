import { useState } from 'react';
import { Icon, PageHead } from '../components/ui';
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
    .sort((a, b) => (a.consent.invitedOn ?? '').localeCompare(b.consent.invitedOn ?? '')).reverse();

  const reveal = (id: string) => {
    if (role !== 'Data custodian') return;
    setRevealed((r) => ({ ...r, [id]: true }));
    log('Identity vault access', `Resolved ${id} → vault key (reason: scheduling consent visit)`);
  };

  if (protocol.id !== 'dstn-apathy')
    return <><PageHead title="Participants & consent" /><div className="card card-pad muted">This protocol is in feasibility assessment. Switch to the recruiting protocol to see participants.</div></>;

  return (
    <>
      <PageHead
        title="Participants & consent"
        sub="eConsent status, comprehension checks and onboarding, by study ID only. The identity vault is a separate store. Only a data custodian can open it, and every look-up is logged."
      />
      <div className="stack" style={{ gap: 20 }}>
        <div className="card table-scroll">
          <table className="table">
            <thead>
              <tr><th>Study ID</th><th>Stage</th><th>Form</th><th>Invited</th><th>Signed</th><th className="num">Comprehension</th><th>Surveys</th><th>Identity vault</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stageOf(p);
                const wait = p.consent.invitedOn && !p.consent.signedOn ? daysBetween(p.consent.invitedOn, TODAY) : null;
                return (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td><span className={`chip ${st === 'Enrolled' ? 'met' : st === 'Consented' ? 'accent' : ''}`}>{st}</span></td>
                    <td>
                      <span className={`chip ${p.consent.formVersion === 'v2.1' ? '' : 'unknown'}`} title={p.consent.formVersion === 'v2.1' ? 'Current version' : 'Superseded: re-consent required'}>{p.consent.formVersion ?? '—'}</span>
                    </td>
                    <td className="small">{p.consent.invitedOn ?? <span className="faint">not yet</span>}</td>
                    <td className="small">
                      {p.consent.signedOn ?? (wait !== null ? <span className={`chip ${wait > 7 ? 'notmet' : 'unknown'}`}>waiting {wait} d</span> : '—')}
                    </td>
                    <td className="num">{p.consent.comprehension !== undefined ? <span className={p.consent.comprehension < 4 ? 'chip unknown' : ''}>{p.consent.comprehension}/5</span> : '—'}</td>
                    <td>{p.consent.surveysComplete === undefined ? '—' : p.consent.surveysComplete ? <span className="chip met">Complete</span> : <span className="chip unknown">Pending</span>}</td>
                    <td>
                      {revealed[p.id] ? <span className="mono small">{p.vaultKey}</span> : (
                        <button className="btn ghost small" disabled={role !== 'Data custodian'} onClick={() => reveal(p.id)} title={role === 'Data custodian' ? 'Resolve identity (logged)' : 'Only a data custodian can open the vault'}>
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

        <div className="grid g-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h2>eConsent comprehension check</h2><p>Form v2.1</p></div>
            <div className="card-pad stack">
              <p className="small muted">The participant answers each statement True or False before signing. A score below 4 of 5 triggers a call-back from the study team to explain again before signature.</p>
              {QUESTIONS.map((q, i) => (
                <div key={i} className="row small" style={{ alignItems: 'flex-start' }}>
                  <span className="chip ink" style={{ minWidth: 22, justifyContent: 'center' }}>{i + 1}</span><span>{q}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-pad stack">
            <h2>Pseudonymisation model</h2>
            <div className="small" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
              <div className="card card-pad" style={{ boxShadow: 'none' }}><b>Study database</b><div className="muted tiny">Study ID, criteria, scales, consent status</div></div>
              <Icon name="arrow" />
              <div className="card card-pad" style={{ boxShadow: 'none', background: 'var(--surface-2)' }}><b className="row" style={{ gap: 6 }}><Icon name="lock" size={14} />Identity vault</b><div className="muted tiny">Study ID ↔ MRN. Separate store, separate key.</div></div>
            </div>
            <p className="tiny muted">The analysis team and the assistant only ever see study IDs. Designed with Singapore’s HBRA and PDPA in mind. Not yet reviewed by an IRB.</p>
          </div>
        </div>
      </div>
    </>
  );
}
