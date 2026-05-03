import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useFetch } from "../hooks/useFetch";
import { formatDateTime } from "../utils/date";

type Alert = {
  id: number;
  alert_type: string;
  message: string;
  resolved: boolean;
  created_at: string;
};

type ManagedSheet = {
  id: number;
  status: string;
};

type AuditAssignment = {
  id: number;
  audit: number;
  process: number;
  process_name: string;
  status: string;
  due_date: string;
  updated_at: string;
};

type NonConformity = {
  id: number;
  status: string;
  severity: string;
  process: number;
  process_name?: string;
  criterion_title?: string;
  description: string;
};

type Process = {
  id: number;
  name: string;
  type: string;
  department_name?: string;
};

type ComputedResult = {
  id: number;
  assignment: number;
  average_rate: string;
  conformity_level: string;
  updated_at: string;
};

type CorrectiveAction = {
  id: number;
  completed: boolean;
};

function processTypeLabel(value?: string) {
  if (value === "operationnel") return "Opérationnel";
  if (value === "support") return "Support";
  if (value === "management") return "Management";
  return value ?? "-";
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function AdminWorkspacePage() {
  const { data: alerts } = useFetch<Alert[]>("/deadline-alerts/");
  const { data: sheets } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: audits } = useFetch<AuditAssignment[]>("/audit-assignments/");
  const { data: nonConformities } = useFetch<NonConformity[]>("/non-conformities/");
  const { data: processes } = useFetch<Process[]>("/processes/");
  const { data: results } = useFetch<ComputedResult[]>("/audit-computed-results/");
  const { data: actions } = useFetch<CorrectiveAction[]>("/actions/");

  const activeAlerts = (alerts ?? []).filter((alert) => !alert.resolved);
  const activeNCs = (nonConformities ?? []).filter((item) => item.status !== "resolue");
  const criticalNCs = activeNCs.filter((item) => item.severity === "critique").length;
  const majorNCs = activeNCs.filter((item) => item.severity === "majeure").length;
  const minorNCs = activeNCs.filter((item) => item.severity === "mineure").length;
  const draftSheets = (sheets ?? []).filter((item) => item.status === "draft" || item.status === "late").length;
  const openAudits = (audits ?? []).filter((item) => item.status !== "closed").length;
  const openActions = (actions ?? []).filter((item) => !item.completed).length;

  const assignmentById = useMemo(() => new Map((audits ?? []).map((assignment) => [assignment.id, assignment])), [audits]);
  const latestResultByProcess = useMemo(() => {
    const latest = new Map<number, { result: ComputedResult; assignment: AuditAssignment }>();
    (results ?? []).forEach((result) => {
      const assignment = assignmentById.get(result.assignment);
      if (!assignment || assignment.status !== "closed") return;
      const current = latest.get(assignment.process);
      const resultDate = new Date(result.updated_at || assignment.updated_at).getTime();
      const currentDate = current ? new Date(current.result.updated_at || current.assignment.updated_at).getTime() : 0;
      if (!current || resultDate >= currentDate) {
        latest.set(assignment.process, { result, assignment });
      }
    });
    return latest;
  }, [assignmentById, results]);

  const totalProcesses = processes?.length ?? 0;
  const auditedProcesses = latestResultByProcess.size;
  const conformingProcesses = [...latestResultByProcess.values()].filter(({ result }) => result.conformity_level.toLocaleLowerCase() === "conforme").length;
  const notConformingProcesses = Math.max(auditedProcesses - conformingProcesses, 0);
  const unauditedProcesses = Math.max(totalProcesses - auditedProcesses, 0);
  const readiness = percent(conformingProcesses, totalProcesses);
  const auditCoverage = percent(auditedProcesses, totalProcesses);

  const priority = (() => {
    if (criticalNCs > 0) return { label: "Priorité immédiate", text: `${criticalNCs} non-conformité(s) critique(s) à traiter avant toute revue ISO 9001.` };
    if (activeNCs.length > 0) return { label: "Priorité qualité", text: `${activeNCs.length} non-conformité(s) ouverte(s) bloquent la maîtrise complète du SMQ.` };
    if (notConformingProcesses > 0) return { label: "Priorité audit", text: `${notConformingProcesses} processus audité(s) restent sous le niveau Conforme.` };
    if (unauditedProcesses > 0) return { label: "Priorité couverture", text: `${unauditedProcesses} processus n'ont pas encore de résultat d'audit clôturé.` };
    if (draftSheets > 0) return { label: "Priorité documentaire", text: `${draftSheets} fiche(s) processus doivent encore être finalisées.` };
    return { label: "Maintien", text: "Les processus audités sont conformes. Maintenir les preuves et préparer la revue de certification." };
  })();

  const processReadiness = useMemo(() => (processes ?? [])
    .map((process) => {
      const latest = latestResultByProcess.get(process.id);
      const processNCs = activeNCs.filter((item) => item.process === process.id);
      return {
        process,
        rate: latest ? Number(latest.result.average_rate) : null,
        level: latest?.result.conformity_level || "Non audité",
        auditId: latest?.assignment.id,
        dueDate: latest?.assignment.due_date,
        ncCount: processNCs.length,
      };
    })
    .sort((left, right) => {
      if (right.ncCount !== left.ncCount) return right.ncCount - left.ncCount;
      return (left.rate ?? -1) - (right.rate ?? -1);
    })
    .slice(0, 6), [activeNCs, latestResultByProcess, processes]);

  const maxSeverity = Math.max(criticalNCs, majorNCs, minorNCs, 1);
  const severityBreakdown: Array<{ label: string; value: number; tone: string }> = [
    { label: "Critiques", value: criticalNCs, tone: "critique" },
    { label: "Majeures", value: majorNCs, tone: "majeure" },
    { label: "Mineures", value: minorNCs, tone: "mineure" },
  ];

  return (
    <div className="dashboard-stack admin-iso-dashboard">
      <section className="dashboard-hero admin-priority-hero">
        <div>
          <div className="eyebrow">Objectif ISO 9001</div>
          <h1 className="dashboard-title">{priority.label}</h1>
          <p className="dashboard-copy">{priority.text}</p>
        </div>
        <div className="iso-readiness-gauge" style={{ "--value": `${readiness * 3.6}deg` } as CSSProperties}>
          <div>
            <strong>{readiness}%</strong>
            <span>{conformingProcesses}/{totalProcesses} processus conformes</span>
          </div>
        </div>
      </section>

      <div className="admin-metric-grid">
        <div className="card admin-metric-card primary">
          <span className="card-title">Processus conformes</span>
          <strong>{conformingProcesses}/{totalProcesses}</strong>
          <div className="admin-progress-track"><span style={{ width: `${readiness}%` }} /></div>
        </div>
        <div className="card admin-metric-card">
          <span className="card-title">Couverture d'audit</span>
          <strong>{auditCoverage}%</strong>
          <div className="muted">{auditedProcesses} audité(s), {unauditedProcesses} à couvrir</div>
        </div>
        <div className="card admin-metric-card danger">
          <span className="card-title">Non-conformités ouvertes</span>
          <strong>{activeNCs.length}</strong>
          <div className="muted">{criticalNCs} critique(s), {majorNCs} majeure(s)</div>
        </div>
        <div className="card admin-metric-card">
          <span className="card-title">Actions ouvertes</span>
          <strong>{openActions}</strong>
          <div className="muted">{openAudits} audit(s) encore ouverts</div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="card admin-readiness-card">
          <div className="flex-between">
            <h3 className="section-title">Processus à prioriser</h3>
            <span className="tag">Risque ISO 9001</span>
          </div>
          <div className="process-readiness-list">
            {processReadiness.map((item) => (
              <div key={item.process.id} className="process-readiness-row">
                <div>
                  <Link to={`/processes/${item.process.id}`}><strong>{item.process.name}</strong></Link>
                  <div className="muted">{processTypeLabel(item.process.type)} · {item.process.department_name ?? "-"}</div>
                </div>
                <div className="process-readiness-score">
                  <span>{item.rate == null ? "Non audité" : `${item.rate.toFixed(0)}%`}</span>
                  <small>{item.level}</small>
                </div>
                <div className="process-readiness-nc">
                  <span className={`badge ${item.ncCount ? "majeure" : "mineure"}`}>{item.ncCount} NC</span>
                  {item.auditId && <Link className="tag" to={`/audit-reports/${item.auditId}`}>Rapport</Link>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card admin-chart-card">
          <h3 className="section-title">Non-conformités par sévérité</h3>
          {severityBreakdown.map(({ label, value, tone }) => (
            <div key={label} className="severity-bar-row">
              <div className="severity-bar-label">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="severity-bar-track">
                <span className={`severity-bar ${tone}`} style={{ width: `${(value / maxSeverity) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="card">
          <div className="flex-between">
            <h3 className="section-title">Non-conformités récentes</h3>
            <Link className="tag" to="/non-conformities">Tout voir</Link>
          </div>
          <div className="activity">
            {activeNCs.slice(0, 5).map((nc) => (
              <div key={nc.id} className="activity-item">
                <div style={{ fontWeight: 700 }}>{nc.process_name ?? `Processus ${nc.process}`}</div>
                <div className="muted">{nc.criterion_title || nc.description}</div>
                <span className={`badge ${nc.severity}`}>{nc.severity}</span>
              </div>
            ))}
            {!activeNCs.length && <div className="muted">Aucune non-conformité ouverte.</div>}
          </div>
        </div>

        <div className="card">
          <div className="flex-between">
            <h3 className="section-title">Alertes et délais</h3>
            <span className="tag">{activeAlerts.length} active(s)</span>
          </div>
          <div className="activity">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="activity-item">
                <div className="muted" style={{ fontSize: 12 }}>{formatDateTime(alert.created_at)}</div>
                <div style={{ fontWeight: 700 }}>{alert.alert_type}</div>
                <div>{alert.message}</div>
              </div>
            ))}
            {!activeAlerts.length && <div className="muted">Aucune alerte active.</div>}
          </div>
        </div>
      </div>

      <div className="card admin-certification-roadmap">
        <h3 className="section-title">Chemin de préparation ISO 9001</h3>
        <div className="roadmap-steps">
          <div className={activeNCs.length ? "roadmap-step active" : "roadmap-step done"}>
            <strong>1. Fermer les non-conformités</strong>
            <span>{activeNCs.length} ouverte(s)</span>
          </div>
          <div className={unauditedProcesses ? "roadmap-step active" : "roadmap-step done"}>
            <strong>2. Couvrir tous les processus</strong>
            <span>{unauditedProcesses} non audité(s)</span>
          </div>
          <div className={notConformingProcesses ? "roadmap-step active" : "roadmap-step done"}>
            <strong>3. Atteindre le niveau Conforme</strong>
            <span>{notConformingProcesses} à améliorer</span>
          </div>
          <div className={draftSheets ? "roadmap-step active" : "roadmap-step done"}>
            <strong>4. Consolider les fiches processus</strong>
            <span>{draftSheets} en attente</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminWorkspacePage;
