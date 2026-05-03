import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { formatDate } from "../utils/date";
import BpmnDiagram from "../components/BpmnDiagram";
import { LoadingCard } from "../components/LoadingStates";
import { labelizeSheetKey, sortSheetEntries } from "../utils/sheetLabels";

type SheetValue = string | number | boolean | null | SheetValue[] | { [key: string]: SheetValue };
type SheetData = Record<string, SheetValue>;

type ProcessSheet = {
  id: number;
  process: number;
  process_name: string;
  process_bpmn_xml?: string;
  manager_username: string;
  due_date: string;
  status: string;
  sheet_data: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeValue(value: unknown): SheetValue {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]));
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string" || value === null) {
    return value;
  }
  return value == null ? "" : String(value);
}

function normalizeSheetData(value: Record<string, unknown>): SheetData {
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]));
}

function labelize(value: string) {
  return labelizeSheetKey(value);
}

function isEmptyValue(value: SheetValue): boolean {
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(isEmptyValue);
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return Number.isNaN(value);
  return String(value ?? "").trim() === "";
}

function collectMissingFields(value: SheetValue, path: string[] = []): string[] {
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every(isEmptyValue)) {
      return [path.map(labelize).join(" / ")];
    }
    return value.flatMap((item, index) => collectMissingFields(item, [...path, `${index + 1}`]));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => collectMissingFields(nested, [...path, key]));
  }
  return isEmptyValue(value) ? [path.map(labelize).join(" / ")] : [];
}

function countCompletion(value: SheetValue): { total: number; filled: number } {
  if (Array.isArray(value)) {
    if (!value.length) return { total: 1, filled: 0 };
    let total = 0;
    let filled = 0;
    value.forEach((item) => {
      const next = countCompletion(item);
      total += next.total;
      filled += next.filled;
    });
    return { total, filled };
  }
  if (value && typeof value === "object") {
    const children = Object.values(value);
    if (!children.length) return { total: 1, filled: 0 };
    let total = 0;
    let filled = 0;
    children.forEach((item) => {
      const next = countCompletion(item);
      total += next.total;
      filled += next.filled;
    });
    return { total, filled };
  }
  return { total: 1, filled: isEmptyValue(value) ? 0 : 1 };
}

function completionState(value: SheetValue) {
  const completion = countCompletion(value);
  if (completion.filled === 0) return "empty";
  if (completion.filled >= completion.total) return "complete";
  return "partial";
}

function makeEmptyLike(value: SheetValue): SheetValue {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, makeEmptyLike(nested)]));
  }
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

function renderValue(value: unknown) {
  if (Array.isArray(value)) {
    return (
      <ul className="fiche-list">
        {value.map((item, index) => (
          <li key={index}>{isRecord(item) || Array.isArray(item) ? renderValue(item) : String(item)}</li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    return (
      <div className="fiche-grid">
        {sortSheetEntries(Object.entries(value)).map(([key, nested]) => (
          <div key={key} className="fiche-item fiche-item-block">
            <div className="fiche-label">{labelize(key)}</div>
            <div className="fiche-content">{renderValue(nested)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="fiche-text">{String(value ?? "")}</div>;
}

type SheetValueEditorProps = {
  fieldKey: string;
  value: SheetValue;
  onChange: (value: SheetValue) => void;
  level?: number;
};

function SheetValueEditor({ fieldKey, value, onChange, level = 0 }: SheetValueEditorProps) {
  const label = labelize(fieldKey);

  if (Array.isArray(value)) {
    const addItem = () => {
      const template = value[0] ?? "";
      onChange([...value, makeEmptyLike(template)]);
    };

    return (
      <div className="sheet-editor-field">
        <div className="sheet-editor-label-row">
          <label className="fiche-label">{label}</label>
          <button type="button" className="tag" onClick={addItem}>Ajouter</button>
        </div>
        <div className="sheet-editor-list">
          {value.map((item, index) => (
            <div key={index} className="sheet-editor-list-item">
              <SheetValueEditor
                fieldKey={`${label} ${index + 1}`}
                value={item}
                level={level + 1}
                onChange={(nextItem) => onChange(value.map((current, currentIndex) => currentIndex === index ? nextItem : current))}
              />
              <button
                type="button"
                className="tag sheet-editor-remove"
                onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className={level === 0 ? "sheet-editor-group" : "sheet-editor-subgroup"}>
        {level > 0 && <div className="fiche-label sheet-editor-group-title">{label}</div>}
        <div className="sheet-editor-grid">
          {sortSheetEntries(Object.entries(value)).map(([key, nested]) => (
            <SheetValueEditor
              key={key}
              fieldKey={key}
              value={nested}
              level={level + 1}
              onChange={(nextNested) => onChange({ ...value, [key]: nextNested })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="sheet-editor-field">
        <span className="fiche-label">{label}</span>
        <select className="sheet-editor-input" value={String(value)} onChange={(e) => onChange(e.target.value === "true")}>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label className="sheet-editor-field">
        <span className="fiche-label">{label}</span>
        <input className="sheet-editor-input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  }

  return (
    <label className="sheet-editor-field">
      <span className="fiche-label">{label}</span>
      <textarea
        className="sheet-editor-textarea"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ProcessSheetDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<ProcessSheet>(`/managed-process-sheets/${id}/`, [id]);
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SheetData>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const canEdit = auth.role === "gestionnaire" && Boolean(data);
  const isCreationLaunch = searchParams.get("start") === "1";

  useEffect(() => {
    if (data?.sheet_data) {
      setDraft(normalizeSheetData(data.sheet_data));
      setActiveSectionIndex(0);
      if (auth.role === "gestionnaire" && (data.status === "draft" || isCreationLaunch)) {
        setEditing(true);
      }
    }
  }, [data, auth.role, isCreationLaunch]);

  const sheetEntries = useMemo(
    () => data?.sheet_data ? sortSheetEntries(Object.entries(data.sheet_data)) : [],
    [data?.sheet_data],
  );
  const draftEntries = useMemo(() => sortSheetEntries(Object.entries(draft)), [draft]);
  const editorEntries = draftEntries.length ? draftEntries : sheetEntries.map(([section, value]) => [section, normalizeValue(value)] as [string, SheetValue]);
  const safeActiveSectionIndex = Math.min(activeSectionIndex, Math.max(editorEntries.length - 1, 0));
  const activeSection = editorEntries[safeActiveSectionIndex];
  const activeCompletion = activeSection ? countCompletion(activeSection[1]) : { total: 0, filled: 0 };

  useEffect(() => {
    setActiveSectionIndex((current) => Math.min(current, Math.max(editorEntries.length - 1, 0)));
  }, [editorEntries.length]);

  const saveSheet = async (status: "draft" | "submitted") => {
    if (!data) return;
    if (status === "submitted") {
      const missing = collectMissingFields(draft);
      if (missing.length) {
        setMissingFields(missing);
        return;
      }
    }
    setMissingFields([]);
    await mutate("patch", `/managed-process-sheets/${data.id}/`, {
      sheet_data: draft,
      status,
    });
    if (status === "submitted") {
      setEditing(false);
    }
    refetch();
  };

  const cancelEditing = () => {
    if (data?.sheet_data) {
      setDraft(normalizeSheetData(data.sheet_data));
    }
    setMissingFields([]);
    setEditing(false);
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Fiche processus</div>
          <h1 className="dashboard-title">{data?.process_name ?? "Chargement..."}</h1>
          <p className="dashboard-copy">
            Vue détaillée de la fiche processus, structurée pour lecture, audit et traçabilité.
          </p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Statut</span>
          <strong>{data?.status ?? "-"}</strong>
        </div>
      </section>

      <div className="card fiche-meta-bar process-sheet-toolbar">
        <div><strong>Gestionnaire:</strong> {data?.manager_username ?? "-"}</div>
        <div><strong>Échéance:</strong> {formatDate(data?.due_date, "-")}</div>
        {canEdit && (
          <button className="tag" onClick={() => editing ? cancelEditing() : setEditing(true)}>
            {editing ? "Annuler" : "Modifier la fiche"}
          </button>
        )}
        <div><Link className="tag" to="/">Retour</Link></div>
      </div>

      {loading && !data && <LoadingCard title="Chargement de la fiche" description="Préparation des sections et du modèle BPMN..." />}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {data?.sheet_data && (editing && canEdit ? (
        <div className="process-sheet-workbench">
          <aside className="process-sheet-nav">
            <div className="process-sheet-nav-title">Sections</div>
            <div className="process-sheet-nav-list">
              {editorEntries.map(([section, value], index) => {
                const completion = countCompletion(value);
                const state = completionState(value);
                return (
                  <button
                    key={section}
                    type="button"
                    className={`process-sheet-nav-button ${index === safeActiveSectionIndex ? "active" : ""}`}
                    onClick={() => setActiveSectionIndex(index)}
                  >
                    <span>{labelize(section)}</span>
                    <small className={`process-sheet-section-state ${state}`}>{completion.filled}/{completion.total}</small>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="card process-sheet-editor-card">
            <div className="process-sheet-editor-head">
              <div>
                <div className="eyebrow">Création</div>
                <h3 className="section-title">{activeSection ? labelize(activeSection[0]) : "Fiche processus"}</h3>
              </div>
              <div className="process-sheet-progress">
                <span>Section {safeActiveSectionIndex + 1}/{editorEntries.length}</span>
                <strong>{activeCompletion.filled}/{activeCompletion.total}</strong>
              </div>
            </div>

            <div className="process-sheet-editor-body">
              {activeSection && (
                <SheetValueEditor
                  fieldKey={activeSection[0]}
                  value={activeSection[1]}
                  onChange={(nextSection) => setDraft((prev) => ({ ...prev, [activeSection[0]]: nextSection }))}
                />
              )}
            </div>

            <div className="sheet-editor-actions">
              <div className="sheet-editor-step-actions">
                <button className="tag" type="button" disabled={safeActiveSectionIndex === 0} onClick={() => setActiveSectionIndex((index) => Math.max(index - 1, 0))}>
                  Précédent
                </button>
                <button className="tag" type="button" disabled={safeActiveSectionIndex >= editorEntries.length - 1} onClick={() => setActiveSectionIndex((index) => Math.min(index + 1, editorEntries.length - 1))}>
                  Suivant
                </button>
              </div>
              <div className="sheet-editor-save-actions">
                <button className="tag" type="button" onClick={cancelEditing} disabled={saving}>Annuler</button>
                <button className="btn-primary" type="button" onClick={() => saveSheet("draft")} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button className="btn-primary" type="button" onClick={() => saveSheet("submitted")} disabled={saving}>Soumettre la fiche</button>
              </div>
            </div>
          </section>

          {missingFields.length > 0 && (
            <div className="sheet-validation-card">
              <strong>Champs obligatoires à compléter avant soumission</strong>
              <ul>
                {missingFields.slice(0, 12).map((field) => <li key={field}>{field}</li>)}
              </ul>
              {missingFields.length > 12 && <div>+ {missingFields.length - 12} autres champs.</div>}
            </div>
          )}
          {saveError && <div className="sheet-save-error">{saveError}</div>}
        </div>
      ) : (
        <div className="card">
          {sheetEntries.map(([section, value]) => (
            <section key={section} className="fiche-section">
              <h3 className="section-title">{labelize(section)}</h3>
              {renderValue(value)}
            </section>
          ))}
        </div>
      ))}

      {data?.process && (
        <div className="card">
          <BpmnDiagram
            processId={data.process}
            xml={data.process_bpmn_xml}
            editable={auth.role === "gestionnaire"}
            onSaved={refetch}
          />
        </div>
      )}
    </div>
  );
}

export default ProcessSheetDetailPage;
