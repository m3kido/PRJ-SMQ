import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import NonConformityForm from "../components/NonConformityForm";
import NonConformityEditModal from "../components/NonConformityEditModal";
import SortableHeader from "../components/SortableHeader";
import { TableLoadingRow } from "../components/LoadingStates";
import { ShowMoreButton, useShowMoreList } from "../components/ShowMoreList";
import { sortItems, SortConfig } from "../utils/tableSort";

type NC = {
  id: number;
  reference: string;
  process: number;
  process_name: string;
  criterion: number | null;
  criterion_title: string;
  severity: string;
  status: string;
  detected_at: string;
  description: string;
};

const ncSortAccessors = {
  process: (item: NC) => item.process_name,
  criterion: (item: NC) => item.criterion_title,
  severity: (item: NC) => item.severity,
  description: (item: NC) => item.description,
};

function NonConformitiesPage() {
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<NC[]>("/non-conformities/?active=true");
  const { mutate, error: deleteError } = useMutation();
  const ncs = data ?? [];
  const [editing, setEditing] = useState<NC | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const sortedNCs = useMemo(() => sortItems(ncs, sortConfig, ncSortAccessors), [ncs, sortConfig]);
  const initialLoading = loading && !data;
  const isAdmin = auth.role === "admin";
  const paginatedNCs = useShowMoreList(sortedNCs, [sortConfig?.key, sortConfig?.direction, sortedNCs.length]);

  const deleteNonConformity = async (nc: NC) => {
    if (!window.confirm(`Supprimer la non-conformité de ${nc.process_name || "ce processus"} ?`)) return;
    try {
      await mutate("delete", `/non-conformities/${nc.id}/`);
    } catch {
      return;
    }
    refetch();
  };

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Non-Conformités</h3>
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        {deleteError && <div style={{ color: "#b91c1c" }}>{deleteError}</div>}
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Processus" sortKey="process" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Critère" sortKey="criterion" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Sévérité" sortKey="severity" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Description" sortKey="description" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initialLoading ? (
              <TableLoadingRow colSpan={5} label="Chargement des non-conformités..." />
            ) : paginatedNCs.visibleItems.map((nc) => (
              <tr key={nc.id}>
                <td>{nc.process_name || "-"}</td>
                <td>{nc.criterion_title || "-"}</td>
                <td>
                  <span className={`badge ${nc.severity}`}>{nc.severity}</span>
                </td>
                <td className="table-copy-cell">{nc.description}</td>
                <td className="table-actions">
                  <button className="tag" onClick={() => setEditing(nc)}>
                    Éditer
                  </button>
                  {isAdmin && (
                    <button className="tag danger-tag" type="button" onClick={() => deleteNonConformity(nc)}>
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!initialLoading && sortedNCs.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-row">Aucune non-conformité ouverte.</td>
              </tr>
            )}
          </tbody>
        </table>
        {!initialLoading && (
          <ShowMoreButton
            shownCount={paginatedNCs.shownCount}
            totalCount={paginatedNCs.totalCount}
            onShowMore={paginatedNCs.showMore}
          />
        )}
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
