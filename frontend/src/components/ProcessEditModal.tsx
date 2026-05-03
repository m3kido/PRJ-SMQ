import { useEffect, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type ProcessValue = {
  id: number;
  name: string;
  type: string;
  completeness?: number;
  description?: string;
  department?: { id: number; name: string } | number;
  department_name?: string;
  owner?: { id: number; username: string } | number;
  owner_username?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  process: ProcessValue | null;
  onSuccess: () => void;
};

function ProcessEditModal({ open, onClose, process, onSuccess }: Props) {
  const { data: departments } = useFetch<{ id: number; name: string }[]>("/departments/");
  const { data: users } = useFetch<{ id: number; username: string }[]>("/users/");
  const { data: fullProcess } = useFetch<ProcessValue>(process ? `/processes/${process.id}/` : "/processes/", [process?.id]);
  const [name, setName] = useState("");
  const [type, setType] = useState("operationnel");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [completeness, setCompleteness] = useState("0");
  const [description, setDescription] = useState("");
  const { mutate, loading, error } = useMutation();

  useEffect(() => {
    const current = fullProcess ?? process;
    if (current) {
      setName(current.name);
      setType(current.type);
      setDepartmentId(
        typeof current.department === "object" && current.department
          ? String(current.department.id)
          : current.department
            ? String(current.department)
            : ""
      );
      setOwnerId(
        typeof current.owner === "object" && current.owner
          ? String(current.owner.id)
          : current.owner
            ? String(current.owner)
            : ""
      );
      setCompleteness(String(current.completeness ?? 0));
      setDescription(current.description ?? "");
    }
  }, [process, fullProcess]);

  if (!open || !process) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("patch", `/processes/${process.id}/`, {
      name,
      type,
      department: departmentId || null,
      owner: ownerId || null,
      completeness: Number(completeness || 0),
      description,
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="card" style={{ position: "fixed", top: 40, right: 40, width: 420, zIndex: 20 }}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h4 className="section-title" style={{ margin: 0 }}>Éditer Processus</h4>
        <button className="tag" onClick={onClose}>Fermer</button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          required
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
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="">Choisir un responsable</option>
          {(users ?? []).map((user) => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="100"
          value={completeness}
          onChange={(e) => setCompleteness(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <textarea
          placeholder="Description du processus"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 90 }}
        />
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "En cours..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}

export default ProcessEditModal;
