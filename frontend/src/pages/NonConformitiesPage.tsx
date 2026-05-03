import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import NonConformityForm from "../components/NonConformityForm";
import NonConformityEditModal from "../components/NonConformityEditModal";
import SortableHeader from "../components/SortableHeader";
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
  const { data, loading, error, refetch } = useFetch<NC[]>("/non-conformities/?active=true");
  const ncs = data ?? [];
  const [editing, setEditing] = useState<NC | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const sortedNCs = useMemo(() => sortItems(ncs, sortConfig, ncSortAccessors), [ncs, sortConfig]);

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
              <SortableHeader label="Processus" sortKey="process" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Critère" sortKey="criterion" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Sévérité" sortKey="severity" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Description" sortKey="description" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedNCs.map((nc) => (
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
