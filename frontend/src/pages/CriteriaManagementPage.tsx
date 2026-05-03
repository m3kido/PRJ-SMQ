import { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import SortableHeader from "../components/SortableHeader";
import { sortItems, SortConfig } from "../utils/tableSort";

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

const defaultProcessTypes = processTypeOptions.map((option) => option.value);

const criteriaSortAccessors = {
  code: (item: Criterion) => item.code,
  title: (item: Criterion) => item.title,
  clause: (item: Criterion) => item.clause_reference ?? item.clause,
  tags: (item: Criterion) => (item.process_types ?? []).join(", "),
};

const labelForProcessType = (value: string) => processTypeOptions.find((option) => option.value === value)?.label ?? value;

function CriteriaManagementPage() {
  const { data: criteria, loading: criteriaLoading, error: criteriaError, refetch } = useFetch<Criterion[]>("/iso-criteria/");
  const { data: clauses, error: clausesError } = useFetch<Clause[]>("/iso-clauses/");
  const { mutate, loading, error } = useMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", title: "", clause: "", process_types: defaultProcessTypes });
  const [formError, setFormError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "code", direction: "asc" });
  const [query, setQuery] = useState("");
  const [clauseFilter, setClauseFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const sortedClauses = useMemo(() => [...(clauses ?? [])].sort((a, b) => a.reference.localeCompare(b.reference, undefined, { numeric: true })), [clauses]);
  const filteredCriteria = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return (criteria ?? []).filter((criterion) => {
      const tags = criterion.process_types?.length ? criterion.process_types : defaultProcessTypes;
      const searchable = [
        criterion.code,
        criterion.title,
        criterion.clause_reference,
        criterion.clause_title,
        tags.map(labelForProcessType).join(" "),
      ].join(" ").toLocaleLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesClause = !clauseFilter || String(criterion.clause) === clauseFilter;
      const matchesTag = tagFilter === "all" || tags.includes(tagFilter);
      return matchesQuery && matchesClause && matchesTag;
    });
  }, [criteria, clauseFilter, query, tagFilter]);
  const defaultSortedCriteria = useMemo(() => [...filteredCriteria].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [filteredCriteria]);
  const sortedCriteria = useMemo(() => sortItems(defaultSortedCriteria, sortConfig, criteriaSortAccessors), [defaultSortedCriteria, sortConfig]);
  const tagCounts = useMemo(() => Object.fromEntries(processTypeOptions.map((option) => [
    option.value,
    (criteria ?? []).filter((criterion) => (criterion.process_types?.length ? criterion.process_types : defaultProcessTypes).includes(option.value)).length,
  ])), [criteria]);
  const hasFilters = Boolean(query.trim() || clauseFilter || tagFilter !== "all");

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
      process_types: criterion.process_types?.length ? criterion.process_types : defaultProcessTypes,
    });
    setFormError(null);
  };

  const reset = () => {
    setEditingId(null);
    setForm({ code: "", title: "", clause: "", process_types: defaultProcessTypes });
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
    const criterion = criteria?.find((item) => item.id === id);
    if (!window.confirm(`Supprimer le critère ${criterion?.code ?? ""} ?`)) return;
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

      <div className="grid stats">
        <div className="card stat-card">
          <div className="card-title">Critères</div>
          <div className="card-value">{criteria?.length ?? 0}</div>
          <div className="muted">Total référentiel</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Clauses</div>
          <div className="card-value">{sortedClauses.length}</div>
          <div className="muted">Articles ISO disponibles</div>
        </div>
        <div className="card stat-card stat-card-primary">
          <div className="card-title">Résultat</div>
          <div className="card-value">{sortedCriteria.length}</div>
          <div className="muted">Critères affichés</div>
        </div>
      </div>

      <div className="card criteria-control-card">
        <div className="criteria-filters">
          <label className="field-stack">
            <span className="fiche-label">Recherche</span>
            <input
              className="form-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Code, libellé, clause..."
            />
          </label>
          <label className="field-stack">
            <span className="fiche-label">Clause</span>
            <select className="form-control" value={clauseFilter} onChange={(e) => setClauseFilter(e.target.value)}>
              <option value="">Toutes les clauses</option>
              {sortedClauses.map((clause) => (
                <option key={clause.id} value={clause.id}>{clause.reference} — {clause.title}</option>
              ))}
            </select>
          </label>
          <div className="field-stack">
            <span className="fiche-label">Tag processus</span>
            <div className="criteria-filter-tags">
              <button type="button" className={`criterion-tag criterion-tag-button ${tagFilter === "all" ? "selected" : ""}`} onClick={() => setTagFilter("all")}>
                Tous
              </button>
              {processTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`criterion-tag criterion-tag-button ${tagFilter === option.value ? "selected" : ""}`}
                  onClick={() => setTagFilter(option.value)}
                >
                  {option.label} ({tagCounts[option.value] ?? 0})
                </button>
              ))}
            </div>
          </div>
        </div>
        {hasFilters && (
          <button className="tag criteria-clear-filters" type="button" onClick={() => { setQuery(""); setClauseFilter(""); setTagFilter("all"); }}>
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="criteria-management-grid">
        <div className="card panel-large">
          <div className="criteria-list-head">
            <h3 className="section-title">Critères</h3>
            <span className="tag">{sortedCriteria.length}/{criteria?.length ?? 0}</span>
          </div>
          {criteriaLoading && <div className="muted">Chargement...</div>}
          {criteriaError && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{criteriaError}</div>}
          <table className="table">
            <thead>
              <tr>
                <SortableHeader label="Code" sortKey="code" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
                <SortableHeader label="Libellé" sortKey="title" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
                <SortableHeader label="Clause" sortKey="clause" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
                <SortableHeader label="Tags" sortKey="tags" sortConfig={sortConfig} onSort={(key, direction) => setSortConfig({ key, direction })} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedCriteria.map((criterion) => (
                <tr key={criterion.id}>
                  <td><strong>{criterion.code}</strong></td>
                  <td className="criteria-title-cell">{criterion.title}</td>
                  <td>
                    <strong>{criterion.clause_reference ?? criterion.clause}</strong>
                    {criterion.clause_title && <div className="muted criteria-clause-title">{criterion.clause_title}</div>}
                  </td>
                  <td>
                    <div className="criterion-tags">
                      {(criterion.process_types?.length ? criterion.process_types : defaultProcessTypes).map((tag) => (
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
              {!criteriaLoading && sortedCriteria.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted criteria-empty-row">Aucun critère ne correspond aux filtres.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card panel-side">
          <div className="criteria-form-head">
            <h3 className="section-title">{editingId ? "Modifier un critère" : "Ajouter un critère"}</h3>
            {editingId && <span className="tag">Édition</span>}
          </div>
          <form onSubmit={submit} className="criteria-form">
            <label className="field-stack">
              <span className="fiche-label">Code</span>
              <input required className="form-control" placeholder="Ex. cr103" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label className="field-stack">
              <span className="fiche-label">Libellé</span>
              <textarea required className="form-control form-textarea criteria-title-input" placeholder="Libellé du critère" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="field-stack">
              <span className="fiche-label">Clause ISO</span>
              <select required className="form-control" value={form.clause} onChange={(e) => setForm({ ...form, clause: e.target.value })}>
                <option value="">Sélectionner une clause</option>
                {sortedClauses.map((clause) => (
                  <option key={clause.id} value={clause.id}>{clause.reference} — {clause.title}</option>
                ))}
              </select>
            </label>
            <div className="criterion-tag-picker">
              <div className="criteria-tag-picker-head">
                <div className="fiche-label">Tags processus</div>
                <button type="button" className="tag" onClick={() => setForm({ ...form, process_types: defaultProcessTypes })}>Tous</button>
              </div>
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
            <div className="criteria-form-actions">
              <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Enregistrement..." : editingId ? "Sauvegarder" : "Ajouter"}</button>
              {editingId && <button className="tag" type="button" onClick={reset}>Annuler</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CriteriaManagementPage;
