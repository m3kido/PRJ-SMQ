import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";

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

function GestionnaireWorkspacePage() {
  const { data } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: nonConformities } = useFetch<NonConformity[]>("/non-conformities/");
  const { data: audits } = useFetch<AuditAssignment[]>("/audit-assignments/");
  const myProcessIds = new Set((data ?? []).map((item) => item.process));
  const relatedNCs = (nonConformities ?? []).filter((item) => myProcessIds.has(item.process));
  const relatedAudits = (audits ?? []).filter((item) => myProcessIds.has(item.process));

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
              <th>Processus</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.process_name}</td>
                <td>{new Date(item.due_date).toLocaleDateString()}</td>
                <td>{item.status}</td>
                <td>
                  <Link className="tag" to={`/process-sheets/${item.id}`}>
                    Lancer la création
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
              <th>Référence</th>
              <th>Sévérité</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {relatedNCs.map((item) => (
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
        <h3 className="section-title">Audits sur mes processus</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Audit</th>
              <th>Processus</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {relatedAudits.map((item) => (
              <tr key={item.id}>
                <td>{`AUD-${item.audit}`}</td>
                <td>{item.process_name}</td>
                <td>{new Date(item.due_date).toLocaleDateString()}</td>
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
