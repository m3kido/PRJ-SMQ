import { useEffect, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { LoadingSpinner } from "../components/LoadingStates";

type Scale = {
  id: number;
  name: string;
  description: string;
  levels: {
    id: number;
    truth_label: string;
    truth_choice: string;
    truth_rate: string;
    min_average: string;
    max_average: string;
    conformity_level: string;
    conformity_label: string;
    order: number;
  }[];
};

function EvaluationScalesPage() {
  const { data: scales, loading: scalesLoading, refetch } = useFetch<Scale[]>("/evaluation-scales/");
  const { mutate, loading, error } = useMutation();
  const [drafts, setDrafts] = useState<Record<number, { min_average: string; max_average: string }>>({});

  useEffect(() => {
    const nextDrafts: Record<number, { min_average: string; max_average: string }> = {};
    (scales ?? []).forEach((scale) => {
      scale.levels.forEach((level) => {
        nextDrafts[level.id] = {
          min_average: level.min_average,
          max_average: level.max_average,
        };
      });
    });
    setDrafts(nextDrafts);
  }, [scales]);

  const saveThresholds = async (levelId: number) => {
    const draft = drafts[levelId];
    if (!draft) return;
    await mutate("patch", `/evaluation-scale-levels/${levelId}/`, {
      min_average: draft.min_average,
      max_average: draft.max_average,
    });
    refetch();
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Échelles d'évaluation</div>
          <h1 className="dashboard-title">Véracité et conformité</h1>
          <p className="dashboard-copy">Admin et auditeur peuvent ajuster les niveaux qui déterminent automatiquement la conformité.</p>
        </div>
      </section>

      <div className="card panel-large scale-page-card">
        <h3 className="section-title">Échelles configurées</h3>
        <p className="muted" style={{ marginBottom: 16 }}>Les libellés par défaut restent fixes. Seuls les seuils minimum et maximum sont modifiables.</p>
        {scalesLoading && !scales && <LoadingSpinner label="Chargement des échelles..." />}
        {(scales ?? []).map((scale) => (
          <div key={scale.id} className="scale-block">
            <div className="scale-block-head">
              <h4 className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>{scale.name}</h4>
              <span className="tag">{scale.levels.length} niveaux</span>
            </div>
            <div className="scale-levels-stack">
              {scale.levels.map((level) => (
                <div key={level.id} className="scale-level-card">
                  <div className="scale-level-top">
                    <div>
                      <div className="fiche-label">{level.truth_choice}</div>
                      <div className="scale-level-title">{level.conformity_level}</div>
                    </div>
                  </div>
                  <div className="scale-level-text">{level.truth_label}</div>
                  <div className="muted scale-conformity-copy">{level.conformity_label}</div>
                  <div className="scale-threshold-grid">
                    <input
                      placeholder="Seuil minimal"
                      value={drafts[level.id]?.min_average ?? level.min_average}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [level.id]: { min_average: e.target.value, max_average: prev[level.id]?.max_average ?? level.max_average } }))}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <input
                      placeholder="Seuil maximal"
                      value={drafts[level.id]?.max_average ?? level.max_average}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [level.id]: { min_average: prev[level.id]?.min_average ?? level.min_average, max_average: e.target.value } }))}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <button className="btn-primary scale-save-btn" type="button" onClick={() => saveThresholds(level.id)} disabled={loading}>
                      {loading ? "Enregistrement..." : "Enregistrer les seuils"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      </div>
    </div>
  );
}

export default EvaluationScalesPage;
