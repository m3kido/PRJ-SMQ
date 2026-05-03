import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import AppDateInput from "../components/AppDateInput";
import { formatDate } from "../utils/date";

type Process = {
  id: number;
  name: string;
  type: string;
  completeness?: number;
  description?: string;
  owner?: number;
  owner_username?: string;
  department?: number;
  department_name?: string;
};

type ManagedSheet = {
  id: number;
  process_name: string;
  manager_username: string;
  process_department_name?: string;
  due_date: string;
  status: string;
};

function ProcessesPage() {
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<Process[]>("/processes/");
  const { data: assignments, refetch: refetchAssignments } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: users } = useFetch<{ id: number; username: string; role: string }[]>("/users/");
  const { data: departments } = useFetch<{ id: number; name: string }[]>("/departments/");
  const { mutate, loading: assigning, error: assignError } = useMutation();
  const processes = data ?? [];
  const [assignmentForm, setAssignmentForm] = useState({ process_title: "", process_department: "", process_type: "operationnel", assigned_manager: "", due_date: "" });

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("post", "/managed-process-sheets/", {
      process_title: assignmentForm.process_title,
      process_department: assignmentForm.process_department ? Number(assignmentForm.process_department) : null,
      process_type: assignmentForm.process_type,
      assigned_manager: Number(assignmentForm.assigned_manager),
      due_date: assignmentForm.due_date,
    });
    setAssignmentForm({ process_title: "", process_department: "", process_type: "operationnel", assigned_manager: "", due_date: "" });
    refetch();
    refetchAssignments();
  };

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Processus</h3>
        </div>
        {loading && <div className="muted">Chargement...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Département</th>
              <th>Type</th>
              <th>Responsable</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.department_name ?? ""}</td>
                <td>{p.type}</td>
                <td>{p.owner_username ?? ""}</td>
                <td className="table-actions">
                  <Link className="tag" to={`/processes/${p.id}`}>Détails</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auth.role === "admin" && (
        <div className="card">
          <h3 className="section-title">Affectations aux gestionnaires</h3>
          <table className="table" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>Processus</th>
                <th>Gestionnaire</th>
                <th>Département</th>
                <th>Échéance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {(assignments ?? []).map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.process_name}</td>
                  <td>{assignment.manager_username}</td>
                  <td>{assignment.process_department_name ?? ""}</td>
                  <td>{formatDate(assignment.due_date)}</td>
                  <td>{assignment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form onSubmit={submitAssignment} style={{ display: "grid", gap: 10 }}>
            <h4 className="section-title" style={{ margin: 0 }}>Assigner un processus</h4>
            <input
              required
              placeholder="Nom du processus à créer"
              value={assignmentForm.process_title}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, process_title: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <select required value={assignmentForm.process_department} onChange={(e) => setAssignmentForm({ ...assignmentForm, process_department: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">Choisir un département</option>
              {(departments ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <select value={assignmentForm.process_type} onChange={(e) => setAssignmentForm({ ...assignmentForm, process_type: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="management">Management</option>
              <option value="operationnel">Opérationnel</option>
              <option value="support">Support</option>
            </select>
            <select required value={assignmentForm.assigned_manager} onChange={(e) => setAssignmentForm({ ...assignmentForm, assigned_manager: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">Choisir un gestionnaire</option>
              {(users ?? []).filter((user) => user.role === "gestionnaire").map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
            </select>
            <AppDateInput required value={assignmentForm.due_date} onChange={(due_date) => setAssignmentForm({ ...assignmentForm, due_date })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            {assignError && <div style={{ color: "#b91c1c" }}>{assignError}</div>}
            <button className="btn-primary" type="submit" disabled={assigning}>{assigning ? "Affectation..." : "Assigner au gestionnaire"}</button>
          </form>
        </div>
      )}
    </>
  );
}

export default ProcessesPage;
