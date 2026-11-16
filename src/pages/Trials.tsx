import { Icon, PageHead, Panel, Stats } from '../components/ui';
import { useStore } from '../state/store';

export const GLOSSARY: [string, string][] = [
  ['PD', 'Parkinson’s disease'],
  ['DBS', 'Deep brain stimulation'],
  ['STN', 'Subthalamic nucleus (a DBS target)'],
  ['GPi', 'Globus pallidus internus (a DBS target)'],
  ['IPG', 'Implantable pulse generator (the DBS battery/stimulator)'],
  ['SCS', 'Spinal cord stimulation'],
  ['FOG', 'Freezing of gait'],
  ['MoCA', 'Montreal Cognitive Assessment (cognitive screen, 0–30)'],
  ['SAS', 'Starkstein Apathy Scale (0–42)'],
  ['MDS-UPDRS', 'Movement Disorder Society–Unified Parkinson’s Disease Rating Scale (part III = motor examination)'],
  ['H&Y', 'Hoehn and Yahr stage (1–5, disease severity)'],
  ['NFOG-Q', 'New Freezing of Gait Questionnaire (0–28)'],
  ['EHR / EMR', 'Electronic health record / electronic medical record'],
  ['PI', 'Principal investigator'],
];

export function Trials({ go }: { go: (page: string) => void }) {
  const { protocols, portfolio, patients, setProtocolId, stageOf } = useStore();

  const candidates = (pid: string) => [...portfolio[pid].values()].filter((r) => r.band === 'High' || r.band === 'Medium').length;
  const notRuledOut = (pid: string) => [...portfolio[pid].values()].filter((r) => r.score > 0).length;
  const multi = patients.filter((p) => protocols.filter((pr) => (portfolio[pr.id].get(p.id)?.score ?? 0) >= 0.3).length >= 2).length;
  const anyCandidate = patients.filter((p) => protocols.some((pr) => (portfolio[pr.id].get(p.id)?.score ?? 0) >= 0.3)).length;

  return (
    <>
      <PageHead
        crumbs={['Research unit', 'Trial portfolio']}
        title="Trial portfolio"
        sub="Every patient is pre-screened against every open trial at once, so a patient who does not fit one trial can still be offered another. Three trials target motor symptoms of Parkinson’s disease; one targets apathy."
      />
      <Stats items={[
        { label: 'Patients in records', value: patients.length, sub: 'Two movement-disorders clinics' },
        { label: 'Open trials', value: protocols.length, sub: `${protocols.filter((p) => p.status === 'Recruiting').length} recruiting · ${protocols.filter((p) => p.status === 'Feasibility').length} in feasibility` },
        { label: 'Candidates for at least one trial', value: anyCandidate, sub: 'Match score ≥ 0.30' },
        { label: 'Candidates for two or more trials', value: multi, sub: 'Need a decision on which trial' },
      ]} />

      <Panel title="Trials" sub="Select a trial to work on it" flush>
        <table className="table">
          <thead>
            <tr><th>Trial</th><th>Symptom focus</th><th>Intervention</th><th>Status</th><th className="num">Not ruled out</th><th className="num">Candidates</th><th className="num">Enrolled / target</th><th /></tr>
          </thead>
          <tbody>
            {protocols.map((pr) => {
              const enrolled = patients.filter((p) => stageOf(p, pr.id) === 'Enrolled').length;
              return (
                <tr key={pr.id} className="clickable" onClick={() => { setProtocolId(pr.id); go('screening'); }}>
                  <td style={{ maxWidth: 340 }}>
                    <div className="strong">{pr.shortName}</div>
                    <div className="tiny muted">{pr.illustrative ? 'Illustrative protocol' : pr.citation}</div>
                  </td>
                  <td><span className={`chip ${pr.id === 'dstn-apathy' ? 'ink' : 'accent'}`}>{pr.id === 'dstn-apathy' ? 'Non-motor' : 'Motor'}</span> <span className="small">{pr.focus}</span></td>
                  <td style={{ maxWidth: 240, fontSize: 13 }}>{pr.intervention}</td>
                  <td><span className={`chip ${pr.status === 'Recruiting' ? 'met' : 'ink'}`}><span className="dot" />{pr.status}</span></td>
                  <td className="num">{notRuledOut(pr.id)}</td>
                  <td className="num strong">{candidates(pr.id)}</td>
                  <td className="num">{pr.status === 'Recruiting' ? `${enrolled} / ${pr.targetEnrolment}` : '—'}</td>
                  <td><Icon name="arrow" size={14} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title="Abbreviations" sub="Used across the platform" flush>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {GLOSSARY.map(([a, b]) => (
            <div key={a} className="list-row" style={{ justifyContent: 'flex-start', gap: 16 }}>
              <span className="mono strong" style={{ minWidth: 90 }}>{a}</span><span>{b}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
