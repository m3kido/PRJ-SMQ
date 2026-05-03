import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type Criterion = {
  id: number;
  code: string;
  title: string;
  clause: number;
  clause_reference?: string;
  clause_title?: string;
  process_types: string[];
};

type Clause = {
  id: number;
  reference: string;
  title: string;
};

const processTypeOptions = [
  { value: "operationnel", label: "Opérationnel" },
  { value: "support", label: "Support" },
  { value: "management", label: "Management" },
];

function CriteriaManagementPage() {
  const { data: criteria, loading: criteriaLoading, error: criteriaError, refetch } = useFetch<Criterion[]>("/iso-criteria/");
  const { data: clauses, error: clausesError } = useFetch<Clause[]>("/iso-clauses/");
  const { mutate, loading, error } = useMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", title: "", clause: "", process_types: ["operationnel", "support", "management"] });
  const [formError, setFormError] = useState<string | null>(null);
  const sortedCriteria = [...(criteria ?? [])].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const sortedClauses = [...(clauses ?? [])].sort((a, b) => a.reference.localeCompare(b.reference, undefined, { numeric: true }));

  const labelForProcessType = (value: string) => processTypeOptions.find((option) => option.value === value)?.label ?? value;

  const toggleProcessType = (value: string) => {
    setForm((current) => {
      const selected = current.process_types.includes(value)
        ? current.process_types.filter((item) => item !== value)
        : [...current.process_types, value];
      return { ...current, process_types: selected };
    });
  };

  const startEdit = (criterion: Criterion) => {
    setEditingId(criterion.id);
    setForm({
      code: criterion.code,
      title: criterion.title,
      clause: String(criterion.clause),
      process_types: criterion.process_types?.length ? criterion.process_types : ["operationnel", "support", "management"],
    });
    setFormError(null);
  };

  const reset = () => {
    setEditingId(null);
    setForm({ code: "", title: "", clause: "", process_types: ["operationnel", "support", "management"] });
    setFormError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.process_types.length) {
      setFormError("Sélectionnez au moins un tag de processus.");
      return;
    }
    const payload = {
      code: form.code,
      title: form.title,
      clause: Number(form.clause),
      process_types: form.process_types,
    };
    if (editingId) {
      await mutate("patch", `/iso-criteria/${editingId}/`, payload);
    } else {
      await mutate("post", "/iso-criteria/", payload);
    }
    reset();
    refetch();
  };

  const remove = async (id: number) => {
    await mutate("delete", `/iso-criteria/${id}/`);
    if (editingId === id) reset();
    refetch();
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Référentiel</div>
          <h1 className="dashboard-title">Gestion des critères ISO 9001</h1>
          <p className="dashboard-copy">Ajoutez, modifiez ou supprimez les critères utilisés par les auditeurs lors des évaluations.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="card panel-large">
          <h3 className="section-title">Critères</h3>
          {criteriaLoading && <div className="muted">Chargement...</div>}
          {criteriaError && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{criteriaError}</div>}
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé</th>
                <th>Clause</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedCriteria.map((criterion) => (
                <tr key={criterion.id}>
                  <td>{criterion.code}</td>
                  <td>{criterion.title}</td>
                  <td>{criterion.clause_reference ?? criterion.clause}</td>
                  <td>
                    <div className="criterion-tags">
                      {(criterion.process_types?.length ? criterion.process_types : ["operationnel", "support", "management"]).map((tag) => (
                        <span key={tag} className="criterion-tag">{labelForProcessType(tag)}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="tag" onClick={() => startEdit(criterion)}>Éditer</button>
                      <button className="tag" onClick={() => remove(criterion.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card panel-side">
          <h3 className="section-title">{editingId ? "Modifier un critère" : "Ajouter un critère"}</h3>
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <input required placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <input required placeholder="Libellé" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <select required value={form.clause} onChange={(e) => setForm({ ...form, clause: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">-- Clause --</option>
              {sortedClauses.map((clause) => (
                <option key={clause.id} value={clause.id}>{clause.reference} — {clause.title}</option>
              ))}
            </select>
            <div className="criterion-tag-picker">
              <div className="fiche-label">Tags processus</div>
              <div className="criterion-tags">
                {processTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`criterion-tag criterion-tag-button ${form.process_types.includes(option.value) ? "selected" : ""}`}
                    onClick={() => toggleProcessType(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {formError && <div style={{ color: "#b91c1c" }}>{formError}</div>}
            {clausesError && <div style={{ color: "#b91c1c" }}>{clausesError}</div>}
            {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Enregistrement..." : editingId ? "Sauvegarder" : "Ajouter"}</button>
            {editingId && <button className="tag" type="button" onClick={reset}>Annuler</button>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CriteriaManagementPage;
