import { useEffect, useMemo, useState } from 'react';
import { BandChip, Icon, PageHead, ScoreBar, Tally, VerdictChip, VerdictIcon } from '../components/ui';
import { assigneeOf, documentsFor, recordSize, SYSTEMS } from '../data/sources';
import { EVALUATOR_FIELDS } from '../engine/evaluators';
import type { Patient, Protocol, ScreeningResult } from '../engine/types';
import { useStore } from '../state/store';

type Filter = 'All' | 'High' | 'Medium' | 'Low' | 'Ineligible';
type Tab = 'eligibility' | 'sources' | 'activity';

const SYSTEM_ICON: Record<string, string> = {
  'Free-text note': 'file', 'Scanned PDF': 'scan', 'External system': 'device', 'Structured field': 'database', Paper: 'paper',
};

export function Screening() {
  const { screening, protocol, protocols, portfolio, setProtocolId, byId, decisions, decide, stageOf, priors, role, audit, selectedId, setSelectedId } = useStore();
  const [filter, setFilter] = useState<Filter>('All');
  const [hideActioned, setHideActioned] = useState(true);
  const [tab, setTab] = useState<Tab>('eligibility');
  const [note, setNote] = useState('');

  const rows = useMemo(() => screening.filter((r) => {
    if (filter !== 'All' && r.band !== filter) return false;
    if (hideActioned && stageOf(byId.get(r.patientId)!) !== 'Pre-screened' && r.patientId !== selectedId) return false;
    return true;
  }), [screening, filter, hideActioned, stageOf, byId, selectedId]);

  useEffect(() => { if (!selectedId && rows[0]) setSelectedId(rows[0].patientId); }, [selectedId, rows, setSelectedId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: screening.length, High: 0, Medium: 0, Low: 0, Ineligible: 0 };
    screening.forEach((r) => c[r.band]++);
    return c;
  }, [screening]);

  const sel = selectedId ? screening.find((r) => r.patientId === selectedId) : undefined;
  const patient = sel ? byId.get(sel.patientId) : undefined;
  const decision = sel ? decisions[`${protocol.id}:${sel.patientId}`] : undefined;
  const canApprove = role === 'Principal investigator';
  const consentIds = new Set(protocol.criteria.filter((c) => c.evaluator === 'consentObtainable').map((c) => c.id));

  return (
    <>
      <PageHead
        crumbs={[protocol.shortName, 'Pre-screening']}
        title="Pre-screening queue"
        sub="Patients ranked by the probability of meeting every criterion, given what is documented. Each verdict links to the sentence it came from. Only the principal investigator can approve contact."
      />

      <div className="row wrap between">
        <div className="tabs" role="tablist">
          {(['All', 'High', 'Medium', 'Low', 'Ineligible'] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f} <span className="faint" style={{ fontWeight: 500 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="row small muted">
          <input type="checkbox" checked={hideActioned} onChange={(e) => setHideActioned(e.target.checked)} />
          Hide patients already approved or enrolled
        </label>
      </div>

      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="table-scroll" style={{ borderRadius: 'var(--r-lg)' }}>
            <table className="table">
              <thead>
                <tr><th style={{ width: 48 }}>#</th><th>Study ID</th><th>Match score</th><th>Band</th><th>Criteria</th><th>Next step</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 150).map((r) => {
                  const d = decisions[`${protocol.id}:${r.patientId}`];
                  return (
                    <tr key={r.patientId} className={`clickable ${selectedId === r.patientId ? 'selected' : ''}`} onClick={() => { setSelectedId(r.patientId); setNote(''); }}>
                      <td className="faint num">{screening.indexOf(r) + 1}</td>
                      <td className="mono id">{r.patientId}</td>
                      <td><ScoreBar score={r.score} /></td>
                      <td><BandChip band={r.band} /></td>
                      <td><Tally r={r} /></td>
                      <td className="nowrap">{d ? <DecisionChip action={d.action} /> : <span className="small">{nextStep(r, consentIds)}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="card-pad muted">No patients match this filter.</div>}
          </div>
        </section>

        {sel && patient && (
          <section className="card pane">
            <div className="pane-head">
              <div className="row between">
                <span className="mono" style={{ fontSize: 16, color: 'var(--text-1)', fontWeight: 600 }}>{sel.patientId}</span>
                <BandChip band={sel.band} />
              </div>
              <div className="small muted">{patient.site} · {stageOf(patient)} · owner {assigneeOf(patient).name}</div>
            </div>
            <div className="kv">
              <div>Match score<b>{sel.score.toFixed(2)}</b></div>
              <div>Criteria met<b>{sel.met} of {sel.results.length}</b></div>
              <div>Record size<b>{recordSize(patient)} docs</b></div>
            </div>
            <div className="utabs">
              <button className={`utab ${tab === 'eligibility' ? 'active' : ''}`} onClick={() => setTab('eligibility')}>Eligibility</button>
              <button className={`utab ${tab === 'sources' ? 'active' : ''}`} onClick={() => setTab('sources')}>Source documents</button>
              <button className={`utab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>Activity</button>
            </div>
            <div className="pane-body">
              {tab === 'eligibility' && (
                <>
                  <div style={{ padding: '14px 20px 0' }}><ScoreExplainer r={sel} priors={priors} /></div>
                  {sel.results.map((res) => {
                    const c = protocol.criteria.find((x) => x.id === res.criterionId)!;
                    return (
                      <div key={res.criterionId} className="crit">
                        <VerdictIcon v={res.verdict} />
                        <div>
                          <div className="row between" style={{ alignItems: 'flex-start' }}>
                            <span className="crit-title"><span className="mono faint" style={{ marginRight: 6 }}>{c.id}</span>{c.label}</span>
                            <VerdictChip v={res.verdict} />
                          </div>
                          <div className="crit-reason">{res.reason}</div>
                          {res.evidence && (
                            <div className="evidence">
                              “{res.evidence.quote}”
                              <div className="src"><Icon name="file" size={12} />{res.evidence.source} · {res.evidence.date}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {tab === 'eligibility' && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <div style={{ padding: '14px 20px 6px' }} className="strong small">Other trials for this patient</div>
                  {protocols.filter((pr) => pr.id !== protocol.id).map((pr) => {
                    const o = portfolio[pr.id].get(sel.patientId)!;
                    return (
                      <button key={pr.id} className="list-row" onClick={() => setProtocolId(pr.id)}>
                        <span><span className="small">{pr.shortName}</span><div className="tiny muted">{o.met} met · {o.notMet} not met · {o.unknown} unknown</div></span>
                        <span className="row"><span className="mono small">{o.score.toFixed(2)}</span><BandChip band={o.band} /></span>
                      </button>
                    );
                  })}
                </div>
              )}
              {tab === 'sources' && <Sources patient={patient} protocol={protocol} />}
              {tab === 'activity' && (
                <div>
                  {audit.filter((a) => a.detail.includes(sel.patientId)).map((a, i) => (
                    <div key={i} className="list-row"><span><b className="strong">{a.action}</b> <span className="muted">by {a.role}</span><div className="tiny muted">{a.detail}</div></span><span className="tiny faint nowrap">{new Date(a.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  ))}
                  <div className="list-row"><span><b className="strong">Screened by AI</b> <span className="muted">· engine v0.1</span><div className="tiny muted">{sel.met} met, {sel.notMet} not met, {sel.unknown} unknown</div></span><span className="tiny faint">today</span></div>
                </div>
              )}
            </div>
            <div className="decision">
              {decision ? (
                <div className="callout"><Icon name="shield" /><span><b>{labelFor(decision.action)}</b> by {decision.by} at {new Date(decision.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}{decision.note && <> · “{decision.note}”</>}</span></div>
              ) : (
                <>
                  <input className="input" placeholder="Note for the audit trail (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="row wrap">
                    <button className="btn primary" disabled={!canApprove || sel.score === 0} onClick={() => decide({ patientId: sel.patientId, action: 'approve', note })} title={canApprove ? '' : 'Switch role to Principal investigator to approve'}>
                      <Icon name="check" />Approve for contact
                    </button>
                    <button className="btn" onClick={() => decide({ patientId: sel.patientId, action: 'request_info', note })}>Request information</button>
                    <button className="btn danger" onClick={() => decide({ patientId: sel.patientId, action: 'reject', note })}>Not eligible</button>
                  </div>
                  {!canApprove && <p className="tiny muted">Signed in as {role}. Approval needs the principal investigator (switch role at the bottom left).</p>}
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function Sources({ patient, protocol }: { patient: Patient; protocol: Protocol }) {
  const fields = [...new Set(protocol.criteria.filter((c) => c.enabled).flatMap((c) => EVALUATOR_FIELDS[c.evaluator] ?? []))];
  const docs = documentsFor(patient, fields);
  const systems = new Set(docs.map((d) => d.system.id));
  const missing = fields.filter((f) => !patient.documented[f]).length;
  return (
    <div>
      <div style={{ padding: '14px 20px' }}>
        <div className="callout">
          <Icon name="info" />
          <span>
            To pre-screen this patient by hand, a coordinator searches <b>{recordSize(patient)} documents</b> to find the <b>{docs.length}</b> that matter. These sit in <b>{systems.size} separate systems</b>, and most are free text or scanned PDFs that the electronic medical record (EMR) search cannot query.
            {missing > 0 && <> {missing} required item{missing > 1 ? 's were' : ' was'} not found anywhere.</>}
          </span>
        </div>
      </div>
      {docs.map((d, i) => (
        <div key={i} className="doc">
          <span className="doc-icon"><Icon name={SYSTEM_ICON[d.system.format]} /></span>
          <div style={{ minWidth: 0 }}>
            <div className="row between"><span className="strong small">{d.title}</span><span className="tiny faint nowrap">{d.date}</span></div>
            <div className="row" style={{ gap: 6, margin: '4px 0 6px' }}>
              <span className="chip ink">{d.system.name}</span>
              <span className={`chip ${d.system.searchable ? 'met' : 'unknown'}`}>{d.system.format}</span>
            </div>
            <div className="small" style={{ color: 'var(--text-2)' }}>“{d.quote}”</div>
          </div>
        </div>
      ))}
      <div className="card-foot">Systems checked: {Object.values(SYSTEMS).map((s) => s.name).join(' · ')}</div>
    </div>
  );
}

function ScoreExplainer({ r, priors }: { r: ScreeningResult; priors: Record<string, number> }) {
  const unknowns = r.results.filter((x) => x.verdict === 'unknown');
  if (r.notMet > 0) return <div className="callout warn"><Icon name="info" /><span>At least one criterion is not met, so the score is 0. Check the evidence before marking the patient not eligible.</span></div>;
  if (!unknowns.length) return <div className="callout"><Icon name="info" /><span>Every criterion is met from the records.</span></div>;
  return (
    <div className="callout">
      <Icon name="info" />
      <span>
        Score = product of priors for unknown criteria:{' '}
        <span className="mono">{unknowns.map((u) => `${u.criterionId} ${priors[u.criterionId].toFixed(2)}`).join(' × ')}</span> = <b>{r.score.toFixed(2)}</b>
      </span>
    </div>
  );
}

const labelFor = (a: string) => ({ approve: 'Approved for contact', reject: 'Marked not eligible', request_info: 'Information requested' } as Record<string, string>)[a];
function DecisionChip({ action }: { action: string }) {
  const cls = action === 'approve' ? 'met' : action === 'reject' ? 'notmet' : 'unknown';
  return <span className={`chip ${cls}`}><span className="dot" />{labelFor(action)}</span>;
}
function nextStep(r: ScreeningResult, consentIds: Set<string>) {
  if (r.notMet > 0) return 'Confirm exclusion';
  const assessable = r.results.filter((x) => x.verdict === 'unknown' && !consentIds.has(x.criterionId)).length;
  if (assessable === 0) return 'Ready for PI review';
  return `Resolve ${assessable} unknown`;
}
