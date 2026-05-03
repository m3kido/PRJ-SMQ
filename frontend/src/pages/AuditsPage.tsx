import { useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import AppDateInput from "../components/AppDateInput";
import { formatDate } from "../utils/date";

type AuditAssignment = {
  id: number;
  audit: number;
  process: number;
  process_name: string;
  auditor_username: string;
  process_department_name: string;
  due_date: string;
  status: string;
};

function AuditsPage() {
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<AuditAssignment[]>("/audit-assignments/");
  const { data: processes } = useFetch<{ id: number; name: string }[]>("/processes/");
  const { data: users } = useFetch<{ id: number; username: string; role: string }[]>("/users/");
  const { mutate, loading: assigning, error: assignError } = useMutation();
  const assignments = data ?? [];
  const [assignmentForm, setAssignmentForm] = useState({ process: "", assigned_auditor: "", due_date: "" });

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("post", "/audit-assignments/", {
      process: Number(assignmentForm.process),
      assigned_auditor: Number(assignmentForm.assigned_auditor),
      due_date: assignmentForm.due_date,
    });
    setAssignmentForm({ process: "", assigned_auditor: "", due_date: "" });
    refetch();
  };

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Audits assignés</h3>
        </div>
        {loading && <div className="muted">Chargement...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Processus</th>
              <th>Auditeur</th>
              <th>Département</th>
              <th>Statut</th>
              <th>Échéance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{`AUD-${assignment.audit}`}</td>
                <td>{assignment.process_name}</td>
                <td>{assignment.auditor_username}</td>
                <td>{assignment.process_department_name ?? ""}</td>
                <td>{assignment.status}</td>
                <td>{formatDate(assignment.due_date)}</td>
                <td className="table-actions">
                  <Link className="tag" to={`/audit-execution/${assignment.id}`}>
                    {assignment.status === "closed" ? "Consulter" : "Lancer l'audit"}
                  </Link>
                  {auth.role === "admin" && assignment.status === "closed" ? (
                    <Link className="tag" to={`/audit-reports/${assignment.id}`}>
                      Rapport
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auth.role === "admin" && (
        <div className="card">
          <h4 className="section-title">Assigner un auditeur à un processus</h4>
          <form onSubmit={submitAssignment} style={{ display: "grid", gap: 10 }}>
            <select value={assignmentForm.process} onChange={(e) => setAssignmentForm({ ...assignmentForm, process: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">Choisir un processus</option>
              {(processes ?? []).map((process) => <option key={process.id} value={process.id}>{process.name}</option>)}
            </select>
            <select value={assignmentForm.assigned_auditor} onChange={(e) => setAssignmentForm({ ...assignmentForm, assigned_auditor: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="">Choisir un auditeur</option>
              {(users ?? []).filter((user) => user.role.startsWith("auditeur_")).map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
            </select>
            <AppDateInput value={assignmentForm.due_date} onChange={(due_date) => setAssignmentForm({ ...assignmentForm, due_date })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            {assignError && <div style={{ color: "#b91c1c" }}>{assignError}</div>}
            <button className="btn-primary" type="submit" disabled={assigning}>{assigning ? "Affectation..." : "Assigner l'auditeur"}</button>
          </form>
        </div>
      )}
    </>
  );
}

export default AuditsPage;
