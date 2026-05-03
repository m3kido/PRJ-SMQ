import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import ActionForm from "../components/ActionForm";
import ActionEditModal from "../components/ActionEditModal";
import SortableHeader from "../components/SortableHeader";
import { sortItems, SortConfig } from "../utils/tableSort";

type Action = {
  id: number;
  process: number | null;
  process_name?: string;
  title: string;
  body: string;
  assignee_username?: string;
  completed: boolean;
};

const actionSortAccessors = {
  title: (action: Action) => action.title,
  process: (action: Action) => action.process_name ?? "",
  assignee: (action: Action) => action.assignee_username ?? "",
  status: (action: Action) => action.completed,
};

function ActionsPage() {
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<Action[]>("/actions/");
  const actions = data ?? [];
  const [editing, setEditing] = useState<Action | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const sortedActions = useMemo(() => sortItems(actions, sortConfig, actionSortAccessors), [actions, sortConfig]);
  const canManageActions = auth.role === "admin" || auth.role === "auditeur_interne";

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
              <SortableHeader label="Action" sortKey="title" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Processus" sortKey="process" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Assigné à" sortKey="assignee" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Statut" sortKey="status" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedActions.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.process_name ?? "-"}</td>
                <td>{a.assignee_username ?? "-"}</td>
                <td>{a.completed ? "Clôturée" : "Ouverte"}</td>
                <td className="table-actions">
                  <Link className="tag" to={`/actions/${a.id}`}>
                    Consulter
                  </Link>
                  {canManageActions && (
                    <button className="tag" onClick={() => setEditing(a)}>
                      Éditer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canManageActions && (
        <div className="card compact-form-card">
          <ActionForm onSuccess={refetch} />
        </div>
      )}
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
