import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { formatDate } from "../utils/date";

type Assignment = {
  id: number;
  audit: number;
  process_name: string;
  process_type?: string;
  process_department_name?: string;
  auditor_username: string;
  due_date?: string;
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
  process_name?: string;
  severity: string;
  status: string;
  description: string;
  criterion_code?: string;
  criterion_title?: string;
};

function processTypeLabel(value?: string) {
  if (value === "operationnel") return "Opérationnel";
  if (value === "support") return "Support";
  if (value === "management") return "Management";
  return value ?? "-";
}

function rateTone(rate: string | null) {
  const value = Number(rate ?? 0);
  if (value >= 90) return "good";
  if (value >= 60) return "watch";
  return "critical";
}

function AuditReportPage() {
  const { id } = useParams();
  const { data: assignment } = useFetch<Assignment>(`/audit-assignments/${id}/`, [id]);
  const { data: results } = useFetch<ComputedResult[]>("/audit-computed-results/");
  const { data: assessments } = useFetch<Assessment[]>(id ? `/audit-criterion-assessments/?assignment=${id}` : "/audit-criterion-assessments/?assignment=0", [id]);
  const { data: clauses } = useFetch<Clause[]>("/iso-clauses/");
  const { data: ncs } = useFetch<NonConformity[]>(assignment?.audit ? `/non-conformities/?audit=${assignment.audit}` : "/non-conformities/?audit=0", [assignment?.audit]);

  const result = (results ?? []).find((item) => String(item.assignment) === String(id));
  const criteria = new Map((clauses ?? []).flatMap((clause) => clause.criteria.map((criterion) => [criterion.id, criterion])));
  const sortedAssessments = [...(assessments ?? [])].sort((a, b) => (criteria.get(a.criterion)?.code ?? "").localeCompare(criteria.get(b.criterion)?.code ?? ""));
  const conformes = sortedAssessments.filter((item) => Number(item.conformity_rate ?? 0) >= 90).length;
  const openNcs = (ncs ?? []).filter((item) => item.status !== "resolue");
  const reportDate = formatDate(new Date());
  const reportTitle = `Rapport AUD-${assignment?.audit ?? id} - ${assignment?.process_name ?? "Audit"}`;

  const exportPdf = () => {
    const previousTitle = document.title;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    document.title = reportTitle;
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  return (
    <div className="dashboard-stack audit-report-page">
      <div className="report-toolbar no-print">
        <div>
          <div className="eyebrow">Rapport d'audit</div>
          <h1 className="section-title" style={{ margin: 0 }}>{assignment?.process_name ?? "Audit"}</h1>
        </div>
        <button className="btn-primary" onClick={exportPdf}>
          Exporter PDF
        </button>
      </div>

      <article className="pdf-report">
        <section className="report-cover">
          <div className="report-cover-top">
            <div>
              <div className="report-brand">ESI SMQ</div>
              <div className="report-subtitle">Système de management qualité</div>
            </div>
            <div className="report-ref">
              <span>Rapport</span>
              <strong>AUD-{assignment?.audit ?? id}</strong>
            </div>
          </div>
          <div className="report-title-block">
            <div className="eyebrow">Rapport d'audit</div>
            <h1>{assignment?.process_name ?? "Audit"}</h1>
            <p>{result?.conformity_label ?? "Synthèse établie à partir des critères évalués et des non-conformités constatées."}</p>
          </div>
          <div className="report-meta-grid">
            <div>
              <span>Auditeur</span>
              <strong>{assignment?.auditor_username ?? "-"}</strong>
            </div>
            <div>
              <span>Département</span>
              <strong>{assignment?.process_department_name ?? "-"}</strong>
            </div>
            <div>
              <span>Type de processus</span>
              <strong>{processTypeLabel(assignment?.process_type)}</strong>
            </div>
            <div>
              <span>Date du rapport</span>
              <strong>{reportDate}</strong>
            </div>
            <div>
              <span>Échéance</span>
              <strong>{formatDate(assignment?.due_date, "-")}</strong>
            </div>
            <div>
              <span>Statut</span>
              <strong>{assignment?.status ?? "-"}</strong>
            </div>
          </div>
        </section>

        <section className="report-section">
          <div className="report-section-head">
            <div>
              <div className="eyebrow">Synthèse</div>
              <h2>Résultat global</h2>
            </div>
          </div>
          <div className="report-kpi-grid">
            <div className="report-kpi-card primary">
              <span>Taux moyen</span>
              <strong>{result?.average_rate ?? "0"}%</strong>
            </div>
            <div className="report-kpi-card">
              <span>Niveau</span>
              <strong>{result?.conformity_level ?? "-"}</strong>
            </div>
            <div className="report-kpi-card">
              <span>Critères conformes</span>
              <strong>{conformes}/{sortedAssessments.length}</strong>
            </div>
            <div className="report-kpi-card">
              <span>NC ouvertes</span>
              <strong>{openNcs.length}</strong>
            </div>
          </div>
        </section>

        <section className="report-section">
          <div className="report-section-head">
            <div>
              <div className="eyebrow">Constats</div>
              <h2>Non-conformités</h2>
            </div>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Processus</th>
                <th>Critère</th>
                <th>Sévérité</th>
                <th>État</th>
                <th>Constat</th>
              </tr>
            </thead>
            <tbody>
              {(ncs ?? []).length ? (ncs ?? []).map((nc) => (
                <tr key={nc.id}>
                  <td>{nc.process_name ?? assignment?.process_name ?? "-"}</td>
                  <td>{nc.criterion_title || nc.criterion_code || "-"}</td>
                  <td><span className={`report-pill ${nc.severity}`}>{nc.severity}</span></td>
                  <td>{nc.status}</td>
                  <td>{nc.description}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>Aucune non-conformité liée à cet audit.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="report-section">
          <div className="report-section-head">
            <div>
              <div className="eyebrow">Évaluation</div>
              <h2>Valeurs des critères</h2>
            </div>
          </div>
          <table className="report-table">
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
                    <td><span className={`report-rate ${rateTone(assessment.conformity_rate)}`}>{assessment.conformity_rate ?? "-"}%</span></td>
                    <td>{assessment.comment || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <footer className="report-footer">
          <span>Rapport AUD-{assignment?.audit ?? id}</span>
          <span>Généré le {reportDate}</span>
        </footer>
      </article>
    </div>
  );
}

export default AuditReportPage;
