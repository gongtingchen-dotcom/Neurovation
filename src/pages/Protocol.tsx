import { useState } from 'react';
import { Icon, PageHead, Switch } from '../components/ui';
import { SAMPLE_PROTOCOL_TEXT, extractCriteria, type DraftCriterion } from '../engine/extract';
import { useStore } from '../state/store';

export function ProtocolPage() {
  const { protocol, updateCriterion, resetProtocol, priors, log } = useStore();
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<DraftCriterion[] | null>(null);

  const run = () => {
    const d = extractCriteria(text || SAMPLE_PROTOCOL_TEXT);
    if (!text) setText(SAMPLE_PROTOCOL_TEXT);
    setDrafts(d);
    log('Extracted criteria', `${d.length} draft criteria from pasted protocol text`);
  };

  const onFile = async (f: File) => {
    if (f.type === 'application/pdf') {
      setText('PDF parsing runs server-side in the full system. For this prototype, paste the eligibility section as text.');
      return;
    }
    setText(await f.text());
  };

  return (
    <>
      <PageHead
        title="Protocol & criteria"
        sub="Eligibility criteria become a structured checklist. Each rule keeps its source sentence, and the research officer can edit thresholds before screening. Results update straight away."
        right={<button className="btn" onClick={resetProtocol}>Reset to protocol</button>}
      />

      <div className="card card-pad">
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2>{protocol.title}</h2>
            <div className="small muted">{protocol.citation}</div>
            <div className="small muted">{protocol.design}</div>
          </div>
          <div className="row wrap">
            <span className={`chip ${protocol.illustrative ? 'unknown' : 'met'}`}>{protocol.illustrative ? 'Illustrative protocol' : `Published protocol · ${protocol.licence}`}</span>
            <span className="chip ink">Target n = {protocol.targetEnrolment}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 52 }}>ID</th>
              <th>Criterion and source sentence</th>
              <th>Type</th>
              <th>Evidence from</th>
              <th>Parameters</th>
              <th className="num" title="Probability the criterion is met when it cannot be assessed (estimated from the cohort)">Prior if unknown</th>
              <th style={{ width: 60 }}>Active</th>
            </tr>
          </thead>
          <tbody>
            {protocol.criteria.map((c) => (
              <tr key={c.id} style={{ opacity: c.enabled ? 1 : 0.45 }}>
                <td><span className={`chip ${c.kind === 'inclusion' ? 'accent' : 'ink'}`}>{c.id}</span></td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.label}</div>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    “{c.sourceText}” <span className="faint">· {c.section}{c.paraphrased ? ' · paraphrased' : ''}</span>
                  </div>
                  {c.siteRule && <div className="tiny" style={{ color: 'var(--unknown)', marginTop: 4 }}>Site rule: {c.siteRule}</div>}
                </td>
                <td><span className="chip">{c.category}</span></td>
                <td><span className={`chip ${c.evidenceSource === 'EHR' ? '' : c.evidenceSource === 'Device report' ? 'accent' : 'unknown'}`}>{c.evidenceSource}</span></td>
                <td>
                  <div className="stack" style={{ gap: 6 }}>
                    {c.params.map((p) => (
                      <label key={p.key} className="row small" style={{ gap: 6 }}>
                        <span className="muted" style={{ minWidth: 120 }}>{p.label}</span>
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
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><h2>Import a new protocol</h2><p>Step 1 of the pipeline</p></div>
          <div className="card-pad stack">
            <textarea className="textarea" placeholder="Paste the eligibility section of a protocol here, or leave it empty to load the sample text." value={text} onChange={(e) => setText(e.target.value)} />
            <div className="row">
              <button className="btn primary" onClick={run}><Icon name="arrow" />Extract criteria</button>
              <label className="btn"><Icon name="upload" />Upload .txt<input type="file" accept=".txt,.md,.pdf" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label>
            </div>
            <p className="tiny muted">The prototype uses a transparent offline parser, so no text leaves your browser. The full system uses an LLM with a fixed output schema at this step, and every draft is still reviewed by a person.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Draft checklist</h2><p>{drafts ? `${drafts.length} items` : 'Nothing extracted yet'}</p></div>
          <div className="card-pad">
            {!drafts && <p className="muted small">Extracted criteria appear here with a suggested category and data field. Unmapped items need a person to map them before they can be screened automatically.</p>}
            {drafts?.map((d, i) => (
              <div key={i} className="crit" style={{ gridTemplateColumns: '84px 1fr' }}>
                <span className={`chip ${d.kind === 'inclusion' ? 'accent' : 'ink'}`}>{d.kind}</span>
                <div>
                  <div style={{ color: 'var(--ink)' }}>{d.text}</div>
                  <div className="row wrap" style={{ marginTop: 4, gap: 6 }}>
                    <span className={`chip ${d.category === 'Unmapped' ? 'unknown' : ''}`}>{d.category}</span>
                    {d.mappedField && <span className="chip mono">→ {d.mappedField}</span>}
                    {d.numbers.length > 0 && <span className="chip">thresholds: {d.numbers.join(', ')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
