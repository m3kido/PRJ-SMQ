import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { formatDate } from "../utils/date";

type Assignment = {
  id: number;
  audit: number;
  process: number;
  process_name: string;
  process_type?: string;
  due_date: string;
  status: string;
};

type Clause = {
  id: number;
  reference: string;
  title: string;
  criteria: { id: number; code: string; title: string; process_types?: string[] }[];
};

type AssessmentMap = Record<string, { conformity_rate: string; comment: string; proof: string; proofFile?: File | null }>;

type Assessment = {
  id: number;
  criterion: number;
  conformity_rate: string | null;
  comment: string;
  proofs?: { description: string; file?: string; title?: string }[];
};

type ComputedResult = {
  id: number;
  assignment: number;
  average_rate: string;
  conformity_level: string;
  conformity_label: string;
};

function normalizeRate(value: string | null | undefined) {
  if (!value) return "";
  return String(value).replace(/\.0+$/, "").trim();
}

function sanitizeRateInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  const parsed = Math.max(0, Math.min(100, Number(digits)));
  return String(parsed);
}

function criterionMatchesProcessType(criterion: Clause["criteria"][number], processType?: string) {
  return !processType || !criterion.process_types?.length || criterion.process_types.includes(processType);
}

function processTypeLabel(value?: string) {
  if (value === "operationnel") return "Opérationnel";
  if (value === "support") return "Support";
  if (value === "management") return "Management";
  return value ?? "-";
}

function AuditExecutionPage() {
  const { id } = useParams();
  const { data: assignment, loading, refetch: refetchAssignment } = useFetch<Assignment>(`/audit-assignments/${id}/`, [id]);
  const { data: clauses, loading: clausesLoading } = useFetch<Clause[]>("/iso-clauses/");
  const { data: currentAssessments } = useFetch<Assessment[]>(id ? `/audit-criterion-assessments/?assignment=${id}` : "/audit-criterion-assessments/?assignment=0", [id]);
  const { data: latestAssessments } = useFetch<Assessment[]>(
    assignment?.process ? `/audit-criterion-assessments/?latest_for_process=${assignment.process}` : "/audit-criterion-assessments/?assignment=0",
    [assignment?.process]
  );
  const { data: computedResults, refetch: refetchComputedResults } = useFetch<ComputedResult[]>("/audit-computed-results/");
  const { mutate, loading: saving, error } = useMutation();
  const [values, setValues] = useState<AssessmentMap>({});
  const [done, setDone] = useState(false);
  const saveTimeouts = useRef<Record<string, number>>({});
  const valuesRef = useRef<AssessmentMap>({});

  const sortedClauses = useMemo(
    () => [...(clauses ?? [])].sort((a, b) => a.reference.localeCompare(b.reference, undefined, { numeric: true })),
    [clauses]
  );

  const auditClauses = useMemo(
    () => sortedClauses
      .map((clause) => ({
        ...clause,
        criteria: [...clause.criteria]
          .filter((criterion) => criterionMatchesProcessType(criterion, assignment?.process_type))
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
      }))
      .filter((clause) => clause.criteria.length > 0),
    [assignment?.process_type, sortedClauses]
  );

  const allCriteria = useMemo(
    () => auditClauses.flatMap((clause) => clause.criteria.map((criterion) => ({ ...criterion, clause: clause.reference }))),
    [auditClauses]
  );

  const computedResult = (computedResults ?? []).find((item) => String(item.assignment) === String(id));
  const filledCriteriaCount = allCriteria.filter((criterion) => {
    const item = values[String(criterion.id)];
    return item?.conformity_rate || item?.comment || item?.proof || item?.proofFile;
  }).length;

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    if (currentAssessments?.length) {
      const nextValues: AssessmentMap = {};
      currentAssessments.forEach((item) => {
        nextValues[String(item.criterion)] = {
          conformity_rate: normalizeRate(item.conformity_rate),
          comment: item.comment ?? "",
          proof: item.proofs?.[0]?.description ?? "",
        };
      });
      setValues((prev) => (Object.keys(prev).length ? { ...nextValues, ...prev } : nextValues));
      return;
    }

    if (!latestAssessments?.length) return;
    const nextValues: AssessmentMap = {};
    latestAssessments.forEach((item) => {
      nextValues[String(item.criterion)] = {
        conformity_rate: normalizeRate(item.conformity_rate),
        comment: item.comment ?? "",
        proof: item.proofs?.[0]?.description ?? "",
      };
    });
    setValues((prev) => (Object.keys(prev).length ? prev : nextValues));
  }, [latestAssessments, currentAssessments]);

  const persistCriterion = async (criterionId: number, snapshot?: AssessmentMap[string]) => {
    if (!id) return;
    const item = snapshot ?? values[String(criterionId)];
    if (!item) return;

    const criterion = allCriteria.find((entry) => entry.id === criterionId);
    const assessment = await mutate("post", "/audit-criterion-assessments/", {
      assignment: id,
      criterion: criterionId,
      conformity_rate: item.conformity_rate || null,
      comment: item.comment,
    });

    if (item.proof || item.proofFile) {
      if (item.proofFile) {
        const form = new FormData();
        form.append("assessment", String(assessment.id));
        form.append("title", `Preuve ${criterion?.code ?? criterionId}`);
        form.append("description", item.proof ?? "");
        form.append("file", item.proofFile);
        await mutate("post", "/audit-evidence/", form);
      } else if (item.proof) {
        await mutate("post", "/audit-evidence/", {
          assessment: assessment.id,
          title: `Preuve ${criterion?.code ?? criterionId}`,
          description: item.proof,
        });
      }
    }
  };

  const scheduleSave = (criterionId: number, snapshot: AssessmentMap[string]) => {
    const key = String(criterionId);
    if (saveTimeouts.current[key]) {
      window.clearTimeout(saveTimeouts.current[key]);
    }
    saveTimeouts.current[key] = window.setTimeout(() => {
      persistCriterion(criterionId, snapshot);
    }, 900);
  };

  const updateValue = (criterionId: number, field: "conformity_rate" | "comment" | "proof", value: string) => {
    setValues((prev) => {
      const nextFieldValue = field === "conformity_rate" ? sanitizeRateInput(value) : value;
      const nextItem = {
        conformity_rate: prev[String(criterionId)]?.conformity_rate ?? "",
        comment: prev[String(criterionId)]?.comment ?? "",
        proof: prev[String(criterionId)]?.proof ?? "",
        proofFile: prev[String(criterionId)]?.proofFile ?? null,
        [field]: nextFieldValue,
      };
      scheduleSave(criterionId, nextItem);
      return {
        ...prev,
        [String(criterionId)]: nextItem,
      };
    });
  };

  const updateProofFile = (criterionId: number, file: File | null) => {
    setValues((prev) => {
      const nextItem = {
        conformity_rate: prev[String(criterionId)]?.conformity_rate ?? "",
        comment: prev[String(criterionId)]?.comment ?? "",
        proof: prev[String(criterionId)]?.proof ?? "",
        proofFile: file,
      };
      persistCriterion(criterionId, nextItem);
      return {
        ...prev,
        [String(criterionId)]: nextItem,
      };
    });
  };

  useEffect(() => {
    const flushPending = () => {
      Object.values(saveTimeouts.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      allCriteria.forEach((criterion) => {
        const item = valuesRef.current[String(criterion.id)];
        if (item) {
          persistCriterion(criterion.id, item);
        }
      });
    };

    window.addEventListener("beforeunload", flushPending);
    return () => {
      window.removeEventListener("beforeunload", flushPending);
      flushPending();
    };
  }, [allCriteria]);

  const finishAudit = async () => {
    if (!id) return;
    for (const criterion of allCriteria) {
      const item = values[String(criterion.id)];
      if (!item) continue;
      await persistCriterion(criterion.id, item);
    }
    await mutate("patch", `/audit-assignments/${id}/`, { status: "closed" });
    refetchAssignment();
    refetchComputedResults();
    setDone(true);
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero audit-editor-hero">
        <div>
          <div className="eyebrow">Exécution d'audit</div>
          <h1 className="dashboard-title">{assignment?.process_name ?? "Audit"}</h1>
          <p className="dashboard-copy">Les valeurs sont sauvegardées automatiquement pendant la saisie. Les preuves et commentaires restent attachés à chaque critère.</p>
        </div>
        <div className="audit-hero-kpis">
          <div className="hero-kpi">
            <span className="hero-kpi-label">Type</span>
            <strong>{processTypeLabel(assignment?.process_type)}</strong>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi-label">Échéance</span>
            <strong>{formatDate(assignment?.due_date, "-")}</strong>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi-label">Saisie</span>
            <strong>{filledCriteriaCount}/{allCriteria.length}</strong>
          </div>
        </div>
      </section>

      {loading && <div className="card muted">Chargement...</div>}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}
      {done && <div className="card" style={{ color: "#2f7d5a" }}>Audit terminé. Le rapport, les résultats calculés et les non-conformités automatiques ont été générés.</div>}

      {computedResult ? (
        <div className="card audit-summary-card">
          <h3 className="section-title">Résultat calculé</h3>
          <div className="fiche-grid">
            <div className="fiche-item fiche-item-block">
              <div className="fiche-label">Taux moyen</div>
              <div className="fiche-text">{computedResult.average_rate}%</div>
            </div>
            <div className="fiche-item fiche-item-block">
              <div className="fiche-label">Niveau</div>
              <div className="fiche-text">{computedResult.conformity_level}</div>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>{computedResult.conformity_label}</p>
        </div>
      ) : null}

      {!loading && !clausesLoading && assignment && auditClauses.length === 0 && (
        <div className="card muted">Aucun critère n'est taggé pour ce type de processus.</div>
      )}

      {auditClauses.map((clause) => (
        <div key={clause.id} className="card fiche-section audit-criterion-card">
          <h3 className="section-title">{clause.reference} — {clause.title}</h3>
          <div className="fiche-grid audit-criteria-grid">
            {clause.criteria.map((criterion) => (
              <div key={criterion.id} className="fiche-item fiche-item-block audit-criterion-item">
                <div className="audit-criterion-top">
                  <div>
                    <div className="fiche-label">{criterion.code}</div>
                    <div className="fiche-text audit-criterion-title">{criterion.title}</div>
                  </div>
                  <span className="audit-rate-chip">
                    {values[String(criterion.id)]?.conformity_rate || "-"}%
                  </span>
                </div>
                <div className="audit-input-stack">
                  <label className="audit-field">
                    <span className="fiche-label">Taux de conformité</span>
                    <span className="audit-rate-control">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={values[String(criterion.id)]?.conformity_rate ?? ""}
                        onChange={(e) => updateValue(criterion.id, "conformity_rate", e.target.value)}
                        className="form-control audit-rate-input"
                      />
                      <span>%</span>
                    </span>
                  </label>
                  <label className="audit-field">
                    <span className="fiche-label">Commentaire</span>
                    <textarea
                      value={values[String(criterion.id)]?.comment ?? ""}
                      onChange={(e) => updateValue(criterion.id, "comment", e.target.value)}
                      className="form-control form-textarea audit-textarea"
                    />
                  </label>
                  <label className="audit-field">
                    <span className="fiche-label">Preuve constatée</span>
                    <textarea
                      value={values[String(criterion.id)]?.proof ?? ""}
                      onChange={(e) => updateValue(criterion.id, "proof", e.target.value)}
                      className="form-control form-textarea audit-textarea"
                    />
                  </label>
                  <div className="audit-upload-field">
                    <div className="fiche-label">Fichier de preuve</div>
                    <label className="audit-upload-control" htmlFor={`proof-file-${criterion.id}`}>
                      Choisir un fichier
                    </label>
                    <input
                      id={`proof-file-${criterion.id}`}
                      type="file"
                      className="audit-file-input"
                      onChange={(e) => updateProofFile(criterion.id, e.target.files?.[0] ?? null)}
                    />
                    <div className="audit-file-name">
                      {values[String(criterion.id)]?.proofFile?.name ?? currentAssessments?.find((item) => item.criterion === criterion.id)?.proofs?.[0]?.title ?? "Aucun fichier sélectionné"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card audit-actions-card">
        <button className="btn-primary" onClick={finishAudit} disabled={saving || assignment?.status === "closed"}>
          {saving ? "Enregistrement..." : assignment?.status === "closed" ? "Audit terminé" : "Terminer l'audit"}
        </button>
      </div>
    </div>
  );
}

export default AuditExecutionPage;
