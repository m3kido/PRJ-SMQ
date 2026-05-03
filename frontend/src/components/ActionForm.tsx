import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type Process = { id: number; name: string; owner_username?: string };

type Props = {
  onSuccess: () => void;
};

function ActionForm({ onSuccess }: Props) {
  const { data: processes } = useFetch<Process[]>("/processes/");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [processId, setProcessId] = useState("");
  const { mutate, loading, error } = useMutation();

  const selectedProcess = processes?.find((process) => String(process.id) === processId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("post", "/actions/", {
      title,
      body,
      process: Number(processId),
      completed: false,
    });
    setTitle("");
    setBody("");
    setProcessId("");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="action-form" style={{ marginBottom: 16 }}>
      <h4 className="section-title">Nouvelle Action Corrective</h4>
      <div style={{ display: "grid", gap: 10 }}>
        <label className="field-stack">
          <span className="fiche-label">Processus</span>
          <select
            required
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
            className="form-control"
          >
            <option value="">Sélectionner un processus</option>
            {processes?.map((process) => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
          </select>
        </label>
        {selectedProcess && (
          <div className="action-assignee-preview">
            Assignée automatiquement à {selectedProcess.owner_username ?? "responsable du processus"}
          </div>
        )}
        <label className="field-stack">
          <span className="fiche-label">Titre</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
          />
        </label>
        <label className="field-stack">
          <span className="fiche-label">Description</span>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="form-control form-textarea"
          />
        </label>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default ActionForm;
