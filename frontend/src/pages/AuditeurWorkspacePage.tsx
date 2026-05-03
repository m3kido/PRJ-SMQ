import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";

type AuditAssignment = {
  id: number;
  process_name: string;
  due_date: string;
  status: string;
};

function AuditeurWorkspacePage() {
  const { data: assignments } = useFetch<AuditAssignment[]>("/audit-assignments/");

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Auditeur interne</div>
          <h1 className="dashboard-title">Audits assignés</h1>
          <p className="dashboard-copy">Lancez directement les audits qui vous sont affectés. Les dernières valeurs déjà auditées sont préchargées automatiquement quand elles existent.</p>
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
              <th>Processus</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(assignments ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.process_name}</td>
                <td>{new Date(item.due_date).toLocaleDateString()}</td>
                <td>{item.status}</td>
                <td>
                  <Link className="tag" to={`/audit-execution/${item.id}`}>
                    Lancer l'audit
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
