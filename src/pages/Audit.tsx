import { Icon, PageHead, Panel } from '../components/ui';
import { useStore } from '../state/store';

export function Audit() {
  const { audit, protocol } = useStore();
  const download = () => {
    const csv = ['timestamp,role,action,detail', ...audit.map((a) => [a.at, a.role, a.action, a.detail].map((x) => `"${x.replace(/"/g, '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const el = document.createElement('a');
    el.href = url; el.download = 'neurovation-audit-log.csv'; el.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHead crumbs={[protocol.shortName, 'Audit trail']} title="Audit trail" sub="Every criterion edit, decision, vault access and assistant query, with role and time. Append-only." right={<button className="btn" onClick={download}><Icon name="download" />Export CSV</button>} />
      <Panel title="Events" sub={`${audit.length} entries this session`} flush>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th style={{ width: 190 }}>Time</th><th style={{ width: 190 }}>Role</th><th style={{ width: 210 }}>Action</th><th>Detail</th></tr></thead>
            <tbody>
              {audit.map((a, i) => (
                <tr key={i}>
                  <td className="mono small">{new Date(a.at).toLocaleString('en-GB')}</td>
                  <td className="small">{a.role}</td>
                  <td><span className="chip ink">{a.action}</span></td>
                  <td className="small">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
