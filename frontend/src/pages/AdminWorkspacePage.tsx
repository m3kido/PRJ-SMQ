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
  status: string;
};

type NonConformity = {
  id: number;
  status: string;
  process: number;
};

type Process = {
  id: number;
  name: string;
};

function AdminWorkspacePage() {
  const { data: alerts } = useFetch<Alert[]>("/deadline-alerts/");
  const { data: sheets } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: audits } = useFetch<AuditAssignment[]>("/audit-assignments/");
  const { data: nonConformities } = useFetch<NonConformity[]>("/non-conformities/");

  const draftSheets = (sheets ?? []).filter((item) => item.status === "draft" || item.status === "late").length;
  const submittedSheets = (sheets ?? []).filter((item) => item.status === "submitted" || item.status === "validated").length;
  const openAudits = (audits ?? []).filter((item) => item.status !== "closed").length;
  const closedAudits = (audits ?? []).filter((item) => item.status === "closed").length;
  const openNCs = (nonConformities ?? []).filter((item) => item.status !== "resolue").length;

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="dashboard-title">Tableau de supervision</h1>
          <p className="dashboard-copy">Vue globale des retards, des audits en cours, des fiches en attente et des non-conformités ouvertes.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Alertes actives</span>
          <strong>{(alerts ?? []).filter((a) => !a.resolved).length}</strong>
        </div>
      </section>

      <div className="grid stats">
        <div className="card stat-card stat-card-primary">
          <div className="card-title">Fiches en attente</div>
          <div className="card-value">{draftSheets}</div>
          <div className="muted">Brouillon ou en retard</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Fiches conformes</div>
          <div className="card-value">{submittedSheets}</div>
          <div className="muted">Soumises ou validées</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Audits ouverts</div>
          <div className="card-value">{openAudits}</div>
          <div className="muted">Assignés ou en cours</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Non-conformités ouvertes</div>
          <div className="card-value">{openNCs}</div>
          <div className="muted">À traiter</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card panel-large">
          <div className="flex-between">
            <h3 className="section-title">Alertes de délais</h3>
            <span className="tag">Suivi</span>
          </div>
          <div className="activity">
            {(alerts ?? []).map((alert) => (
              <div key={alert.id} className="activity-item">
                <div className="muted" style={{ fontSize: 12 }}>{formatDateTime(alert.created_at)}</div>
                <div style={{ fontWeight: 700 }}>{alert.alert_type}</div>
                <div>{alert.message}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card panel-side">
          <h3 className="section-title">Synthèse</h3>
          <div className="activity">
            <div className="activity-item">
              <div style={{ fontWeight: 700 }}>Audits clôturés</div>
              <div className="muted">{closedAudits} audits terminés et notifiés</div>
            </div>
            <div className="activity-item">
              <div style={{ fontWeight: 700 }}>Charge gestionnaires</div>
              <div className="muted">{draftSheets} fiches nécessitent encore une intervention</div>
            </div>
            <div className="activity-item">
              <div style={{ fontWeight: 700 }}>Qualité globale</div>
              <div className="muted">{openNCs === 0 ? "Aucune non-conformité ouverte" : `${openNCs} non-conformités à suivre`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminWorkspacePage;
