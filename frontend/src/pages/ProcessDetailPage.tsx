import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import BpmnDiagram from "../components/BpmnDiagram";
import { LoadingCard } from "../components/LoadingStates";
import { labelizeSheetKey, sortSheetEntries } from "../utils/sheetLabels";

type Process = {
  id: number;
  name: string;
  type: string;
  description: string;
  bpmn_xml?: string;
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
    if (value.length === 0) {
      return <div className="fiche-text muted">-</div>;
    }
    if (value.some((item) => typeof item === "object" && item)) {
      return (
        <div className="process-detail-list-grid">
          {value.map((item, idx) => (
            <div key={idx} className="fiche-item fiche-item-block">
              <div className="fiche-label">Élément {idx + 1}</div>
              {renderBlock(item)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <ul className="fiche-list">
        {value.map((item, idx) => <li key={idx}>{String(item || "-")}</li>)}
      </ul>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className="fiche-grid process-detail-grid">
        {sortSheetEntries(Object.entries(value as Record<string, unknown>)).map(([key, nested]) => (
          <div key={key} className="fiche-item fiche-item-block">
            <div className="fiche-label">{labelizeSheetKey(key)}</div>
            {renderBlock(nested)}
          </div>
        ))}
      </div>
    );
  }
  const text = String(value ?? "").trim();
  return <div className={`fiche-text ${text ? "" : "muted"}`}>{text || "-"}</div>;
}

function ProcessDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const { data: process, loading, error } = useFetch<Process>(`/processes/${id}/`, [id]);
  const { data: sheets } = useFetch<ManagedSheet[]>(id ? `/managed-process-sheets/?process=${id}` : "/managed-process-sheets/?process=0", [id]);
  const { data: assignments } = useFetch<AuditAssignment[]>(id ? `/audit-assignments/?process=${id}` : "/audit-assignments/?process=0", [id]);

  const sheet = (sheets ?? []).find((item) => item.status === "validated" || item.status === "submitted") ?? sheets?.[0] ?? null;
  const currentAssignment = (assignments ?? []).find((item) => item.status !== "closed");

  return (
    <div className="dashboard-stack process-detail-page">
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
          <Link className="btn-primary" to={`/audit-execution/${currentAssignment.id}?start=1`}>Lancer l'audit</Link>
        )}
      </div>

      {loading && !process && <LoadingCard title="Chargement du processus" description="Récupération de la fiche, des audits et du BPMN..." />}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {process?.description && (
        <div className="card">
          <h3 className="section-title">Description</h3>
          <p className="dashboard-copy">{process.description}</p>
        </div>
      )}

      {sheet?.sheet_data ? (
        <div className="card process-detail-card">
          <h3 className="section-title">Fiche processus</h3>
          <div className="process-detail-sheet">
            {sortSheetEntries(Object.entries(sheet.sheet_data)).map(([section, value]) => (
              <section key={section} className="fiche-section process-detail-section">
                <h3 className="section-title">{labelizeSheetKey(section)}</h3>
                <div className="process-detail-section-content">{renderBlock(value)}</div>
              </section>
            ))}
          </div>
        </div>
      ) : !loading && (
        <div className="card muted">Aucune fiche processus n'est encore associée à ce processus.</div>
      )}

      {process && (
        <div className="card">
          <BpmnDiagram
            processId={process.id}
            xml={process.bpmn_xml}
            editable={auth.role === "gestionnaire"}
          />
        </div>
      )}
    </div>
  );
}

export default ProcessDetailPage;
