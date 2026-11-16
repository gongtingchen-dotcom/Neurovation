import { useEffect, useRef, useState } from 'react';
import { Icon, PageHead } from '../components/ui';
import { SUGGESTIONS, answer, type Answer } from '../engine/assistant';
import { useStore } from '../state/store';

type Msg = { from: 'user' } & { text: string } | ({ from: 'bot' } & Answer);

export function Assistant() {
  const { protocol, patients, screening, stageOf, role, log } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: `Hello. I answer questions about “${protocol.shortName}” using only the protocol and the study database, and every answer cites its source. I suggest; a clinician decides.`, sources: [] },
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
      <PageHead title="Study assistant" sub="For staff, not patients. Answers are grounded in the protocol and the study database, scoped to your role, and logged." />
      <div className="grid g-main-side" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="chat">
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.from} ${m.from === 'bot' && m.refused ? 'refused' : ''}`}>
                {m.text}
                {m.from === 'bot' && m.sources.length > 0 && (
                  <div className="sources">{m.sources.map((s) => <span key={s} className="chip accent">{s}</span>)}</div>
                )}
              </div>
            ))}
            <div ref={end} />
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about eligibility, consent, screen failures, a study ID…" aria-label="Question" />
            <button className="btn primary" type="submit"><Icon name="arrow" />Ask</button>
          </form>
        </div>
        <div className="stack" style={{ gap: 20 }}>
          <div className="card card-pad stack">
            <h2>Try asking</h2>
            {SUGGESTIONS.map((s) => <button key={s} className="btn" style={{ justifyContent: 'flex-start', textAlign: 'left' }} onClick={() => ask(s)}>{s}</button>)}
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => ask('What is the name of PT-1015?')}>What is the name of PT-1015? <span className="faint tiny">(scope test)</span></button>
          </div>
          <div className="card card-pad stack small">
            <h3>Guardrails</h3>
            <div className="row"><Icon name="check" /><span><b>Grounded:</b> each number comes from a database query.</span></div>
            <div className="row"><Icon name="lock" /><span><b>Scoped:</b> no identities unless your role allows it.</span></div>
            <div className="row"><Icon name="shield" /><span><b>Advisory:</b> it suggests; a clinician decides.</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
