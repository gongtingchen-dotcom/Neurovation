import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { COHORT } from '../data/cohort';
import { PROTOCOLS } from '../data/protocols';
import { screenCohort } from '../engine/matcher';
import type { AuditEntry, Decision, Patient, Pipeline, Protocol, Role, ScreeningResult, Stage } from '../engine/types';

interface Store {
  protocols: Protocol[];
  protocol: Protocol;
  setProtocolId: (id: string) => void;
  updateCriterion: (criterionId: string, patch: { enabled?: boolean; param?: { key: string; value: number } }) => void;
  resetProtocol: () => void;
  patients: Patient[];
  screening: ScreeningResult[];
  priors: Record<string, number>;
  byId: Map<string, Patient>;
  resultById: Map<string, ScreeningResult>;
  stageOf: (p: Patient, protocolId?: string) => Stage;
  pipelineOf: (p: Patient, protocolId?: string) => Pipeline | undefined;
  /** Screening of every patient against every trial (for cross-trial matching). */
  portfolio: Record<string, Map<string, ScreeningResult>>;
  decisions: Record<string, Decision>;
  decide: (d: Omit<Decision, 'at' | 'by' | 'protocolId'>) => void;
  role: Role;
  setRole: (r: Role) => void;
  audit: AuditEntry[];
  log: (action: string, detail: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

const Ctx = createContext<Store | null>(null);

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const now = () => new Date().toISOString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [protocols, setProtocols] = useState<Protocol[]>(() => clone(PROTOCOLS));
  const [protocolId, setProtocolIdRaw] = useState(PROTOCOLS[0].id);
  const [role, setRoleRaw] = useState<Role>('Research officer');
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([
    { at: now(), role: 'Research officer', action: 'Session started', detail: `Synthetic cohort loaded (n = ${COHORT.length}). No real patient data.` },
  ]);

  const log = useCallback(
    (action: string, detail: string) => setAudit((a) => [{ at: now(), role, action, detail }, ...a]),
    [role],
  );

  const protocol = protocols.find((p) => p.id === protocolId)!;
  const { results: screening, priors } = useMemo(() => screenCohort(protocol, COHORT), [protocol]);
  const byId = useMemo(() => new Map(COHORT.map((p) => [p.id, p])), []);
  const resultById = useMemo(() => new Map(screening.map((r) => [r.patientId, r])), [screening]);

  const portfolio = useMemo(
    () => Object.fromEntries(protocols.map((pr) => [pr.id, new Map(screenCohort(pr, COHORT).results.map((r) => [r.patientId, r]))])),
    [protocols],
  );

  const pipelineOf = useCallback((p: Patient, pid: string = protocolId) => p.pipelines[pid], [protocolId]);
  const stageOf = useCallback(
    (p: Patient, pid: string = protocolId): Stage => {
      const d = decisions[`${pid}:${p.id}`];
      const base = p.pipelines[pid]?.stage ?? 'Pre-screened';
      if (d?.action === 'approve' && base === 'Pre-screened') return 'Approved for contact';
      if (d?.action === 'reject') return 'Pre-screened';
      return base;
    },
    [decisions, protocolId],
  );

  const value: Store = {
    protocols,
    protocol,
    setProtocolId: (id) => {
      setProtocolIdRaw(id);
      log('Switched protocol', protocols.find((p) => p.id === id)?.shortName ?? id);
    },
    updateCriterion: (cid, patch) => {
      setProtocols((ps) =>
        ps.map((p) =>
          p.id !== protocolId ? p : {
            ...p,
            criteria: p.criteria.map((c) => {
              if (c.id !== cid) return c;
              const next = clone(c);
              if (patch.enabled !== undefined) next.enabled = patch.enabled;
              if (patch.param) next.params = next.params.map((q) => (q.key === patch.param!.key ? { ...q, value: patch.param!.value } : q));
              return next;
            }),
          },
        ),
      );
      log('Edited criterion', `${protocol.shortName} · ${cid}: ${patch.enabled !== undefined ? (patch.enabled ? 'enabled' : 'disabled') : `${patch.param!.key} = ${patch.param!.value}`}`);
    },
    resetProtocol: () => {
      setProtocols((ps) => ps.map((p) => (p.id === protocolId ? clone(PROTOCOLS.find((q) => q.id === protocolId)!) : p)));
      log('Reset criteria', protocol.shortName);
    },
    patients: COHORT,
    screening,
    priors,
    byId,
    resultById,
    stageOf,
    pipelineOf,
    portfolio,
    decisions,
    decide: (d) => {
      setDecisions((ds) => ({ ...ds, [`${protocolId}:${d.patientId}`]: { ...d, protocolId, by: role, at: now() } }));
      const verb = { approve: 'Approved for contact', reject: 'Marked not eligible', request_info: 'Requested information' }[d.action];
      log(verb, `${d.patientId} · ${protocol.shortName}${d.note ? ` · “${d.note}”` : ''}`);
    },
    role,
    setRole: (r) => {
      setRoleRaw(r);
      setAudit((a) => [{ at: now(), role: r, action: 'Switched role', detail: r }, ...a]);
    },
    audit,
    log,
    selectedId,
    setSelectedId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
