import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type Process = { id: number; name: string };

type Props = {
  onSuccess: () => void;
};

function NonConformityForm({ onSuccess }: Props) {
  const { data: processes } = useFetch<Process[]>("/processes/");
  const [reference, setReference] = useState("");
  const [processId, setProcessId] = useState("");
  const [severity, setSeverity] = useState("mineure");
  const [description, setDescription] = useState("");
  const [detectedAt, setDetectedAt] = useState("");
  const { mutate, loading, error } = useMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("post", "/non-conformities/", {
      reference,
      process: processId,
      severity,
      status: "ouverte",
      description,
      detected_at: detectedAt || new Date().toISOString().slice(0, 10),
    });
    setReference("");
    setProcessId("");
    setSeverity("mineure");
    setDescription("");
    setDetectedAt("");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 16 }}>
      <h4 className="section-title">Nouvelle Non-Conformité</h4>
      <div style={{ display: "grid", gap: 10 }}>
        <input
          required
          placeholder="Référence"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <select
          required
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
        <textarea
          required
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 80 }}
        />
        <div style={{ display: "grid", gap: 6 }}>
          <label>Date de détection</label>
          <input
            type="date"
            value={detectedAt}
            onChange={(e) => setDetectedAt(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default NonConformityForm;
