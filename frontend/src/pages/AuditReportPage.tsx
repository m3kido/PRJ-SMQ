import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";

type Assignment = {
  id: number;
  audit: number;
  process_name: string;
  auditor_username: string;
  status: string;
};

type ComputedResult = {
  assignment: number;
  average_rate: string;
  conformity_level: string;
  conformity_label: string;
};

type Assessment = {
  id: number;
  criterion: number;
  conformity_rate: string | null;
  comment: string;
};

type Clause = {
  id: number;
  criteria: { id: number; code: string; title: string }[];
};

type NonConformity = {
  id: number;
  reference: string;
  severity: string;
  status: string;
  description: string;
  criterion_code?: string;
  criterion_title?: string;
};

function AuditReportPage() {
  const { id } = useParams();
  const { data: assignment } = useFetch<Assignment>(`/audit-assignments/${id}/`, [id]);
  const { data: results } = useFetch<ComputedResult[]>("/audit-computed-results/");
  const { data: assessments } = useFetch<Assessment[]>(id ? `/audit-criterion-assessments/?assignment=${id}` : "/audit-criterion-assessments/", [id]);
  const { data: clauses } = useFetch<Clause[]>("/iso-clauses/");
  const { data: ncs } = useFetch<NonConformity[]>(assignment?.audit ? `/non-conformities/?audit=${assignment.audit}` : "/non-conformities/", [assignment?.audit]);

  const result = (results ?? []).find((item) => String(item.assignment) === String(id));
  const criteria = new Map((clauses ?? []).flatMap((clause) => clause.criteria.map((criterion) => [criterion.id, criterion])));
  const sortedAssessments = [...(assessments ?? [])].sort((a, b) => (criteria.get(a.criterion)?.code ?? "").localeCompare(criteria.get(b.criterion)?.code ?? ""));
  const conformes = sortedAssessments.filter((item) => Number(item.conformity_rate ?? 0) >= 90).length;

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero audit-report-hero">
        <div>
          <div className="eyebrow">Rapport d'audit</div>
          <h1 className="dashboard-title">{assignment?.process_name ?? "Audit"}</h1>
          <p className="dashboard-copy">Le rapport affiche d'abord les statistiques globales, puis le détail des critères évalués.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Auditeur</span>
          <strong>{assignment?.auditor_username ?? "-"}</strong>
        </div>
      </section>

      <div className="grid stats">
        <div className="card stat-card stat-card-primary">
          <div className="card-title">Taux moyen</div>
          <div className="card-value">{result?.average_rate ?? "0"}%</div>
          <div className="muted">Résultat global calculé</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Niveau</div>
          <div className="card-value">{result?.conformity_level ?? "-"}</div>
          <div className="muted">{result?.conformity_label ?? "Aucune synthèse"}</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Critères conformes</div>
          <div className="card-value">{conformes}</div>
          <div className="muted">Seuil de conformité atteint</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">NC ouvertes</div>
          <div className="card-value">{(ncs ?? []).filter((item) => item.status !== "resolue").length}</div>
          <div className="muted">Issues du dernier audit</div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Non-conformités</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Critère</th>
              <th>Sévérité</th>
              <th>Statut</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {(ncs ?? []).map((nc) => (
              <tr key={nc.id}>
                <td>{nc.reference}</td>
                <td>{nc.criterion_code ? `${nc.criterion_code} — ${nc.criterion_title ?? ""}` : "-"}</td>
                <td>{nc.severity}</td>
                <td>{nc.status}</td>
                <td>{nc.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="section-title">Valeurs des critères</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Critère</th>
              <th>Taux</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssessments.map((assessment) => {
              const criterion = criteria.get(assessment.criterion);
              return (
                <tr key={assessment.id}>
                  <td>{criterion?.code ?? "-"}</td>
                  <td>{criterion?.title ?? "-"}</td>
                  <td>{assessment.conformity_rate ?? "-"}%</td>
                  <td>{assessment.comment || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditReportPage;
