import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type NC = { id: number; reference: string };
type User = { id: number; username: string };

type Props = {
  onSuccess: () => void;
};

function ActionForm({ onSuccess }: Props) {
  const { data: ncs } = useFetch<NC[]>("/non-conformities/");
  const { data: users } = useFetch<User[]>("/users/");
  const [title, setTitle] = useState("");
  const [ncId, setNcId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const { mutate, loading, error } = useMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("post", "/actions/", {
      title,
      non_conformity: ncId,
      assignee,
      due_date: due || null,
      completed: false,
    });
    setTitle("");
    setNcId("");
    setAssignee("");
    setDue("");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 16 }}>
      <h4 className="section-title">Nouvelle Action Corrective</h4>
      <div style={{ display: "grid", gap: 10 }}>
        <input
          required
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <select
          required
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
          required
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
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default ActionForm;
