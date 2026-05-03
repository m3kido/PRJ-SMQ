import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import AppDateInput from "./AppDateInput";

type Process = { id: number; name: string };
type User = { id: number; username: string };
type Department = { id: number; name: string };

type Props = {
  onSuccess: () => void;
};

function AuditForm({ onSuccess }: Props) {
  const { data: processes } = useFetch<Process[]>("/processes/");
  const { data: users } = useFetch<User[]>("/users/");
  const { data: departments } = useFetch<Department[]>("/departments/");
  const [type, setType] = useState("interne");
  const [department, setDepartment] = useState("");
  const [processIds, setProcessIds] = useState<string[]>([]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { mutate, loading, error } = useMutation();

  const toggle = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("post", "/audits/", {
      type,
      department,
      processes: processIds,
      team: teamIds,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 16 }}>
      <h4 className="section-title">Planifier un Audit</h4>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="interne">Interne</option>
            <option value="externe">Externe</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label>Département</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="">-- sélectionner --</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Processus</label>
          <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {processes?.map((p) => (
              <label key={p.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={processIds.includes(String(p.id))}
                  onChange={() => setProcessIds(toggle(processIds, String(p.id)))}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Équipe</label>
          <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {users?.map((u) => (
              <label key={u.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={teamIds.includes(String(u.id))}
                  onChange={() => setTeamIds(toggle(teamIds, String(u.id)))}
                />
                {u.username}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label>Début</label>
            <AppDateInput value={startDate} onChange={setStartDate} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label>Fin</label>
            <AppDateInput value={endDate} onChange={setEndDate} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
        </div>

        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "En cours..." : "Créer"}
        </button>
      </div>
    </form>
  );
}

export default AuditForm;
