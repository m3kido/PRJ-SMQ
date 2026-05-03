import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/date";
import SortableHeader from "../components/SortableHeader";
import { sortItems, SortConfig } from "../utils/tableSort";

type AuditAssignment = {
  id: number;
  process_name: string;
  due_date: string;
  status: string;
};

const auditSortAccessors = {
  process: (item: AuditAssignment) => item.process_name,
  due_date: (item: AuditAssignment) => item.due_date,
  status: (item: AuditAssignment) => item.status,
};

function AuditeurWorkspacePage() {
  const { data: assignments } = useFetch<AuditAssignment[]>("/audit-assignments/");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const sortedAssignments = useMemo(() => sortItems(assignments ?? [], sortConfig, auditSortAccessors), [assignments, sortConfig]);

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Auditeur interne</div>
          <h1 className="dashboard-title">Audits assignés</h1>
          <p className="dashboard-copy">Lancez directement les audits qui vous sont affectés. Les dernières valeurs auditées sont préchargées quand elles existent.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Audits assignés</span>
          <strong>{(assignments ?? []).length}</strong>
        </div>
      </section>

      <div className="card panel-large">
        <h3 className="section-title">Mes audits</h3>
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Processus" sortKey="process" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Échéance" sortKey="due_date" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <SortableHeader label="Statut" sortKey="status" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedAssignments.map((item) => (
              <tr key={item.id}>
                <td>{item.process_name}</td>
                <td>{formatDate(item.due_date)}</td>
                <td>{item.status}</td>
                <td>
                  <Link className="tag" to={`/audit-execution/${item.id}${item.status === "closed" ? "" : "?start=1"}`}>
                    {item.status === "closed" ? "Consulter" : "Lancer l'audit"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditeurWorkspacePage;
