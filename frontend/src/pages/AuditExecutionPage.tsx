import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

function hasAssessmentValue(item?: AssessmentMap[string]) {
  return Boolean(
    item?.conformity_rate
    || item?.comment?.trim()
    || item?.proof?.trim()
    || item?.proofFile
  );
}

function AuditExecutionPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { data: assignment, loading, refetch: refetchAssignment } = useFetch<Assignment>(`/audit-assignments/${id}/`, [id]);
  const { data: clauses, loading: clausesLoading } = useFetch<Clause[]>("/iso-clauses/");
  const { data: currentAssessments } = useFetch<Assessment[]>(id ? `/audit-criterion-assessments/?assignment=${id}` : "/audit-criterion-assessments/?assignment=0", [id]);
  const { data: latestAssessments } = useFetch<Assessment[]>(
    assignment?.process ? `/audit-criterion-assessments/?latest_for_process=${assignment.process}` : "/audit-criterion-assessments/?assignment=0",
    [assignment?.process],
  );
  const { data: computedResults, refetch: refetchComputedResults } = useFetch<ComputedResult[]>("/audit-computed-results/");
  const { mutate, loading: saving, error } = useMutation();
  const [values, setValues] = useState<AssessmentMap>({});
  const [done, setDone] = useState(false);
  const [activeClauseIndex, setActiveClauseIndex] = useState(0);
  const [launchPrepared, setLaunchPrepared] = useState(false);
  const saveTimeouts = useRef<Record<string, number>>({});
  const valuesRef = useRef<AssessmentMap>({});
  const launchPreparationRef = useRef<string | null>(null);
  const isAuditLaunch = searchParams.get("start") === "1";
  const auditLocked = assignment?.status === "closed";

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
  const safeActiveClauseIndex = Math.min(activeClauseIndex, Math.max(auditClauses.length - 1, 0));
  const activeClause = auditClauses[safeActiveClauseIndex];
  const currentAssessmentByCriterion = useMemo(() => {
    const lookup = new Map<number, Assessment>();
    (currentAssessments ?? []).forEach((assessment) => lookup.set(assessment.criterion, assessment));
    return lookup;
  }, [currentAssessments]);

  const computedResult = (computedResults ?? []).find((item) => String(item.assignment) === String(id));
  const filledCriteriaCount = allCriteria.filter((criterion) => hasAssessmentValue(values[String(criterion.id)])).length;

  useEffect(() => {
    setLaunchPrepared(false);
    launchPreparationRef.current = null;
    setActiveClauseIndex(0);
    setValues({});
  }, [id]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    if (!currentAssessments) return;

    const sourceAssessments = currentAssessments.length ? currentAssessments : (latestAssessments ?? []);
    if (!sourceAssessments.length) {
      setValues((prev) => (Object.keys(prev).length ? prev : {}));
      return;
    }

    const nextValues: AssessmentMap = {};
    sourceAssessments.forEach((item) => {
      nextValues[String(item.criterion)] = {
        conformity_rate: normalizeRate(item.conformity_rate),
        comment: item.comment ?? "",
        proof: item.proofs?.[0]?.description ?? "",
      };
    });
    setValues((prev) => (currentAssessments.length || !Object.keys(prev).length ? nextValues : prev));
  }, [currentAssessments, latestAssessments]);

  useEffect(() => {
    setActiveClauseIndex((current) => Math.min(current, Math.max(auditClauses.length - 1, 0)));
  }, [auditClauses.length]);

  useEffect(() => {
    if (!id || !isAuditLaunch || !assignment || launchPrepared) return;
    if (assignment.status !== "assigned" || launchPreparationRef.current === id) return;
    launchPreparationRef.current = id;

    const prepareLaunch = async () => {
      await mutate("patch", `/audit-assignments/${id}/`, { status: "in_progress" });
      setLaunchPrepared(true);
      refetchAssignment();
    };

    prepareLaunch().catch(() => {
      launchPreparationRef.current = null;
    });
  }, [assignment, id, isAuditLaunch, launchPrepared]);

  const persistCriterion = async (criterionId: number, snapshot?: AssessmentMap[string]) => {
    if (!id || auditLocked) return;
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
    if (auditLocked) return;
    const key = String(criterionId);
    if (saveTimeouts.current[key]) {
      window.clearTimeout(saveTimeouts.current[key]);
    }
    saveTimeouts.current[key] = window.setTimeout(() => {
      persistCriterion(criterionId, snapshot);
    }, 900);
  };

  const updateValue = (criterionId: number, field: "conformity_rate" | "comment" | "proof", value: string) => {
    if (auditLocked) return;
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
    if (auditLocked) return;
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
  }, [allCriteria, auditLocked]);

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

  const clauseProgress = (clause: Clause) => ({
    total: clause.criteria.length,
    filled: clause.criteria.filter((criterion) => hasAssessmentValue(values[String(criterion.id)])).length,
  });

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

      {!loading && !clausesLoading && assignment && activeClause && (
        <div className="audit-workbench">
          <aside className="audit-clause-nav">
            <div className="audit-clause-nav-title">Clauses ISO</div>
            <div className="audit-clause-nav-list">
              {auditClauses.map((clause, index) => {
                const progress = clauseProgress(clause);
                const progressState = progress.filled === 0 ? "empty" : progress.filled === progress.total ? "complete" : "partial";
                return (
                  <button
                    key={clause.id}
                    type="button"
                    className={`audit-clause-nav-button ${index === safeActiveClauseIndex ? "active" : ""}`}
                    onClick={() => setActiveClauseIndex(index)}
                  >
                    <span>{clause.reference}</span>
                    <small>{clause.title}</small>
                    <strong className={`audit-clause-state ${progressState}`}>{progress.filled}/{progress.total}</strong>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="audit-clause-editor">
            <div className="audit-clause-head">
              <div>
                <div className="eyebrow">Clause {activeClause.reference}</div>
                <h3 className="section-title">{activeClause.title}</h3>
              </div>
              <div className="audit-clause-progress">
                <span>Clause {safeActiveClauseIndex + 1}/{auditClauses.length}</span>
                <strong>{clauseProgress(activeClause).filled}/{clauseProgress(activeClause).total}</strong>
              </div>
            </div>

            <div className="audit-criteria-grid">
              {activeClause.criteria.map((criterion) => (
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
                          disabled={auditLocked}
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
                        disabled={auditLocked}
                      />
                    </label>
                    <label className="audit-field">
                      <span className="fiche-label">Preuve constatée</span>
                      <textarea
                        value={values[String(criterion.id)]?.proof ?? ""}
                        onChange={(e) => updateValue(criterion.id, "proof", e.target.value)}
                        className="form-control form-textarea audit-textarea"
                        disabled={auditLocked}
                      />
                    </label>
                    <div className="audit-upload-field">
                      <div className="fiche-label">Fichier de preuve</div>
                      <label className={`audit-upload-control ${auditLocked ? "disabled" : ""}`} htmlFor={`proof-file-${criterion.id}`}>
                        Choisir un fichier
                      </label>
                      <input
                        id={`proof-file-${criterion.id}`}
                        type="file"
                        className="audit-file-input"
                        onChange={(e) => updateProofFile(criterion.id, e.target.files?.[0] ?? null)}
                        disabled={auditLocked}
                      />
                      <div className="audit-file-name">
                        {values[String(criterion.id)]?.proofFile?.name ?? currentAssessmentByCriterion.get(criterion.id)?.proofs?.[0]?.title ?? "Aucun fichier sélectionné"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="audit-clause-actions">
              <button className="tag" type="button" disabled={safeActiveClauseIndex === 0} onClick={() => setActiveClauseIndex((index) => Math.max(index - 1, 0))}>
                Précédent
              </button>
              <button className="tag" type="button" disabled={safeActiveClauseIndex >= auditClauses.length - 1} onClick={() => setActiveClauseIndex((index) => Math.min(index + 1, auditClauses.length - 1))}>
                Suivant
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="card audit-actions-card">
        <button className="btn-primary" onClick={finishAudit} disabled={saving || assignment?.status === "closed"}>
          {saving ? "Enregistrement..." : assignment?.status === "closed" ? "Audit terminé" : "Terminer l'audit"}
        </button>
      </div>
    </div>
  );
}

export default AuditExecutionPage;
