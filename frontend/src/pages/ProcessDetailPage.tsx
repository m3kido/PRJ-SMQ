import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";

type Process = {
  id: number;
  name: string;
  type: string;
  description: string;
  completeness: number;
  department_name?: string;
  owner_username?: string;
};

type ManagedSheet = {
  id: number;
  process: number;
  process_name: string;
  due_date: string;
  status: string;
  sheet_data: Record<string, unknown>;
};

type AuditAssignment = {
  id: number;
  process: number;
  status: string;
  due_date: string;
};

function renderBlock(value: unknown) {
  if (Array.isArray(value)) {
    return (
      <ul className="fiche-list">
        {value.map((item, idx) => <li key={idx}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>)}
      </ul>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className="fiche-grid">
        {Object.entries(value as Record<string, unknown>).map(([key, nested]) => (
          <div key={key} className="fiche-item fiche-item-block">
            <div className="fiche-label">{key.replace(/_/g, " ")}</div>
            {renderBlock(nested)}
          </div>
        ))}
      </div>
    );
  }
  return <div className="fiche-text">{String(value ?? "")}</div>;
}

function ProcessDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const { data: process, loading, error } = useFetch<Process>(`/processes/${id}/`, [id]);
  const { data: sheets } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: assignments } = useFetch<AuditAssignment[]>("/audit-assignments/");

  const sheet = (sheets ?? []).find((item) => String(item.process) === String(id));
  const currentAssignment = (assignments ?? []).find((item) => String(item.process) === String(id) && item.status !== "closed");

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Processus</div>
          <h1 className="dashboard-title">{process?.name ?? "Chargement..."}</h1>
          <p className="dashboard-copy">Vue détaillée du processus et de sa fiche structurée pour consultation, préparation et audit.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Complétude</span>
          <strong>{process?.completeness ?? 0}%</strong>
        </div>
      </section>

      <div className="card fiche-meta-bar">
        <div><strong>Département:</strong> {process?.department_name ?? "-"}</div>
        <div><strong>Responsable:</strong> {process?.owner_username ?? "-"}</div>
        <div><strong>Type:</strong> {process?.type ?? "-"}</div>
        {auth.role === "auditeur_interne" && currentAssignment && (
          <Link className="btn-primary" to={`/audit-execution/${currentAssignment.id}`}>Lancer l'audit</Link>
        )}
      </div>

      {loading && <div className="card muted">Chargement...</div>}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {process?.description && (
        <div className="card">
          <h3 className="section-title">Description</h3>
          <p className="dashboard-copy">{process.description}</p>
        </div>
      )}

      {sheet?.sheet_data && (
        <div className="card">
          <h3 className="section-title">Fiche processus</h3>
          {Object.entries(sheet.sheet_data).map(([section, value]) => (
            <section key={section} className="fiche-section">
              <h3 className="section-title">{section.replace(/_/g, " ")}</h3>
              {renderBlock(value)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProcessDetailPage;
