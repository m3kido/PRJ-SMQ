import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { LoadingCard } from "../components/LoadingStates";
import { formatDateTime } from "../utils/date";

type Action = {
  id: number;
  process: number | null;
  process_name?: string;
  non_conformity_reference?: string;
  title: string;
  body: string;
  assignee_username?: string;
  completed: boolean;
  evidence?: string | null;
  history?: {
    id: number;
    actor_username?: string;
    event_type: string;
    message: string;
    created_at: string;
  }[];
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

function eventLabel(value: string) {
  if (value === "created") return "Création";
  if (value === "completed") return "Clôture";
  if (value === "reopened") return "Réouverture";
  return "Mise à jour";
}

function ActionDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const { data: action, loading, error, refetch } = useFetch<Action>(`/actions/${id}/`, [id]);
  const { mutate, loading: saving, error: saveError } = useMutation();
  const evidenceUrl = fileUrl(action?.evidence);
  const canClose = ["admin", "responsable_qualite", "auditeur_interne", "gestionnaire"].includes(auth.role ?? "");

  const closeAction = async () => {
    if (!action) return;
    await mutate("patch", `/actions/${action.id}/`, { completed: true });
    refetch();
  };

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
          {action && canClose && !action.completed && (
            <button className="tag action-close-hero-button" type="button" onClick={closeAction} disabled={saving}>
              {saving ? "Clôture..." : "Clôturer"}
            </button>
          )}
        </div>
      </section>

      {loading && !action && <LoadingCard title="Chargement de l'action" description="Récupération du détail complet..." />}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}
      {saveError && <div className="card" style={{ color: "#b91c1c" }}>{saveError}</div>}

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

          <div className="card action-history-card">
            <div className="history-section-head">
              <div>
                <div className="eyebrow">Journal</div>
                <h3 className="section-title">Historique</h3>
              </div>
              <span className="tag">{action.history?.length ?? 0} événement(s)</span>
            </div>
            <div className="action-timeline">
              {action.history?.length ? action.history.map((item) => (
                <div key={item.id} className="action-timeline-item">
                  <div className="action-timeline-dot" />
                  <div className="action-timeline-content">
                    <div className="action-timeline-head">
                      <span className={`history-event-chip ${item.event_type}`}>{eventLabel(item.event_type)}</span>
                      <time>{formatDateTime(item.created_at, "-")}</time>
                    </div>
                    <p>{item.message}</p>
                    <div className="history-actor">Par {item.actor_username ?? "Système"}</div>
                  </div>
                </div>
              )) : (
                <div className="muted">Aucun historique disponible pour cette action.</div>
              )}
            </div>
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
