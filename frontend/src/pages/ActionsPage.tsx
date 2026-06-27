import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import ActionForm from "../components/ActionForm";
import ActionEditModal from "../components/ActionEditModal";
import SortableHeader from "../components/SortableHeader";
import { TableLoadingRow } from "../components/LoadingStates";
import { ShowMoreButton, useShowMoreList } from "../components/ShowMoreList";
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
  const { mutate, error: actionError } = useMutation();
  const actions = data ?? [];
  const [editing, setEditing] = useState<Action | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const sortedActions = useMemo(() => sortItems(actions, sortConfig, actionSortAccessors), [actions, sortConfig]);
  const isAdmin = auth.role === "admin";
  const canManageActions = auth.role === "admin" || auth.role === "responsable_qualite" || auth.role === "auditeur_interne";
  const canCloseActions = canManageActions || auth.role === "gestionnaire";
  const initialLoading = loading && !data;
  const paginatedActions = useShowMoreList(sortedActions, [sortConfig?.key, sortConfig?.direction, sortedActions.length]);

  const deleteAction = async (action: Action) => {
    if (!window.confirm(`Supprimer l'action corrective ${action.title} ?`)) return;
    try {
      await mutate("delete", `/actions/${action.id}/`);
    } catch {
      return;
    }
    refetch();
  };

  const closeAction = async (action: Action) => {
    await mutate("patch", `/actions/${action.id}/`, { completed: true });
    refetch();
  };

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Actions Correctives</h3>
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        {actionError && <div style={{ color: "#b91c1c" }}>{actionError}</div>}
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
            {initialLoading ? (
              <TableLoadingRow colSpan={5} label="Chargement des actions..." />
            ) : paginatedActions.visibleItems.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.process_name ?? "-"}</td>
                <td>{a.assignee_username ?? "-"}</td>
                <td>{a.completed ? "Clôturée" : "Ouverte"}</td>
                <td className="table-actions">
                  <Link className="tag" to={`/actions/${a.id}`}>
                    Consulter
                  </Link>
                  {canCloseActions && !a.completed && (
                    <button className="tag" type="button" onClick={() => closeAction(a)}>
                      Clôturer
                    </button>
                  )}
                  {canManageActions && (
                    <button className="tag" onClick={() => setEditing(a)}>
                      Éditer
                    </button>
                  )}
                  {isAdmin && (
                    <button className="tag danger-tag" type="button" onClick={() => deleteAction(a)}>
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!initialLoading && sortedActions.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-row">Aucune action corrective à afficher.</td>
              </tr>
            )}
          </tbody>
        </table>
        {!initialLoading && (
          <ShowMoreButton
            shownCount={paginatedActions.shownCount}
            totalCount={paginatedActions.totalCount}
            onShowMore={paginatedActions.showMore}
          />
        )}
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
