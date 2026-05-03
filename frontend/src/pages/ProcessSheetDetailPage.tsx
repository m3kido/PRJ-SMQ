import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { formatDate } from "../utils/date";
import BpmnDiagram from "../components/BpmnDiagram";
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
        <div className="fiche-label">{label}</div>
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
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<ProcessSheet>(`/managed-process-sheets/${id}/`, [id]);
  const { mutate, loading: saving, error: saveError } = useMutation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SheetData>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (data?.sheet_data) {
      setDraft(normalizeSheetData(data.sheet_data));
    }
  }, [data]);

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
    setEditing(false);
    refetch();
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

      <div className="card fiche-meta-bar">
        <div><strong>Gestionnaire:</strong> {data?.manager_username ?? "-"}</div>
        <div><strong>Échéance:</strong> {formatDate(data?.due_date, "-")}</div>
        {auth.role === "gestionnaire" && data && (
          <button className="tag" onClick={() => setEditing((v) => !v)}>{editing ? "Annuler" : "Modifier la fiche"}</button>
        )}
        <div><Link className="tag" to="/">Retour</Link></div>
      </div>

      {loading && <div className="card muted">Chargement...</div>}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {data?.sheet_data && (
        <div className="card">
          {sortSheetEntries(Object.entries(data.sheet_data)).map(([section, value]) => (
            <section key={section} className="fiche-section">
              <h3 className="section-title">{labelize(section)}</h3>
              {editing && auth.role === "gestionnaire" ? (
                <SheetValueEditor
                  fieldKey={section}
                  value={draft[section] ?? normalizeValue(value)}
                  onChange={(nextSection) => setDraft((prev) => ({ ...prev, [section]: nextSection }))}
                />
              ) : (
                renderValue(value)
              )}
            </section>
          ))}
          {editing && auth.role === "gestionnaire" && (
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="btn-primary" onClick={() => saveSheet("draft")} disabled={saving}>Enregistrer</button>
              <button className="btn-primary" onClick={() => saveSheet("submitted")} disabled={saving}>Soumettre la fiche</button>
            </div>
          )}
          {missingFields.length > 0 && (
            <div className="sheet-validation-card">
              <strong>Champs obligatoires à compléter avant soumission</strong>
              <ul>
                {missingFields.slice(0, 12).map((field) => <li key={field}>{field}</li>)}
              </ul>
              {missingFields.length > 12 && <div>+ {missingFields.length - 12} autres champs.</div>}
            </div>
          )}
          {saveError && <div style={{ color: "#b91c1c", marginTop: 12 }}>{saveError}</div>}
        </div>
      )}

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
