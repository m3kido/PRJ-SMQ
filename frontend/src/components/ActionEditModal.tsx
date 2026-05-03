import { useEffect, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type Process = { id: number; name: string; owner_username?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  action: {
    id: number;
    title: string;
    body?: string;
    process: number | null;
    assignee_username?: string;
    completed: boolean;
  } | null;
  onSuccess: () => void;
};

function ActionEditModal({ open, onClose, action, onSuccess }: Props) {
  const { data: processes } = useFetch<Process[]>("/processes/");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [processId, setProcessId] = useState("");
  const [completed, setCompleted] = useState(false);
  const { mutate, loading, error } = useMutation();

  const selectedProcess = processes?.find((process) => String(process.id) === processId);

  useEffect(() => {
    if (action) {
      setTitle(action.title);
      setBody(action.body ?? "");
      setProcessId(action.process ? String(action.process) : "");
      setCompleted(action.completed);
    }
  }, [action]);

  if (!open || !action) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("patch", `/actions/${action.id}/`, {
      title,
      body,
      process: Number(processId),
      completed,
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="card modal-card" style={{ position: "fixed", top: 120, left: "50%", transform: "translateX(-50%)", width: 460, zIndex: 20 }}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h4 className="section-title" style={{ margin: 0 }}>Éditer Action</h4>
        <button className="tag" onClick={onClose}>Fermer</button>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
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
        <div className="action-assignee-preview">
          Assignée automatiquement à {selectedProcess?.owner_username ?? action.assignee_username ?? "responsable du processus"}
        </div>
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
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
          Clôturée
        </label>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}

export default ActionEditModal;
