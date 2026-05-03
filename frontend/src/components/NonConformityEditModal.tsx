import { useEffect, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import AppDateInput from "./AppDateInput";

type Process = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  nc: {
    id: number;
    reference: string;
    process: number;
    severity: string;
    status: string;
    description: string;
    detected_at: string;
  } | null;
  onSuccess: () => void;
};

function NonConformityEditModal({ open, onClose, nc, onSuccess }: Props) {
  const { data: processes } = useFetch<Process[]>("/processes/");
  const [reference, setReference] = useState("");
  const [processId, setProcessId] = useState("");
  const [severity, setSeverity] = useState("mineure");
  const [status, setStatus] = useState("ouverte");
  const [description, setDescription] = useState("");
  const [detectedAt, setDetectedAt] = useState("");
  const { mutate, loading, error } = useMutation();

  useEffect(() => {
    if (nc) {
      setReference(nc.reference);
      setProcessId(nc.process ? String(nc.process) : "");
      setSeverity(nc.severity);
      setStatus(nc.status);
      setDescription(nc.description);
      setDetectedAt(nc.detected_at);
    }
  }, [nc]);

  if (!open || !nc) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("patch", `/non-conformities/${nc.id}/`, {
      reference,
      process: processId || null,
      severity,
      status,
      description,
      detected_at: detectedAt,
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="card" style={{ position: "fixed", top: 120, right: 40, width: 380, zIndex: 20 }}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h4 className="section-title" style={{ margin: 0 }}>Éditer NC</h4>
        <button className="tag" onClick={onClose}>Fermer</button>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          required
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <select
          value={processId}
          onChange={(e) => setProcessId(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="">-- Processus --</option>
          {processes?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="critique">Critique</option>
          <option value="majeure">Majeure</option>
          <option value="mineure">Mineure</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="ouverte">Ouverte</option>
          <option value="en_cours">En cours</option>
          <option value="resolue">Résolue</option>
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 80 }}
        />
        <div style={{ display: "grid", gap: 6 }}>
          <label>Date de détection</label>
          <AppDateInput
            value={detectedAt}
            onChange={setDetectedAt}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}

export default NonConformityEditModal;
