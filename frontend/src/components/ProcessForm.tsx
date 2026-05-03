import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type Props = {
  onSuccess: () => void;
};

function ProcessForm({ onSuccess }: Props) {
  const { data: departments } = useFetch<{ id: number; name: string }[]>("/departments/");
  const { data: me } = useFetch<{ id: number; username: string; role: string }>("/me");
  const [name, setName] = useState("");
  const [type, setType] = useState("operationnel");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const { mutate, loading, error } = useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me?.id) return;
    await mutate("post", "/processes/", {
      name,
      type,
      department: departmentId,
      owner: me.id,
      description,
    });
    setName("");
    setDepartmentId("");
    setDescription("");
    setType("operationnel");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
      <h4 className="section-title">Nouveau Processus</h4>
      <div style={{ display: "grid", gap: 10 }}>
        <input
          required
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="management">Management</option>
          <option value="operationnel">Opérationnel</option>
          <option value="support">Support</option>
        </select>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="">Choisir un département</option>
          {(departments ?? []).map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <input
          value={me?.username ?? ""}
          disabled
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <textarea
          placeholder="Description du processus"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 90 }}
        />
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default ProcessForm;
