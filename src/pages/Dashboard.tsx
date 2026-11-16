import { CumulativeChart, Funnel, HBar } from '../components/charts';
import { Icon, PageHead, Panel, Stats } from '../components/ui';
import { RECRUITMENT_START } from '../data/cohort';
import { recordSize } from '../data/sources';
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
  const totalDocs = patients.reduce((a, p) => a + recordSize(p), 0);

  const crit = protocol.criteria.filter((c) => c.enabled);
  const count = (cid: string, v: string) => screening.filter((r) => r.results.find((x) => x.criterionId === cid)?.verdict === v).length;
  const fails = crit.map((c) => ({ label: `${c.id} · ${c.label}`, value: count(c.id, 'not_met') })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  const unknowns = crit.filter((c) => c.evidenceSource !== 'Requires contact').map((c) => ({ label: `${c.id} · ${c.label}`, value: count(c.id, 'unknown') })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);

  const enrolDates = patients.filter((p) => stageOf(p) === 'Enrolled' && p.enrolledOn).map((p) => p.enrolledOn!).sort();
  const cumulative = enrolDates.map((d, i) => ({ date: d, value: i + 1 }));
  const overdue = patients.filter((p) => stageOf(p) === 'Approved for contact' && p.consent.invitedOn && !p.consent.signedOn && daysBetween(p.consent.invitedOn, TODAY) > 7);
  const infoRequests = Object.values(decisions).filter((d) => d.protocolId === protocol.id && d.action === 'request_info');
  const queue = screening.filter((r) => r.score > 0 && stageOf(patients.find((p) => p.id === r.patientId)!) === 'Pre-screened' && !decisions[`${protocol.id}:${r.patientId}`]);
  const reconsent = patients.filter((p) => ['Consented', 'Enrolled'].includes(stageOf(p)) && p.consent.formVersion !== 'v2.1').length;

  return (
    <>
      <PageHead
        crumbs={[protocol.shortName, 'Overview']}
        title="Study overview"
        sub={protocol.title}
        right={<><span className={`chip ${active ? 'met' : 'ink'}`}><span className="dot" />{active ? 'Recruiting' : 'Feasibility'}</span><button className="btn" onClick={() => go('validation')}><Icon name="chart" />Validation</button></>}
      />

      <Stats items={[
        { label: 'Identified in records', value: patients.length, sub: `${totalDocs.toLocaleString()} documents across 7 systems` },
        { label: 'Not ruled out by pre-screen', value: notRuledOut, sub: `${high} ranked high` },
        { label: 'Approved for contact', value: approved, sub: 'by the principal investigator' },
        { label: 'Consented', value: consented, sub: active ? `${overdue.length} invitations overdue` : '—' },
        { label: 'Enrolled', value: <>{enrolled}<small> / {protocol.targetEnrolment}</small></>, sub: `${Math.round((enrolled / protocol.targetEnrolment) * 100)}% of target` },
      ]} />

      <div className="grid g-main-side">
        <Panel title="Recruitment funnel" sub="Conversion from the previous stage">
          <Funnel steps={[
            { label: 'Identified', value: patients.length },
            { label: 'Not ruled out', value: notRuledOut },
            { label: 'Approved for contact', value: approved },
            { label: 'Consented', value: consented },
            { label: 'Enrolled', value: enrolled },
          ]} />
        </Panel>
        <Panel title="Needs attention" flush foot="Every patient contact needs a clinician’s approval. The pre-screen only orders the queue.">
          <button className="list-row" onClick={() => go('screening')}><span className="row"><Icon name="screen" />Unreviewed patients in queue</span><span className="nav-count">{queue.length}</span></button>
          <button className="list-row" onClick={() => go('participants')}><span className="row"><Icon name="clock" />Consent unsigned for more than 7 days</span><span className="nav-count">{overdue.length}</span></button>
          <button className="list-row" onClick={() => go('participants')}><span className="row"><Icon name="protocol" />Consented on a superseded form</span><span className="nav-count">{reconsent}</span></button>
          <button className="list-row" onClick={() => go('screening')}><span className="row"><Icon name="info" />Open information requests</span><span className="nav-count">{infoRequests.length}</span></button>
        </Panel>
      </div>

      <div className="grid g-3">
        <Panel title="Screen failures" sub="Patients failing each criterion">
          <HBar data={fails} color="var(--bad)" />
        </Panel>
        <Panel title="Unknown from records" sub="Evidence missing or out of date">
          <HBar data={unknowns} color="var(--warn)" />
        </Panel>
        <Panel title="Enrolment against plan" sub={`Target ${protocol.targetEnrolment} in 12 months`}>
          {active ? <CumulativeChart points={cumulative} target={protocol.targetEnrolment} start={RECRUITMENT_START} end={TODAY} />
            : <p className="muted small">This study is in feasibility assessment. Use the ranked list to estimate the eligible pool.</p>}
        </Panel>
      </div>
      <p className="tiny faint">Synthetic cohort for demonstration. Not real patients. Reference date {TODAY}.</p>
    </>
  );
}
