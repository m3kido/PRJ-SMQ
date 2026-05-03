import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import ActionForm from "../components/ActionForm";
import ActionEditModal from "../components/ActionEditModal";

type Action = {
  id: number;
  process: number | null;
  process_name?: string;
  title: string;
  body: string;
  assignee_username?: string;
  completed: boolean;
};

function ActionsPage() {
  const { data, loading, error, refetch } = useFetch<Action[]>("/actions/");
  const actions = data ?? [];
  const [editing, setEditing] = useState<Action | null>(null);

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Actions Correctives</h3>
        </div>
        {loading && <div className="muted">Chargement...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Processus</th>
              <th>Assigné à</th>
              <th>Description</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.process_name ?? "-"}</td>
                <td>{a.assignee_username ?? "-"}</td>
                <td className="table-copy-cell">{a.body || "-"}</td>
                <td>{a.completed ? "Clôturée" : "Ouverte"}</td>
                <td className="table-actions">
                  <button className="tag" onClick={() => setEditing(a)}>
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card compact-form-card">
        <ActionForm onSuccess={refetch} />
      </div>
      <ActionEditModal
        open={Boolean(editing)}
        action={editing}
        onClose={() => setEditing(null)}
        onSuccess={refetch}
      />
    </>
  );
}

export default ActionsPage;
