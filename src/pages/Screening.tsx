import { useMemo, useState } from 'react';
import { BandChip, Icon, PageHead, ScoreBar, Tally, VerdictChip, VerdictDot } from '../components/ui';
import type { ScreeningResult } from '../engine/types';
import { useStore } from '../state/store';

type Filter = 'All' | 'High' | 'Medium' | 'Low' | 'Ineligible';

export function Screening() {
  const { screening, protocol, byId, decisions, decide, stageOf, priors, role } = useStore();
  const [filter, setFilter] = useState<Filter>('All');
  const [hideActioned, setHideActioned] = useState(true);
  const [selected, setSelected] = useState<string | null>(screening[0]?.patientId ?? null);
  const [note, setNote] = useState('');

  const rows = useMemo(() => screening.filter((r) => {
    if (filter !== 'All' && r.band !== filter) return false;
    if (hideActioned && stageOf(byId.get(r.patientId)!) !== 'Pre-screened') return false;
    return true;
  }), [screening, filter, hideActioned, stageOf, byId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { High: 0, Medium: 0, Low: 0, Ineligible: 0 };
    screening.forEach((r) => c[r.band]++);
    return c;
  }, [screening]);

  const sel = selected ? screening.find((r) => r.patientId === selected) : undefined;
  const patient = sel ? byId.get(sel.patientId) : undefined;
  const decision = sel ? decisions[`${protocol.id}:${sel.patientId}`] : undefined;
  const canApprove = role === 'Principal investigator';

  return (
    <>
      <PageHead
        title="Screening queue"
        sub="Patients ranked by the probability of meeting every criterion, given what is documented. Open a patient to see the evidence behind each criterion. Only the principal investigator can approve contact."
      />

      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <div className="tabs" role="tablist">
          {(['All', 'High', 'Medium', 'Low', 'Ineligible'] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}{f !== 'All' && <span className="faint"> {counts[f]}</span>}
            </button>
          ))}
        </div>
        <label className="row small muted" style={{ gap: 6 }}>
          <input type="checkbox" checked={hideActioned} onChange={(e) => setHideActioned(e.target.checked)} />
          Hide patients already approved, consented or enrolled
        </label>
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="card table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th><th>Study ID</th><th>Match score</th><th>Band</th>
                <th title="Met / not met / unknown">Criteria</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map((r) => {
                const d = decisions[`${protocol.id}:${r.patientId}`];
                return (
                  <tr key={r.patientId} className={`clickable ${selected === r.patientId ? 'selected' : ''}`} onClick={() => { setSelected(r.patientId); setNote(''); }}>
                    <td className="faint">{screening.indexOf(r) + 1}</td>
                    <td className="mono">{r.patientId}</td>
                    <td><ScoreBar score={r.score} /></td>
                    <td><BandChip band={r.band} /></td>
                    <td><Tally r={r} /></td>
                    <td>{d ? <DecisionChip action={d.action} /> : <span className="small muted">{nextStep(r)}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="card-pad muted">No patients match this filter.</div>}
        </div>

        {sel && patient && (
          <div className="card drawer">
            <div className="card-pad stack" style={{ gap: 14 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 500 }}>{sel.patientId}</div>
                  <div className="small muted">{patient.site} · stage: {stageOf(patient)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>{sel.score.toFixed(2)}</div>
                  <BandChip band={sel.band} />
                </div>
              </div>

              <ScoreExplainer r={sel} priors={priors} />

              <div>
                {sel.results.map((res) => {
                  const c = protocol.criteria.find((x) => x.id === res.criterionId)!;
                  return (
                    <div key={res.criterionId} className="crit">
                      <VerdictDot v={res.verdict} />
                      <div>
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <span className="crit-title">{c.id} · {c.label}</span>
                          <VerdictChip v={res.verdict} />
                        </div>
                        <div className="crit-reason">{res.reason}</div>
                        {res.evidence && (
                          <div className="evidence">
                            <q>{res.evidence.quote}</q>
                            <div className="src">{res.evidence.source} · {res.evidence.date}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="divider" />
              {decision ? (
                <div className="callout">
                  <Icon name="shield" />
                  <span><b>{labelFor(decision.action)}</b> by {decision.by} at {new Date(decision.at).toLocaleTimeString()}{decision.note && <> · “{decision.note}”</>}</span>
                </div>
              ) : (
                <div className="stack">
                  <input className="input" placeholder="Note for the audit log (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="row wrap">
                    <button className="btn primary" disabled={!canApprove || sel.score === 0} onClick={() => decide({ patientId: sel.patientId, action: 'approve', note })} title={canApprove ? '' : 'Switch role to Principal investigator to approve'}>
                      <Icon name="check" />Approve for contact
                    </button>
                    <button className="btn" onClick={() => decide({ patientId: sel.patientId, action: 'request_info', note })}><Icon name="question" />Request information</button>
                    <button className="btn danger" onClick={() => decide({ patientId: sel.patientId, action: 'reject', note })}><Icon name="x" />Not eligible</button>
                  </div>
                  {!canApprove && <p className="tiny muted">You are signed in as {role}. Approval needs the principal investigator. Switch roles at the top right.</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ScoreExplainer({ r, priors }: { r: ScreeningResult; priors: Record<string, number> }) {
  const unknowns = r.results.filter((x) => x.verdict === 'unknown');
  if (r.notMet > 0) return <div className="callout warn"><Icon name="info" /><span>At least one criterion is not met, so the score is 0. Check the evidence before you mark this patient not eligible.</span></div>;
  if (!unknowns.length) return <div className="callout"><Icon name="info" /><span>Every criterion is met from the records.</span></div>;
  return (
    <div className="callout">
      <Icon name="info" />
      <span>
        Score = product of the priors for the unknown criteria:{' '}
        <span className="mono">{unknowns.map((u) => `${u.criterionId} ${priors[u.criterionId].toFixed(2)}`).join(' × ')}</span>{' '}
        = <b>{r.score.toFixed(2)}</b>. Resolve the unknown criteria to raise confidence.
      </span>
    </div>
  );
}

const labelFor = (a: string) => ({ approve: 'Approved for contact', reject: 'Marked not eligible', request_info: 'Information requested' } as Record<string, string>)[a];
function DecisionChip({ action }: { action: string }) {
  const cls = action === 'approve' ? 'met' : action === 'reject' ? 'notmet' : 'unknown';
  return <span className={`chip ${cls}`}>{labelFor(action)}</span>;
}
function nextStep(r: ScreeningResult) {
  if (r.notMet > 0) return 'Confirm exclusion';
  const assessable = r.results.filter((x) => x.verdict === 'unknown' && x.criterionId !== 'E5').length;
  if (assessable === 0) return 'Ready for PI review';
  return `Resolve ${assessable} unknown`;
}
