import { useState } from 'react';
import { Icon, PageHead, Panel, Switch } from '../components/ui';
import { SAMPLE_PROTOCOL_TEXT, extractCriteria, type DraftCriterion } from '../engine/extract';
import { useStore } from '../state/store';

const SOURCE_CLS: Record<string, string> = { EHR: 'ink', 'Device report': 'accent', 'Requires contact': 'unknown' };

export function ProtocolPage() {
  const { protocol, updateCriterion, resetProtocol, priors, log } = useStore();
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<DraftCriterion[] | null>(null);
  const inc = protocol.criteria.filter((c) => c.kind === 'inclusion');
  const exc = protocol.criteria.filter((c) => c.kind === 'exclusion');

  const run = () => {
    const d = extractCriteria(text || SAMPLE_PROTOCOL_TEXT);
    if (!text) setText(SAMPLE_PROTOCOL_TEXT);
    setDrafts(d);
    log('Extracted criteria', `${d.length} draft criteria from pasted protocol text`);
  };
  const onFile = async (f: File) => {
    if (f.type === 'application/pdf') { setText('PDF parsing runs server-side in the full system. For this prototype, paste the eligibility section as text.'); return; }
    setText(await f.text());
  };

  const table = (rows: typeof protocol.criteria, title: string) => (
    <Panel title={title} sub={`${rows.length} criteria`} flush>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 56 }}>ID</th><th>Criterion · protocol wording</th><th>Type</th><th>Evidence from</th><th>Parameters</th>
            <th className="num" title="Probability the criterion is met when it cannot be assessed (estimated from the cohort)">Prior if unknown</th><th style={{ width: 64 }}>Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} style={{ opacity: c.enabled ? 1 : 0.5 }}>
              <td className="mono id">{c.id}</td>
              <td style={{ maxWidth: 460 }}>
                <div className="strong">{c.label}</div>
                <div className="small muted" style={{ marginTop: 2 }}>“{c.sourceText}”{c.paraphrased && <span className="faint"> · paraphrased</span>}</div>
                {c.siteRule && <div className="tiny" style={{ color: 'var(--warn)', marginTop: 4 }}>Site rule · {c.siteRule}</div>}
              </td>
              <td><span className="chip ink">{c.category}</span></td>
              <td><span className={`chip ${SOURCE_CLS[c.evidenceSource]}`}>{c.evidenceSource}</span></td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  {c.params.map((p) => (
                    <label key={p.key} className="row small">
                      <span className="muted" style={{ minWidth: 128 }}>{p.label}</span>
                      <input className="input num" type="number" value={p.value}
                        onChange={(e) => e.target.value !== '' && updateCriterion(c.id, { param: { key: p.key, value: Number(e.target.value) } })} />
                      {p.unit && <span className="faint tiny">{p.unit}</span>}
                    </label>
                  ))}
                  {!c.params.length && <span className="faint small">—</span>}
                </div>
              </td>
              <td className="num">{(priors[c.id] ?? 0).toFixed(2)}{c.fixedPrior !== undefined && <div className="tiny faint">fixed</div>}</td>
              <td><Switch on={c.enabled} onChange={(v) => updateCriterion(c.id, { enabled: v })} label={`Toggle ${c.id}`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );

  return (
    <>
      <PageHead
        crumbs={[protocol.shortName, 'Eligibility criteria']}
        title="Eligibility criteria"
        sub="The protocol as a structured checklist. Each rule keeps its protocol wording, the system its evidence comes from and any data-freshness window. Editing a threshold re-ranks the queue straight away."
        right={<button className="btn" onClick={resetProtocol}>Reset to protocol</button>}
      />

      <section className="card card-pad row wrap between">
        <div className="stack" style={{ gap: 2 }}>
          <div className="strong">{protocol.title}</div>
          <div className="small muted">{protocol.citation}</div>
          <div className="small muted">{protocol.design}</div>
        </div>
        <div className="row wrap">
          <span className={`chip ${protocol.illustrative ? 'unknown' : 'met'}`}><span className="dot" />{protocol.illustrative ? 'Illustrative protocol' : `Published · ${protocol.licence}`}</span>
          <span className="chip ink">Target n = {protocol.targetEnrolment}</span>
        </div>
      </section>

      {table(inc, 'Inclusion criteria')}
      {table(exc, 'Exclusion criteria')}

      <div className="grid g-2" style={{ alignItems: 'start' }}>
        <Panel title="Import a protocol" sub="Draft criteria from protocol text">
          <div className="stack">
            <textarea className="textarea" placeholder="Paste the eligibility section of a protocol, or leave empty to load the sample." value={text} onChange={(e) => setText(e.target.value)} />
            <div className="row">
              <button className="btn primary" onClick={run}><Icon name="arrow" />Extract criteria</button>
              <label className="btn"><Icon name="upload" />Upload .txt<input type="file" accept=".txt,.md,.pdf" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label>
            </div>
            <p className="tiny muted">The prototype uses a transparent offline parser, so no text leaves the browser. The full system uses an LLM with a fixed output schema, and every draft is reviewed by a person.</p>
          </div>
        </Panel>
        <Panel title="Draft checklist" sub={drafts ? `${drafts.length} items extracted` : 'Nothing extracted yet'} flush>
          {!drafts && <div className="card-pad muted small">Extracted criteria appear here with a suggested category and data field. Unmapped items need a person to map them before they can be screened automatically.</div>}
          {drafts?.map((d, i) => (
            <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--text-1)' }}>{d.text}</div>
                <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                  <span className={`chip ${d.kind === 'inclusion' ? 'accent' : 'ink'}`}>{d.kind}</span>
                  <span className={`chip ${d.category === 'Unmapped' ? 'unknown' : 'ink'}`}>{d.category}</span>
                  {d.mappedField && <span className="chip ink mono">→ {d.mappedField}</span>}
                  {d.numbers.length > 0 && <span className="chip ink">thresholds {d.numbers.join(', ')}</span>}
                </div>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
