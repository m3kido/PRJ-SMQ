import { useEffect, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type NC = { id: number; reference: string };
type User = { id: number; username: string };

type Props = {
  open: boolean;
  onClose: () => void;
  action: {
    id: number;
    title: string;
    non_conformity?: { id: number; reference: string };
    assignee?: { id: number; username: string };
    due_date: string | null;
    completed: boolean;
  } | null;
  onSuccess: () => void;
};

function ActionEditModal({ open, onClose, action, onSuccess }: Props) {
  const { data: ncs } = useFetch<NC[]>("/non-conformities/");
  const { data: users } = useFetch<User[]>("/users/");
  const [title, setTitle] = useState("");
  const [ncId, setNcId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const [completed, setCompleted] = useState(false);
  const { mutate, loading, error } = useMutation();

  useEffect(() => {
    if (action) {
      setTitle(action.title);
      setNcId(action.non_conformity?.id ? String(action.non_conformity.id) : "");
      setAssignee(action.assignee?.id ? String(action.assignee.id) : "");
      setDue(action.due_date ?? "");
      setCompleted(action.completed);
    }
  }, [action]);

  if (!open || !action) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("patch", `/actions/${action.id}/`, {
      title,
      non_conformity: ncId || null,
      assignee: assignee || null,
      due_date: due || null,
      completed,
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="card" style={{ position: "fixed", top: 120, left: "50%", transform: "translateX(-50%)", width: 420, zIndex: 20 }}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h4 className="section-title" style={{ margin: 0 }}>Éditer Action</h4>
        <button className="tag" onClick={onClose}>Fermer</button>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <select
          value={ncId}
          onChange={(e) => setNcId(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="">-- Non-Conformité --</option>
          {ncs?.map((nc) => (
            <option key={nc.id} value={nc.id}>
              {nc.reference}
            </option>
          ))}
        </select>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="">-- Assigné à --</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </select>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Échéance</label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
        </div>
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
