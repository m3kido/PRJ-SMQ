import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks/useFetch";
import BpmnDiagram from "../components/BpmnDiagram";
import { LoadingCard } from "../components/LoadingStates";
import { formatDateTime } from "../utils/date";
import { labelizeSheetKey, sortSheetEntries } from "../utils/sheetLabels";

type Process = {
  id: number;
  name: string;
  type: string;
  description: string;
  bpmn_xml?: string;
  completeness: number;
  department_name?: string;
  owner_username?: string;
  history?: {
    id: number;
    actor_username?: string;
    event_type: string;
    message: string;
    created_at: string;
  }[];
};

type ManagedSheet = {
  id: number;
  process: number;
  process_name: string;
  due_date: string;
  status: string;
  sheet_data: Record<string, unknown>;
};

type AuditAssignment = {
  id: number;
  process: number;
  status: string;
  due_date: string;
};

function isEmptyValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isEmptyValue);
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return Number.isNaN(value);
  return String(value ?? "").trim() === "";
}

function countCompletion(value: unknown): { total: number; filled: number } {
  if (Array.isArray(value)) {
    if (!value.length) return { total: 1, filled: 0 };
    return value.reduce<{ total: number; filled: number }>(
      (total, item) => {
        const next = countCompletion(item);
        return { total: total.total + next.total, filled: total.filled + next.filled };
      },
      { total: 0, filled: 0 },
    );
  }
  if (value && typeof value === "object") {
    const children = Object.values(value as Record<string, unknown>);
    if (!children.length) return { total: 1, filled: 0 };
    return children.reduce<{ total: number; filled: number }>(
      (total, item) => {
        const next = countCompletion(item);
        return { total: total.total + next.total, filled: total.filled + next.filled };
      },
      { total: 0, filled: 0 },
    );
  }
  return { total: 1, filled: isEmptyValue(value) ? 0 : 1 };
}

function completionState(value: unknown) {
  const completion = countCompletion(value);
  if (completion.filled === 0) return "empty";
  if (completion.filled >= completion.total) return "complete";
  return "partial";
}

function historyEventLabel(value: string) {
  if (value === "created") return "Création";
  if (value === "sheet_updated") return "Fiche";
  if (value === "bpmn_updated") return "BPMN";
  if (value === "status_changed") return "Statut";
  return "Mise à jour";
}

function parseHistoryMessage(message: string) {
  const normalized = message.replace(/^Champs modifiés:\s*/i, "").replace(/^Fiche mise à jour:\s*/i, "");
  const countMatch = normalized.match(/^(\d+\s+champ\(s\)):\s*(.*)$/i);
  const title = countMatch ? countMatch[1] : message.startsWith("Champs modifiés:") ? "Champs modifiés" : "";
  const body = countMatch ? countMatch[2] : normalized;
  const parts = body
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/:\s*vide\s*→\s*vide$/i.test(part));

  if (parts.length <= 1 && !title) {
    return { title: "", items: [], text: message };
  }

  return { title: title || "Champs modifiés", items: parts, text: "" };
}

function HistoryMessage({ message, expanded, onToggle }: { message: string; expanded: boolean; onToggle: () => void }) {
  const parsed = parseHistoryMessage(message);
  if (!parsed.items.length) {
    return <p>{parsed.text || message}</p>;
  }
  const previewLimit = 4;
  const legacyMoreItem = parsed.items.find((item) => /^\+\s*\d+\s+autre\(s\)\s+champ\(s\)$/i.test(item));
  const realItems = parsed.items.filter((item) => item !== legacyMoreItem);
  const hiddenCount = Math.max(realItems.length - previewLimit, 0);
  const visibleItems = expanded ? realItems : realItems.slice(0, previewLimit);

  return (
    <div className="history-change-summary">
      <div className="history-change-title">{parsed.title}</div>
      <ul>
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button className="tag history-expand-button" type="button" onClick={onToggle}>
          {expanded ? "Réduire" : `Voir tous les changements (+${hiddenCount})`}
        </button>
      )}
      {legacyMoreItem && hiddenCount === 0 && (
        <div className="history-legacy-note">
          {legacyMoreItem.replace("+", "")} résumé(s) dans l'ancien format. Les détails complets n'étaient pas enregistrés.
        </div>
      )}
    </div>
  );
}

function renderBlock(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div className="fiche-text muted">-</div>;
    }
    if (value.some((item) => typeof item === "object" && item)) {
      return (
        <div className="process-detail-list-grid">
          {value.map((item, idx) => (
            <div key={idx} className="fiche-item fiche-item-block">
              <div className="fiche-label">Élément {idx + 1}</div>
              {renderBlock(item)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <ul className="fiche-list">
        {value.map((item, idx) => <li key={idx}>{String(item || "-")}</li>)}
      </ul>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className="fiche-grid process-detail-grid">
        {sortSheetEntries(Object.entries(value as Record<string, unknown>)).map(([key, nested]) => (
          <div key={key} className="fiche-item fiche-item-block">
            <div className="fiche-label">{labelizeSheetKey(key)}</div>
            {renderBlock(nested)}
          </div>
        ))}
      </div>
    );
  }
  const text = String(value ?? "").trim();
  return <div className={`fiche-text ${text ? "" : "muted"}`}>{text || "-"}</div>;
}

function ProcessDetailPage() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});
  const { data: process, loading, error } = useFetch<Process>(`/processes/${id}/`, [id]);
  const { data: sheets } = useFetch<ManagedSheet[]>(id ? `/managed-process-sheets/?process=${id}` : "/managed-process-sheets/?process=0", [id]);
  const { data: assignments } = useFetch<AuditAssignment[]>(id ? `/audit-assignments/?process=${id}` : "/audit-assignments/?process=0", [id]);

  const sheet = (sheets ?? []).find((item) => item.status === "validated" || item.status === "submitted") ?? sheets?.[0] ?? null;
  const currentAssignment = (assignments ?? []).find((item) => item.status !== "closed");
  const sheetEntries = useMemo(
    () => sheet?.sheet_data ? sortSheetEntries(Object.entries(sheet.sheet_data)) : [],
    [sheet?.sheet_data],
  );
  const safeActiveSectionIndex = Math.min(activeSectionIndex, Math.max(sheetEntries.length - 1, 0));
  const activeSection = sheetEntries[safeActiveSectionIndex];
  const activeCompletion = activeSection ? countCompletion(activeSection[1]) : { total: 0, filled: 0 };

  useEffect(() => {
    setActiveSectionIndex(0);
    setExpandedHistory({});
  }, [id]);

  return (
    <div className="dashboard-stack process-detail-page">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Processus</div>
          <h1 className="dashboard-title">{process?.name ?? "Chargement..."}</h1>
          <p className="dashboard-copy">Vue détaillée du processus et de sa fiche structurée pour consultation, préparation et audit.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Complétude</span>
          <strong>{process?.completeness ?? 0}%</strong>
        </div>
      </section>

      <div className="card fiche-meta-bar">
        <div><strong>Département:</strong> {process?.department_name ?? "-"}</div>
        <div><strong>Responsable:</strong> {process?.owner_username ?? "-"}</div>
        <div><strong>Type:</strong> {process?.type ?? "-"}</div>
        {auth.role === "auditeur_interne" && currentAssignment && (
          <Link className="btn-primary" to={`/audit-execution/${currentAssignment.id}?start=1`}>Lancer l'audit</Link>
        )}
      </div>

      {loading && !process && <LoadingCard title="Chargement du processus" description="Récupération de la fiche, des audits et du BPMN..." />}
      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {process?.description && (
        <div className="card">
          <h3 className="section-title">Description</h3>
          <p className="dashboard-copy">{process.description}</p>
        </div>
      )}

      {sheet?.sheet_data ? (
        <div className="process-sheet-workbench process-detail-workbench">
          <aside className="process-sheet-nav">
            <div className="process-sheet-nav-title">Sections</div>
            <div className="process-sheet-nav-list">
              {sheetEntries.map(([section, value], index) => {
                const completion = countCompletion(value);
                return (
                  <button
                    key={section}
                    type="button"
                    className={`process-sheet-nav-button ${index === safeActiveSectionIndex ? "active" : ""}`}
                    onClick={() => setActiveSectionIndex(index)}
                  >
                    <span>{labelizeSheetKey(section)}</span>
                    <small className={`process-sheet-section-state ${completionState(value)}`}>{completion.filled}/{completion.total}</small>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="card process-sheet-editor-card process-detail-section-card">
            <div className="process-sheet-editor-head">
              <div>
                <div className="eyebrow">Fiche processus</div>
                <h3 className="section-title">{activeSection ? labelizeSheetKey(activeSection[0]) : "Section"}</h3>
              </div>
              <div className="process-sheet-progress">
                <span>Section {safeActiveSectionIndex + 1}/{sheetEntries.length}</span>
                <strong>{activeCompletion.filled}/{activeCompletion.total}</strong>
              </div>
            </div>
            <div className="process-sheet-editor-body process-detail-section-content">
              {activeSection && renderBlock(activeSection[1])}
            </div>
            <div className="sheet-editor-actions">
              <button className="tag" type="button" disabled={safeActiveSectionIndex === 0} onClick={() => setActiveSectionIndex((index) => Math.max(index - 1, 0))}>
                Précédent
              </button>
              <button className="tag" type="button" disabled={safeActiveSectionIndex >= sheetEntries.length - 1} onClick={() => setActiveSectionIndex((index) => Math.min(index + 1, sheetEntries.length - 1))}>
                Suivant
              </button>
            </div>
          </section>
        </div>
      ) : !loading && (
        <div className="card muted">Aucune fiche processus n'est encore associée à ce processus.</div>
      )}

      {process && (
        <div className="card">
          <BpmnDiagram
            processId={process.id}
            xml={process.bpmn_xml}
            editable={auth.role === "gestionnaire"}
          />
        </div>
      )}

      {process && (
        <div className="card action-history-card process-history-card">
          <div className="history-section-head">
            <div>
              <div className="eyebrow">Journal</div>
              <h3 className="section-title">Historique du processus</h3>
            </div>
            <span className="tag">{process.history?.length ?? 0} événement(s)</span>
          </div>
          <div className="action-timeline">
            {process.history?.length ? process.history.map((item) => (
              <div key={item.id} className="action-timeline-item">
                <div className="action-timeline-dot" />
                <div className="action-timeline-content">
                  <div className="action-timeline-head">
                    <span className={`history-event-chip ${item.event_type}`}>{historyEventLabel(item.event_type)}</span>
                    <time>{formatDateTime(item.created_at, "-")}</time>
                  </div>
                  <HistoryMessage
                    message={item.message}
                    expanded={Boolean(expandedHistory[item.id])}
                    onToggle={() => setExpandedHistory((current) => ({ ...current, [item.id]: !current[item.id] }))}
                  />
                  <div className="history-actor">Par {item.actor_username ?? "Système"}</div>
                </div>
              </div>
            )) : (
              <div className="muted">Aucun changement enregistré pour ce processus.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessDetailPage;
