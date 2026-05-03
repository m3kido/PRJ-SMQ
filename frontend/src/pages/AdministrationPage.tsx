import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import SortableHeader from "../components/SortableHeader";
import { LoadingSpinner, TableLoadingRow } from "../components/LoadingStates";
import { ShowMoreButton, useShowMoreList } from "../components/ShowMoreList";
import { sortItems, SortAccessors, SortConfig } from "../utils/tableSort";

type UserItem = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
  avatar?: string;
};

type DepartmentItem = {
  id: number;
  name: string;
  description: string;
};

type ProcessItem = {
  id: number;
  name: string;
  department?: number | null;
  owner?: number | null;
};

type DepartmentRow = DepartmentItem & {
  processCount: number;
};

const roleOptions = [
  { value: "admin", label: "Admin", tone: "admin" },
  { value: "responsable_qualite", label: "Responsable qualité", tone: "quality" },
  { value: "gestionnaire", label: "Gestionnaire", tone: "manager" },
  { value: "auditeur_interne", label: "Auditeur interne", tone: "auditor" },
  { value: "auditeur_externe", label: "Auditeur externe", tone: "external" },
];

const emptyUserForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  role: "gestionnaire",
};

const emptyDepartmentForm = { name: "", description: "" };

const roleLabel = (value: string) => roleOptions.find((role) => role.value === value)?.label ?? value;
const roleTone = (value: string) => roleOptions.find((role) => role.value === value)?.tone ?? "default";

const userSortAccessors: SortAccessors<UserItem> = {
  name: (item) => `${item.first_name} ${item.last_name} ${item.username}`,
  role: (item) => roleLabel(item.role),
  email: (item) => item.email,
};

const departmentSortAccessors: SortAccessors<DepartmentRow> = {
  name: (item) => item.name,
  processes: (item) => item.processCount,
  description: (item) => item.description,
};

function displayName(user: UserItem) {
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return fullName || user.username;
}

function initials(user: UserItem) {
  const source = displayName(user);
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

function AdministrationPage() {
  const { auth, refreshAuth } = useAuth();
  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useFetch<UserItem[]>("/users/");
  const { data: departments, loading: departmentsLoading, error: departmentsError, refetch: refetchDepartments } = useFetch<DepartmentItem[]>("/departments/");
  const { data: processes } = useFetch<ProcessItem[]>("/processes/");
  const { mutate: mutateUser, loading: savingUser, error: userError } = useMutation();
  const { mutate: mutateDepartment, loading: savingDepartment, error: departmentError } = useMutation();

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [userSort, setUserSort] = useState<SortConfig>({ key: "name", direction: "asc" });
  const [departmentSort, setDepartmentSort] = useState<SortConfig>({ key: "name", direction: "asc" });
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentQuery, setDepartmentQuery] = useState("");

  const userList = users ?? [];
  const departmentList = departments ?? [];
  const processList = processes ?? [];

  const roleCounts = useMemo(() => Object.fromEntries(roleOptions.map((role) => [
    role.value,
    userList.filter((user) => user.role === role.value).length,
  ])), [userList]);

  const departmentRows = useMemo<DepartmentRow[]>(() => departmentList.map((department) => ({
    ...department,
    processCount: processList.filter((process) => process.department === department.id).length,
  })), [departmentList, processList]);

  const departmentsWithoutProcesses = departmentRows.filter((department) => department.processCount === 0).length;

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLocaleLowerCase();
    return userList.filter((user) => {
      const searchable = [
        user.username,
        user.first_name,
        user.last_name,
        user.email,
        roleLabel(user.role),
      ].join(" ").toLocaleLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [roleFilter, userList, userQuery]);

  const filteredDepartments = useMemo(() => {
    const query = departmentQuery.trim().toLocaleLowerCase();
    return departmentRows.filter((department) => {
      const searchable = `${department.name} ${department.description}`.toLocaleLowerCase();
      return !query || searchable.includes(query);
    });
  }, [departmentQuery, departmentRows]);

  const sortedUsers = useMemo(() => sortItems(filteredUsers, userSort, userSortAccessors), [filteredUsers, userSort]);
  const sortedDepartments = useMemo(() => sortItems(filteredDepartments, departmentSort, departmentSortAccessors), [departmentSort, filteredDepartments]);
  const usersInitialLoading = usersLoading && !users;
  const departmentsInitialLoading = departmentsLoading && !departments;
  const paginatedUsers = useShowMoreList(sortedUsers, [userQuery, roleFilter, userSort?.key, userSort?.direction, sortedUsers.length]);
  const paginatedDepartments = useShowMoreList(sortedDepartments, [departmentQuery, departmentSort?.key, departmentSort?.direction, sortedDepartments.length]);

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setAvatarFile(null);
  };

  const resetDepartmentForm = () => {
    setEditingDepartmentId(null);
    setDepartmentForm(emptyDepartmentForm);
  };

  const submitUser = async (e: FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("username", userForm.username.trim());
    payload.append("email", userForm.email.trim());
    payload.append("first_name", userForm.first_name.trim());
    payload.append("last_name", userForm.last_name.trim());
    payload.append("role", userForm.role);
    if (userForm.password) payload.append("password", userForm.password);
    if (avatarFile) payload.append("avatar", avatarFile);

    try {
      if (editingUserId) {
        await mutateUser("patch", `/users/${editingUserId}/`, payload);
      } else {
        await mutateUser("post", "/users/", payload);
      }
    } catch {
      return;
    }
    if (editingUserId && auth.id === editingUserId) {
      await refreshAuth();
    }
    resetUserForm();
    refetchUsers();
  };

  const submitDepartment = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: departmentForm.name.trim(),
      description: departmentForm.description.trim(),
    };
    try {
      if (editingDepartmentId) {
        await mutateDepartment("patch", `/departments/${editingDepartmentId}/`, payload);
      } else {
        await mutateDepartment("post", "/departments/", payload);
      }
    } catch {
      return;
    }
    resetDepartmentForm();
    refetchDepartments();
  };

  const startUserEdit = (user: UserItem) => {
    setEditingUserId(user.id);
    setUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      role: user.role,
    });
    setAvatarFile(null);
  };

  const deleteUser = async (user: UserItem) => {
    if (!window.confirm(`Supprimer l'utilisateur ${displayName(user)} ?`)) return;
    try {
      await mutateUser("delete", `/users/${user.id}/`);
    } catch {
      return;
    }
    if (editingUserId === user.id) resetUserForm();
    refetchUsers();
  };

  const startDepartmentEdit = (department: DepartmentItem) => {
    setEditingDepartmentId(department.id);
    setDepartmentForm({ name: department.name, description: department.description });
  };

  const deleteDepartment = async (department: DepartmentRow) => {
    if (department.processCount > 0) return;
    if (!window.confirm(`Supprimer le département ${department.name} ?`)) return;
    try {
      await mutateDepartment("delete", `/departments/${department.id}/`);
    } catch {
      return;
    }
    if (editingDepartmentId === department.id) resetDepartmentForm();
    refetchDepartments();
  };

  const clearUserFilters = () => {
    setUserQuery("");
    setRoleFilter("all");
  };

  return (
    <div className="dashboard-stack administration-page">
      <section className="dashboard-hero administration-hero">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="dashboard-title">Utilisateurs et départements</h1>
          <p className="dashboard-copy">Pilotez les accès, les rôles qualité et la couverture organisationnelle du SMQ.</p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Comptes</span>
          <strong>{userList.length}</strong>
        </div>
      </section>

      <div className="admin-overview-grid">
        <div className="card admin-overview-card primary">
          <span className="card-title">Utilisateurs</span>
          <strong>{userList.length}</strong>
          <div className="muted">Comptes applicatifs</div>
        </div>
        <div className="card admin-overview-card">
          <span className="card-title">Gestionnaires</span>
          <strong>{roleCounts.gestionnaire ?? 0}</strong>
          <div className="muted">Responsables de processus</div>
        </div>
        <div className="card admin-overview-card">
          <span className="card-title">Auditeurs</span>
          <strong>{(roleCounts.auditeur_interne ?? 0) + (roleCounts.auditeur_externe ?? 0)}</strong>
          <div className="muted">{roleCounts.auditeur_interne ?? 0} interne(s), {roleCounts.auditeur_externe ?? 0} externe(s)</div>
        </div>
        <div className="card admin-overview-card warning">
          <span className="card-title">Départements</span>
          <strong>{departmentList.length}</strong>
          <div className="muted">{departmentsWithoutProcesses} sans processus</div>
        </div>
      </div>

      <section className="card admin-console-card">
        <div className="admin-section-header">
          <div>
            <h3 className="section-title">Comptes utilisateurs</h3>
            <p className="muted">Filtrez les comptes et contrôlez les rôles d'accès à l'application.</p>
          </div>
          {editingUserId && <button type="button" className="tag" onClick={resetUserForm}>Nouvel utilisateur</button>}
        </div>

        <div className="admin-toolbar">
          <label className="field-stack">
            <span className="fiche-label">Recherche</span>
            <input
              className="form-control"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Nom, email, rôle..."
            />
          </label>
          <label className="field-stack">
            <span className="fiche-label">Rôle</span>
            <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">Tous les rôles</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </label>
          {(userQuery || roleFilter !== "all") && (
            <button type="button" className="tag admin-clear-button" onClick={clearUserFilters}>Réinitialiser</button>
          )}
        </div>

        <div className="admin-management-grid">
          <div className="admin-list-panel">
            <div className="admin-list-head">
              <strong>{sortedUsers.length}/{userList.length} compte(s)</strong>
              {usersLoading && !usersInitialLoading && <LoadingSpinner label="Mise à jour..." />}
            </div>
            {usersError && <div className="admin-error">{usersError}</div>}
            <div className="admin-table-shell">
              <table className="table admin-table-tight">
                <thead>
                  <tr>
                    <SortableHeader label="Identité" sortKey="name" sortConfig={userSort} onSort={(key, direction) => setUserSort({ key, direction })} />
                    <SortableHeader label="Rôle" sortKey="role" sortConfig={userSort} onSort={(key, direction) => setUserSort({ key, direction })} />
                    <SortableHeader label="Email" sortKey="email" sortConfig={userSort} onSort={(key, direction) => setUserSort({ key, direction })} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {usersInitialLoading ? (
                    <TableLoadingRow colSpan={4} label="Chargement des utilisateurs..." />
                  ) : paginatedUsers.visibleItems.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          {user.avatar || user.avatar_url ? (
                            <img className="admin-avatar" src={user.avatar || user.avatar_url} alt={displayName(user)} />
                          ) : (
                            <div className="admin-avatar admin-avatar-fallback">{initials(user)}</div>
                          )}
                          <div>
                            <strong>{displayName(user)}</strong>
                            <div className="muted">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`admin-role-badge ${roleTone(user.role)}`}>{roleLabel(user.role)}</span></td>
                      <td>{user.email || <span className="muted">-</span>}</td>
                      <td className="table-actions">
                        <button className="tag" type="button" onClick={() => startUserEdit(user)}>Modifier</button>
                        <button className="tag danger-tag" type="button" onClick={() => deleteUser(user)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                  {!usersInitialLoading && sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="admin-empty-row">Aucun utilisateur ne correspond aux filtres.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!usersInitialLoading && (
              <ShowMoreButton
                shownCount={paginatedUsers.shownCount}
                totalCount={paginatedUsers.totalCount}
                onShowMore={paginatedUsers.showMore}
              />
            )}
          </div>

          <form onSubmit={submitUser} className="admin-form-panel">
            <div className="admin-form-head">
              <h4>{editingUserId ? "Modifier le compte" : "Créer un compte"}</h4>
              {editingUserId && <span className="tag">Édition</span>}
            </div>
            <label className="field-stack">
              <span className="fiche-label">Nom d'utilisateur</span>
              <input required className="form-control" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} placeholder="ex. nbarkat" />
            </label>
            <div className="admin-form-row">
              <label className="field-stack">
                <span className="fiche-label">Prénom</span>
                <input className="form-control" value={userForm.first_name} onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })} />
              </label>
              <label className="field-stack">
                <span className="fiche-label">Nom</span>
                <input className="form-control" value={userForm.last_name} onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })} />
              </label>
            </div>
            <label className="field-stack">
              <span className="fiche-label">Email</span>
              <input className="form-control" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="nom@esi.dz" />
            </label>
            <label className="field-stack">
              <span className="fiche-label">{editingUserId ? "Nouveau mot de passe" : "Mot de passe"}</span>
              <input
                className="form-control"
                type="password"
                required={!editingUserId}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUserId ? "Optionnel" : "Obligatoire"}
              />
            </label>
            <label className="field-stack">
              <span className="fiche-label">Rôle</span>
              <select className="form-control" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
            <label className="admin-upload-zone">
              <span className="fiche-label">Photo de profil</span>
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              <strong>{avatarFile ? avatarFile.name : "Choisir une image"}</strong>
              <small>JPG, PNG ou WebP</small>
            </label>
            {userError && <div className="admin-error">{userError}</div>}
            <div className="admin-form-actions">
              <button className="btn-primary" type="submit" disabled={savingUser}>
                {savingUser ? "Enregistrement..." : editingUserId ? "Enregistrer" : "Créer"}
              </button>
              {editingUserId && <button type="button" className="tag" onClick={resetUserForm}>Annuler</button>}
            </div>
          </form>
        </div>
      </section>

      <section className="card admin-console-card">
        <div className="admin-section-header">
          <div>
            <h3 className="section-title">Départements</h3>
            <p className="muted">Gardez une structure claire entre départements et processus audités.</p>
          </div>
          {editingDepartmentId && <button type="button" className="tag" onClick={resetDepartmentForm}>Nouveau département</button>}
        </div>

        <div className="admin-toolbar admin-toolbar-narrow">
          <label className="field-stack">
            <span className="fiche-label">Recherche</span>
            <input
              className="form-control"
              value={departmentQuery}
              onChange={(e) => setDepartmentQuery(e.target.value)}
              placeholder="Nom ou description..."
            />
          </label>
          {departmentQuery && <button type="button" className="tag admin-clear-button" onClick={() => setDepartmentQuery("")}>Réinitialiser</button>}
        </div>

        <div className="admin-management-grid departments-grid">
          <div className="admin-list-panel">
            <div className="admin-list-head">
              <strong>{sortedDepartments.length}/{departmentList.length} département(s)</strong>
              {departmentsLoading && !departmentsInitialLoading && <LoadingSpinner label="Mise à jour..." />}
            </div>
            {departmentsError && <div className="admin-error">{departmentsError}</div>}
            <div className="admin-table-shell">
              <table className="table admin-table-tight">
                <thead>
                  <tr>
                    <SortableHeader label="Nom" sortKey="name" sortConfig={departmentSort} onSort={(key, direction) => setDepartmentSort({ key, direction })} />
                    <SortableHeader label="Processus" sortKey="processes" sortConfig={departmentSort} onSort={(key, direction) => setDepartmentSort({ key, direction })} />
                    <SortableHeader label="Description" sortKey="description" sortConfig={departmentSort} onSort={(key, direction) => setDepartmentSort({ key, direction })} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {departmentsInitialLoading ? (
                    <TableLoadingRow colSpan={4} label="Chargement des départements..." />
                  ) : paginatedDepartments.visibleItems.map((department) => (
                    <tr key={department.id}>
                      <td><strong>{department.name}</strong></td>
                      <td><span className="admin-mini-kpi">{department.processCount}</span></td>
                      <td className="table-copy-cell">{department.description || <span className="muted">-</span>}</td>
                      <td className="table-actions">
                        <button className="tag" type="button" onClick={() => startDepartmentEdit(department)}>Modifier</button>
                        <button
                          className="tag danger-tag"
                          type="button"
                          disabled={department.processCount > 0}
                          title={department.processCount > 0 ? "Impossible de supprimer un département lié à des processus." : undefined}
                          onClick={() => deleteDepartment(department)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!departmentsInitialLoading && sortedDepartments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="admin-empty-row">Aucun département ne correspond à la recherche.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!departmentsInitialLoading && (
              <ShowMoreButton
                shownCount={paginatedDepartments.shownCount}
                totalCount={paginatedDepartments.totalCount}
                onShowMore={paginatedDepartments.showMore}
              />
            )}
          </div>

          <form onSubmit={submitDepartment} className="admin-form-panel">
            <div className="admin-form-head">
              <h4>{editingDepartmentId ? "Modifier le département" : "Créer un département"}</h4>
              {editingDepartmentId && <span className="tag">Édition</span>}
            </div>
            <label className="field-stack">
              <span className="fiche-label">Nom</span>
              <input required className="form-control" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} placeholder="ex. DPGR" />
            </label>
            <label className="field-stack">
              <span className="fiche-label">Description</span>
              <textarea className="form-control form-textarea" value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} placeholder="Mission ou périmètre du département" />
            </label>
            {departmentError && <div className="admin-error">{departmentError}</div>}
            <div className="admin-form-actions">
              <button className="btn-primary" type="submit" disabled={savingDepartment}>
                {savingDepartment ? "Enregistrement..." : editingDepartmentId ? "Enregistrer" : "Créer"}
              </button>
              {editingDepartmentId && <button type="button" className="tag" onClick={resetDepartmentForm}>Annuler</button>}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default AdministrationPage;
