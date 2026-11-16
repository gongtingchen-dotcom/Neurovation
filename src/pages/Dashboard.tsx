import { CumulativeChart, Funnel, HBar } from '../components/charts';
import { Icon, Kpi, PageHead } from '../components/ui';
import { RECRUITMENT_START } from '../data/cohort';
import { TODAY, daysBetween } from '../engine/evaluators';
import { useStore } from '../state/store';

export function Dashboard({ go }: { go: (page: string) => void }) {
  const { protocol, patients, screening, stageOf, decisions } = useStore();
  const active = protocol.id === 'dstn-apathy';
  const stages = patients.map(stageOf);
  const atLeast = (s: string[]) => stages.filter((x) => s.includes(x)).length;
  const approved = atLeast(['Approved for contact', 'Consented', 'Enrolled']);
  const consented = atLeast(['Consented', 'Enrolled']);
  const enrolled = atLeast(['Enrolled']);
  const notRuledOut = screening.filter((r) => r.score > 0).length;
  const high = screening.filter((r) => r.band === 'High').length;

  const crit = protocol.criteria.filter((c) => c.enabled);
  const fails = crit.map((c) => ({ label: `${c.id} · ${c.label}`, value: screening.filter((r) => r.results.find((x) => x.criterionId === c.id)?.verdict === 'not_met').length }))
    .filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const unknowns = crit.filter((c) => c.evidenceSource !== 'Requires contact')
    .map((c) => ({ label: `${c.id} · ${c.label}`, value: screening.filter((r) => r.results.find((x) => x.criterionId === c.id)?.verdict === 'unknown').length }))
    .filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  const enrolDates = patients.filter((p) => stageOf(p) === 'Enrolled' && p.enrolledOn).map((p) => p.enrolledOn!).sort();
  const cumulative = enrolDates.map((d, i) => ({ date: d, value: i + 1 }));

  const overdue = patients.filter((p) => stageOf(p) === 'Approved for contact' && p.consent.invitedOn && !p.consent.signedOn && daysBetween(p.consent.invitedOn, TODAY) > 7);
  const infoRequests = Object.values(decisions).filter((d) => d.protocolId === protocol.id && d.action === 'request_info');
  const queue = screening.filter((r) => r.score > 0 && stageOf(patients.find((p) => p.id === r.patientId)!) === 'Pre-screened' && !decisions[`${protocol.id}:${r.patientId}`]);

  return (
    <>
      <PageHead
        title="Study overview"
        sub={<>{protocol.title}</>}
        right={<span className={`chip ${active ? 'met' : 'ink'}`}>{active ? 'Recruiting' : 'Feasibility assessment'}</span>}
      />

      <div className="grid g-5">
        <Kpi label="Identified in records" value={patients.length} sub="DBS patients, 2 sites" />
        <Kpi label="Not ruled out by AI pre-screen" value={notRuledOut} sub={`${high} ranked high`} />
        <Kpi label="Approved for contact" value={approved} sub="by a named clinician" />
        <Kpi label="Consented" value={consented} sub={active ? `${overdue.length} invitations overdue` : '—'} />
        <Kpi label="Enrolled" value={<>{enrolled}<span className="muted" style={{ fontSize: 16, fontWeight: 500 }}> / {protocol.targetEnrolment}</span></>} sub={`${Math.round((enrolled / protocol.targetEnrolment) * 100)}% of target`} />
      </div>

      <div className="grid g-main-side">
        <div className="card">
          <div className="card-head"><h2>Recruitment funnel</h2><p>Conversion from the previous step</p></div>
          <div className="card-pad">
            <Funnel steps={[
              { label: 'Identified', value: patients.length },
              { label: 'Not ruled out', value: notRuledOut },
              { label: 'Approved for contact', value: approved },
              { label: 'Consented', value: consented },
              { label: 'Enrolled', value: enrolled },
            ]} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Needs attention</h2></div>
          <div className="card-pad stack">
            <button className="btn" style={{ justifyContent: 'space-between' }} onClick={() => go('screening')}>
              <span className="row"><Icon name="screen" />Unreviewed patients in queue</span><b>{queue.length}</b>
            </button>
            <button className="btn" style={{ justifyContent: 'space-between' }} onClick={() => go('participants')}>
              <span className="row"><Icon name="protocol" />Consent forms unsigned &gt; 7 days</span><b>{overdue.length}</b>
            </button>
            <button className="btn" style={{ justifyContent: 'space-between' }} onClick={() => go('screening')}>
              <span className="row"><Icon name="question" />Information requests open</span><b>{infoRequests.length}</b>
            </button>
            <div className="callout"><Icon name="info" /><span>Every patient contact needs a clinician’s approval. The AI only orders the review queue.</span></div>
          </div>
        </div>
      </div>

      <div className="grid g-3">
        <div className="card">
          <div className="card-head"><h2>Screen failures by criterion</h2></div>
          <div className="card-pad"><HBar data={fails} color="var(--notmet)" /></div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Unknown from records</h2></div>
          <div className="card-pad"><HBar data={unknowns} color="var(--unknown)" /></div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Enrolment against plan</h2><p>Target {protocol.targetEnrolment} in 12 months</p></div>
          <div className="card-pad">
            {active ? <CumulativeChart points={cumulative} target={protocol.targetEnrolment} start={RECRUITMENT_START} end={TODAY} />
              : <p className="muted">This protocol is in feasibility assessment. No enrolment yet. Use the ranked list to estimate the eligible pool.</p>}
          </div>
        </div>
      </div>
      <p className="tiny faint">Synthetic cohort generated for demonstration. Not real patients. Reference date {TODAY}.</p>
    </>
  );
}
