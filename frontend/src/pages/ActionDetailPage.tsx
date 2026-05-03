import { Link, useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { LoadingCard } from "../components/LoadingStates";
import { formatDate, formatDateTime } from "../utils/date";

type Action = {
  id: number;
  process: number | null;
  process_name?: string;
  non_conformity_reference?: string;
  title: string;
  body: string;
  assignee_username?: string;
  due_date?: string | null;
  completed: boolean;
  evidence?: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8500/api";

function fileUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const host = API_BASE.replace(/\/api\/?$/, "");
  return `${host}${value.startsWith("/") ? "" : "/"}${value}`;
}

function ActionDetailPage() {
  const { id } = useParams();
  const { data: action, loading, error } = useFetch<Action>(`/actions/${id}/`, [id]);
  const evidenceUrl = fileUrl(action?.evidence);

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Action corrective</div>
          <h1 className="dashboard-title">{action?.title ?? "Chargement..."}</h1>
          <p className="dashboard-copy">Détail complet de l'action, du processus concerné et du responsable chargé du traitement.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Statut</span>
          <strong>{action?.completed ? "Clôturée" : "Ouverte"}</strong>
        </div>
      </section>

      {loading && !action && <LoadingCard title="Chargement de l'action" description="Récupération du détail complet..." />}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {action && (
        <>
          <div className="card action-detail-meta">
            <div>
              <span className="fiche-label">Processus</span>
              <strong>{action.process_name ?? "-"}</strong>
            </div>
            <div>
              <span className="fiche-label">Responsable</span>
              <strong>{action.assignee_username ?? "-"}</strong>
            </div>
            <div>
              <span className="fiche-label">Non-conformité</span>
              <strong>{action.non_conformity_reference || "-"}</strong>
            </div>
            <div>
              <span className="fiche-label">Échéance</span>
              <strong>{formatDate(action.due_date, "-")}</strong>
            </div>
          </div>

          <div className="card action-detail-body">
            <h3 className="section-title">Description</h3>
            <p>{action.body || "-"}</p>
          </div>

          <div className="card action-detail-meta">
            <div>
              <span className="fiche-label">Créée le</span>
              <strong>{formatDateTime(action.created_at, "-")}</strong>
            </div>
            <div>
              <span className="fiche-label">Mise à jour</span>
              <strong>{formatDateTime(action.updated_at, "-")}</strong>
            </div>
            <div>
              <span className="fiche-label">Preuve</span>
              {evidenceUrl ? <a className="tag" href={evidenceUrl} target="_blank" rel="noreferrer">Ouvrir</a> : <strong>-</strong>}
            </div>
            {action.process && (
              <div>
                <span className="fiche-label">Processus</span>
                <Link className="tag" to={`/processes/${action.process}`}>Voir le processus</Link>
              </div>
            )}
          </div>
        </>
      )}

      <div>
        <Link className="tag" to="/actions">Retour aux actions</Link>
      </div>
    </div>
  );
}

export default ActionDetailPage;
