import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import ActionForm from "../components/ActionForm";
import ActionEditModal from "../components/ActionEditModal";

type Action = {
  id: number;
  title: string;
  due_date: string | null;
  completed: boolean;
  non_conformity: { id: number; reference: string };
  assignee: { id: number; username: string };
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
              <th>NC liée</th>
              <th>Assigné à</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.non_conformity?.reference ?? ""}</td>
                <td>{a.assignee?.username ?? ""}</td>
                <td>{a.due_date ? new Date(a.due_date).toLocaleDateString() : ""}</td>
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
