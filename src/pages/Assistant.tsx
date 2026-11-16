import { useEffect, useRef, useState } from 'react';
import { Avatar, Icon, PageHead, Panel } from '../components/ui';
import { SUGGESTIONS, answer, type Answer } from '../engine/assistant';
import { useStore } from '../state/store';

type Msg = ({ from: 'user'; text: string }) | ({ from: 'bot' } & Answer);

export function Assistant() {
  const { protocol, patients, screening, stageOf, role, log } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: `I answer questions about ${protocol.shortName} using only the protocol and the study database. Every answer lists its sources. I suggest; a clinician decides.`, sources: [] },
  ]);
  const [q, setQ] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs]);

  const ask = (text: string) => {
    if (!text.trim()) return;
    const a = answer(text, { protocol, patients, screening, stageOf, role });
    setMsgs((m) => [...m, { from: 'user', text }, { from: 'bot', ...a }]);
    log('Assistant query', `“${text}”${a.refused ? ' (refused: out of scope for role)' : ''}`);
    setQ('');
  };

  return (
    <>
      <PageHead crumbs={[protocol.shortName, 'Study assistant']} title="Study assistant" sub="For study staff, not patients. Answers come from database queries and protocol text, are scoped to your role, and are logged." />
      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="chat">
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.from === 'bot' && m.refused ? 'refused' : ''}`} style={{ background: m.from === 'user' ? 'var(--subtle)' : undefined }}>
                {m.from === 'bot' ? <span className="bot-avatar"><svg width="18" height="18" viewBox="0 0 32 32"><path d="M5 19c3.5 0 3.5-8 7-8s3.5 11 7 11 3.5-7 7-7" fill="none" stroke="#8fb0f2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : <Avatar initials={role === 'Principal investigator' ? 'LC' : role === 'Data custodian' ? 'DO' : 'MT'} />}
                <div>
                  <div className="msg-name">{m.from === 'bot' ? 'Study assistant' : 'You'}<span>{m.from === 'bot' ? 'grounded · read-only' : role}</span></div>
                  <div className="msg-body">{m.text}</div>
                  {m.from === 'bot' && m.sources.length > 0 && (
                    <div className="sources">{m.sources.map((s) => <span key={s} className="chip ink"><Icon name="file" size={12} />{s}</span>)}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about eligibility gaps, consent, screen failures or a study ID…" aria-label="Question" />
            <button className="btn primary" type="submit" style={{ height: 40 }}>Send</button>
          </form>
        </section>
        <div className="stack" style={{ gap: 20 }}>
          <Panel title="Suggested questions" flush>
            {[...SUGGESTIONS, 'What is the name of PT-1015?'].map((s) => (
              <button key={s} className="list-row" onClick={() => ask(s)}><span>{s}</span><Icon name="arrow" size={14} /></button>
            ))}
          </Panel>
          <Panel title="Guardrails" flush>
            <div className="list-row" style={{ justifyContent: 'flex-start' }}><Icon name="database" /><span><b className="strong">Grounded.</b> Every number comes from a query.</span></div>
            <div className="list-row" style={{ justifyContent: 'flex-start' }}><Icon name="lock" /><span><b className="strong">Scoped.</b> No identities unless your role allows it.</span></div>
            <div className="list-row" style={{ justifyContent: 'flex-start' }}><Icon name="shield" /><span><b className="strong">Advisory.</b> It suggests; a clinician decides.</span></div>
          </Panel>
        </div>
      </div>
    </>
  );
}
