import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/date";
import SortableHeader from "../components/SortableHeader";
import { sortItems, SortConfig } from "../utils/tableSort";

type ManagedSheet = {
  id: number;
  process: number;
  process_name: string;
  due_date: string;
  status: string;
};

type NonConformity = {
  id: number;
  reference: string;
  process: number;
  severity: string;
  status: string;
};

type AuditAssignment = {
  id: number;
  audit: number;
  process: number;
  process_name: string;
  due_date: string;
  status: string;
};

type CorrectiveAction = {
  id: number;
  process: number | null;
  process_name?: string;
  title: string;
  body: string;
  assignee_username?: string;
  completed: boolean;
};

const processSortAccessors = {
  process: (item: ManagedSheet) => item.process_name,
  due_date: (item: ManagedSheet) => item.due_date,
  status: (item: ManagedSheet) => item.status,
};

const ncSortAccessors = {
  reference: (item: NonConformity) => item.reference,
  severity: (item: NonConformity) => item.severity,
  status: (item: NonConformity) => item.status,
};

const auditSortAccessors = {
  audit: (item: AuditAssignment) => item.audit,
  process: (item: AuditAssignment) => item.process_name,
  due_date: (item: AuditAssignment) => item.due_date,
  status: (item: AuditAssignment) => item.status,
};

const actionSortAccessors = {
  title: (item: CorrectiveAction) => item.title,
  process: (item: CorrectiveAction) => item.process_name ?? "",
  status: (item: CorrectiveAction) => item.completed,
};

function GestionnaireWorkspacePage() {
  const { data } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: nonConformities } = useFetch<NonConformity[]>("/non-conformities/");
  const { data: audits } = useFetch<AuditAssignment[]>("/audit-assignments/");
  const { data: correctiveActions } = useFetch<CorrectiveAction[]>("/actions/");
  const [processSort, setProcessSort] = useState<SortConfig>(null);
  const [ncSort, setNcSort] = useState<SortConfig>(null);
  const [auditSort, setAuditSort] = useState<SortConfig>(null);
  const [actionSort, setActionSort] = useState<SortConfig>(null);
  const myProcessIds = new Set((data ?? []).map((item) => item.process));
  const relatedNCs = (nonConformities ?? []).filter((item) => myProcessIds.has(item.process));
  const relatedAudits = (audits ?? []).filter((item) => myProcessIds.has(item.process));
  const relatedActions = (correctiveActions ?? []).filter((item) => item.process && myProcessIds.has(item.process));
  const sortedProcesses = useMemo(() => sortItems(data ?? [], processSort, processSortAccessors), [data, processSort]);
  const sortedNCs = useMemo(() => sortItems(relatedNCs, ncSort, ncSortAccessors), [relatedNCs, ncSort]);
  const sortedAudits = useMemo(() => sortItems(relatedAudits, auditSort, auditSortAccessors), [relatedAudits, auditSort]);
  const sortedActions = useMemo(() => sortItems(relatedActions, actionSort, actionSortAccessors), [relatedActions, actionSort]);

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Gestionnaire</div>
          <h1 className="dashboard-title">Processus assignés à renseigner</h1>
          <p className="dashboard-copy">Retrouvez les fiches processus qui vous sont affectées, les audits liés et les rapports disponibles.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Fiches assignées</span>
          <strong>{(data ?? []).length}</strong>
        </div>
      </section>

      <div className="card">
        <h3 className="section-title">Mes processus</h3>
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Processus" sortKey="process" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <SortableHeader label="Échéance" sortKey="due_date" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <SortableHeader label="Statut" sortKey="status" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedProcesses.map((item) => (
              <tr key={item.id}>
                <td>{item.process_name}</td>
                <td>{formatDate(item.due_date)}</td>
                <td>{item.status}</td>
                <td>
                  <Link className="tag" to={`/process-sheets/${item.id}${item.status === "draft" ? "?start=1" : ""}`}>
                    {item.status === "draft" ? "Lancer la création" : "Voir la fiche"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="section-title">Non-conformités sur mes processus</h3>
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Référence" sortKey="reference" sortConfig={ncSort} onSort={(key, direction) => setNcSort({ key, direction })} />
              <SortableHeader label="Sévérité" sortKey="severity" sortConfig={ncSort} onSort={(key, direction) => setNcSort({ key, direction })} />
              <SortableHeader label="Statut" sortKey="status" sortConfig={ncSort} onSort={(key, direction) => setNcSort({ key, direction })} />
            </tr>
          </thead>
          <tbody>
            {sortedNCs.map((item) => (
              <tr key={item.id}>
                <td>{item.reference}</td>
                <td>{item.severity}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="section-title">Actions correctives de mes processus</h3>
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Action" sortKey="title" sortConfig={actionSort} onSort={(key, direction) => setActionSort({ key, direction })} />
              <SortableHeader label="Processus" sortKey="process" sortConfig={actionSort} onSort={(key, direction) => setActionSort({ key, direction })} />
              <SortableHeader label="Statut" sortKey="status" sortConfig={actionSort} onSort={(key, direction) => setActionSort({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedActions.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.process_name ?? "-"}</td>
                <td>{item.completed ? "Clôturée" : "Ouverte"}</td>
                <td><Link className="tag" to={`/actions/${item.id}`}>Consulter</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="section-title">Audits sur mes processus</h3>
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Audit" sortKey="audit" sortConfig={auditSort} onSort={(key, direction) => setAuditSort({ key, direction })} />
              <SortableHeader label="Processus" sortKey="process" sortConfig={auditSort} onSort={(key, direction) => setAuditSort({ key, direction })} />
              <SortableHeader label="Échéance" sortKey="due_date" sortConfig={auditSort} onSort={(key, direction) => setAuditSort({ key, direction })} />
              <SortableHeader label="Statut" sortKey="status" sortConfig={auditSort} onSort={(key, direction) => setAuditSort({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedAudits.map((item) => (
              <tr key={item.id}>
                <td>{`AUD-${item.audit}`}</td>
                <td>{item.process_name}</td>
                <td>{formatDate(item.due_date)}</td>
                <td>{item.status}</td>
                <td>
                  <Link className="tag" to={`/audit-reports/${item.id}`}>
                    Voir le rapport
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

export default GestionnaireWorkspacePage;
