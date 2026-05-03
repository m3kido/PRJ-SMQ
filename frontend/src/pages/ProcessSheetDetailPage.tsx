import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type ProcessSheet = {
  id: number;
  process_name: string;
  manager_username: string;
  due_date: string;
  status: string;
  sheet_data: Record<string, unknown>;
};

function renderValue(value: unknown) {
  if (Array.isArray(value)) {
    return (
      <ul className="fiche-list">
        {value.map((item, index) => (
          <li key={index}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="fiche-grid">
        {Object.entries(value as Record<string, unknown>).map(([key, nested]) => (
          <div key={key} className="fiche-item fiche-item-block">
            <div className="fiche-label">{key.replace(/_/g, " ")}</div>
            <div className="fiche-content">{renderValue(nested)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="fiche-text">{String(value ?? "")}</div>;
}

function ProcessSheetDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<ProcessSheet>(`/managed-process-sheets/${id}/`, [id]);
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.sheet_data) {
      const nextDraft: Record<string, string> = {};
      Object.entries(data.sheet_data).forEach(([section, value]) => {
        nextDraft[section] = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      });
      setDraft(nextDraft);
    }
  }, [data]);

  const saveSheet = async (status: "draft" | "submitted") => {
    if (!data) return;
    const nextData: Record<string, unknown> = {};
    Object.entries(draft).forEach(([section, raw]) => {
      try {
        nextData[section] = JSON.parse(raw);
      } catch {
        nextData[section] = raw;
      }
    });
    await mutate("patch", `/managed-process-sheets/${data.id}/`, {
      sheet_data: nextData,
      status,
    });
    setEditing(false);
    refetch();
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Fiche processus</div>
          <h1 className="dashboard-title">{data?.process_name ?? "Chargement..."}</h1>
          <p className="dashboard-copy">
            Vue détaillée de la fiche processus, structurée pour lecture, audit et traçabilité.
          </p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Statut</span>
          <strong>{data?.status ?? "-"}</strong>
        </div>
      </section>

      <div className="card fiche-meta-bar">
        <div><strong>Gestionnaire:</strong> {data?.manager_username ?? "-"}</div>
        <div><strong>Échéance:</strong> {data?.due_date ? new Date(data.due_date).toLocaleDateString() : "-"}</div>
        {auth.role === "gestionnaire" && data && (
          <button className="tag" onClick={() => setEditing((v) => !v)}>{editing ? "Annuler" : "Modifier la fiche"}</button>
        )}
        <div><Link className="tag" to="/">Retour</Link></div>
      </div>

      {loading && <div className="card muted">Chargement...</div>}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {data?.sheet_data && (
        <div className="card">
          {Object.entries(data.sheet_data).map(([section, value]) => (
            <section key={section} className="fiche-section">
              <h3 className="section-title">{section.replace(/_/g, " ")}</h3>
              {editing && auth.role === "gestionnaire" ? (
                <textarea
                  value={draft[section] ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [section]: e.target.value }))}
                  style={{ width: "100%", minHeight: 180, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", fontFamily: "monospace" }}
                />
              ) : (
                renderValue(value)
              )}
            </section>
          ))}
          {editing && auth.role === "gestionnaire" && (
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="btn-primary" onClick={() => saveSheet("draft")} disabled={saving}>Enregistrer</button>
              <button className="btn-primary" onClick={() => saveSheet("submitted")} disabled={saving}>Soumettre la fiche</button>
            </div>
          )}
          {saveError && <div style={{ color: "#b91c1c", marginTop: 12 }}>{saveError}</div>}
        </div>
      )}
    </div>
  );
}

export default ProcessSheetDetailPage;
