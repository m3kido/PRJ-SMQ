import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import AppDateInput from "../components/AppDateInput";
import { formatDate } from "../utils/date";
import SortableHeader from "../components/SortableHeader";
import { TableLoadingRow } from "../components/LoadingStates";
import { ShowMoreButton, useShowMoreList } from "../components/ShowMoreList";
import { sortItems, SortConfig } from "../utils/tableSort";

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

const processSortAccessors = {
  name: (item: Process) => item.name,
  department: (item: Process) => item.department_name ?? "",
  type: (item: Process) => item.type,
  owner: (item: Process) => item.owner_username ?? "",
};

const assignmentSortAccessors = {
  process: (item: ManagedSheet) => item.process_name,
  manager: (item: ManagedSheet) => item.manager_username,
  department: (item: ManagedSheet) => item.process_department_name ?? "",
  due_date: (item: ManagedSheet) => item.due_date,
  status: (item: ManagedSheet) => item.status,
};

function ProcessesPage() {
  const { auth } = useAuth();
  const { data, loading, error, refetch } = useFetch<Process[]>("/processes/");
  const { data: assignments, loading: assignmentsLoading, refetch: refetchAssignments } = useFetch<ManagedSheet[]>("/managed-process-sheets/");
  const { data: users } = useFetch<{ id: number; username: string; role: string }[]>("/users/");
  const { data: departments } = useFetch<{ id: number; name: string }[]>("/departments/");
  const { mutate, loading: assigning, error: assignError } = useMutation();
  const processes = data ?? [];
  const [processSort, setProcessSort] = useState<SortConfig>(null);
  const [assignmentSort, setAssignmentSort] = useState<SortConfig>(null);
  const [assignmentForm, setAssignmentForm] = useState({ process_title: "", process_department: "", process_type: "operationnel", assigned_manager: "", due_date: "" });
  const sortedProcesses = useMemo(() => sortItems(processes, processSort, processSortAccessors), [processes, processSort]);
  const sortedAssignments = useMemo(() => sortItems(assignments ?? [], assignmentSort, assignmentSortAccessors), [assignments, assignmentSort]);
  const processesInitialLoading = loading && !data;
  const assignmentsInitialLoading = assignmentsLoading && !assignments;
  const isAdmin = auth.role === "admin";
  const isQualityRole = auth.role === "admin" || auth.role === "responsable_qualite";
  const paginatedProcesses = useShowMoreList(sortedProcesses, [processSort?.key, processSort?.direction, sortedProcesses.length]);
  const paginatedAssignments = useShowMoreList(sortedAssignments, [assignmentSort?.key, assignmentSort?.direction, sortedAssignments.length]);

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

  const deleteProcess = async (process: Process) => {
    if (!window.confirm(`Supprimer le processus ${process.name} ?`)) return;
    try {
      await mutate("delete", `/processes/${process.id}/`);
    } catch {
      return;
    }
    refetch();
    refetchAssignments();
  };

  const deleteAssignment = async (assignment: ManagedSheet) => {
    if (!window.confirm(`Supprimer l'affectation du processus ${assignment.process_name} ?`)) return;
    try {
      await mutate("delete", `/managed-process-sheets/${assignment.id}/`);
    } catch {
      return;
    }
    refetchAssignments();
  };

  return (
    <>
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Processus</h3>
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        {assignError && <div style={{ color: "#b91c1c" }}>{assignError}</div>}
        <table className="table">
          <thead>
            <tr>
              <SortableHeader label="Nom" sortKey="name" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <SortableHeader label="Département" sortKey="department" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <SortableHeader label="Type" sortKey="type" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <SortableHeader label="Responsable" sortKey="owner" sortConfig={processSort} onSort={(key, direction) => setProcessSort({ key, direction })} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {processesInitialLoading ? (
              <TableLoadingRow colSpan={5} label="Chargement des processus..." />
            ) : paginatedProcesses.visibleItems.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.department_name ?? ""}</td>
                <td>{p.type}</td>
                <td>{p.owner_username ?? ""}</td>
                <td className="table-actions">
                  <Link className="tag" to={`/processes/${p.id}`}>Détails</Link>
                  {isAdmin && <button className="tag danger-tag" type="button" onClick={() => deleteProcess(p)}>Supprimer</button>}
                </td>
              </tr>
            ))}
            {!processesInitialLoading && sortedProcesses.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-row">Aucun processus à afficher.</td>
              </tr>
            )}
          </tbody>
        </table>
        {!processesInitialLoading && (
          <ShowMoreButton
            shownCount={paginatedProcesses.shownCount}
            totalCount={paginatedProcesses.totalCount}
            onShowMore={paginatedProcesses.showMore}
          />
        )}
      </div>

      {isQualityRole && (
        <div className="card">
          <h3 className="section-title">Affectations aux gestionnaires</h3>
          <table className="table" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <SortableHeader label="Processus" sortKey="process" sortConfig={assignmentSort} onSort={(key, direction) => setAssignmentSort({ key, direction })} />
                <SortableHeader label="Gestionnaire" sortKey="manager" sortConfig={assignmentSort} onSort={(key, direction) => setAssignmentSort({ key, direction })} />
                <SortableHeader label="Département" sortKey="department" sortConfig={assignmentSort} onSort={(key, direction) => setAssignmentSort({ key, direction })} />
                <SortableHeader label="Échéance" sortKey="due_date" sortConfig={assignmentSort} onSort={(key, direction) => setAssignmentSort({ key, direction })} />
                <SortableHeader label="Statut" sortKey="status" sortConfig={assignmentSort} onSort={(key, direction) => setAssignmentSort({ key, direction })} />
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {assignmentsInitialLoading ? (
                <TableLoadingRow colSpan={isAdmin ? 6 : 5} label="Chargement des affectations..." />
              ) : paginatedAssignments.visibleItems.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.process_name}</td>
                  <td>{assignment.manager_username}</td>
                  <td>{assignment.process_department_name ?? ""}</td>
                  <td>{formatDate(assignment.due_date)}</td>
                  <td>{assignment.status}</td>
                  {isAdmin && (
                    <td className="table-actions">
                      <button className="tag danger-tag" type="button" onClick={() => deleteAssignment(assignment)}>Supprimer</button>
                    </td>
                  )}
                </tr>
              ))}
              {!assignmentsInitialLoading && sortedAssignments.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="admin-empty-row">Aucune affectation de fiche processus.</td>
                </tr>
              )}
            </tbody>
          </table>
          {!assignmentsInitialLoading && (
            <ShowMoreButton
              shownCount={paginatedAssignments.shownCount}
              totalCount={paginatedAssignments.totalCount}
              onShowMore={paginatedAssignments.showMore}
            />
          )}

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
