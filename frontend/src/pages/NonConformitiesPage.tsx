import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import NonConformityForm from "../components/NonConformityForm";
import NonConformityEditModal from "../components/NonConformityEditModal";

type NC = {
  id: number;
  reference: string;
  process: { id: number; name: string };
  severity: string;
  status: string;
  detected_at: string;
  description: string;
};

function NonConformitiesPage() {
  const { data, loading, error, refetch } = useFetch<NC[]>("/non-conformities/");
  const ncs = data ?? [];
  const [editing, setEditing] = useState<NC | null>(null);

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Non-Conformités</h3>
        </div>
        {loading && <div className="muted">Chargement...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Processus</th>
              <th>Sévérité</th>
              <th>Statut</th>
              <th>Détectée le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ncs.map((nc) => (
              <tr key={nc.id}>
                <td>{nc.reference}</td>
                <td>{nc.process?.name ?? ""}</td>
                <td>
                  <span className={`badge ${nc.severity}`}>{nc.severity}</span>
                </td>
                <td>{nc.status}</td>
                <td>{new Date(nc.detected_at).toLocaleDateString()}</td>
                <td className="table-actions">
                  <button className="tag" onClick={() => setEditing(nc)}>
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card compact-form-card">
        <NonConformityForm onSuccess={refetch} />
      </div>
      <NonConformityEditModal
        open={Boolean(editing)}
        nc={editing}
        onClose={() => setEditing(null)}
        onSuccess={refetch}
      />
    </>
  );
}

export default NonConformitiesPage;
