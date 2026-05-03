import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { useMutation } from "../hooks/useMutation";

type UserItem = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: number | null;
  department_name?: string | null;
  avatar_url?: string;
  avatar?: string;
};

type DepartmentItem = {
  id: number;
  name: string;
  description: string;
};

function AdministrationPage() {
  const { data: users, refetch: refetchUsers } = useFetch<UserItem[]>("/users/");
  const { data: departments, refetch: refetchDepartments } = useFetch<DepartmentItem[]>("/departments/");
  const { mutate, loading, error } = useMutation();
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [userForm, setUserForm] = useState({ username: "", email: "", first_name: "", last_name: "", password: "", role: "gestionnaire", department: "" });
  const [departmentForm, setDepartmentForm] = useState({ name: "", description: "" });

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm({ username: "", email: "", first_name: "", last_name: "", password: "", role: "gestionnaire", department: "" });
    setAvatarFile(null);
  };

  const resetDepartmentForm = () => {
    setEditingDepartmentId(null);
    setDepartmentForm({ name: "", description: "" });
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("username", userForm.username);
    payload.append("email", userForm.email);
    payload.append("first_name", userForm.first_name);
    payload.append("last_name", userForm.last_name);
    payload.append("role", userForm.role);
    if (userForm.password) payload.append("password", userForm.password);
    if (userForm.department) payload.append("department", userForm.department);
    if (avatarFile) payload.append("avatar", avatarFile);
    if (editingUserId) {
      await mutate("patch", `/users/${editingUserId}/`, payload);
    } else {
      await mutate("post", "/users/", payload);
    }
    resetUserForm();
    refetchUsers();
  };

  const submitDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartmentId) {
      await mutate("patch", `/departments/${editingDepartmentId}/`, departmentForm);
    } else {
      await mutate("post", "/departments/", departmentForm);
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
      department: user.department ? String(user.department) : "",
    });
    setAvatarFile(null);
  };

  const deleteUser = async (id: number) => {
    await mutate("delete", `/users/${id}/`);
    if (editingUserId === id) resetUserForm();
    refetchUsers();
  };

  const startDepartmentEdit = (department: DepartmentItem) => {
    setEditingDepartmentId(department.id);
    setDepartmentForm({ name: department.name, description: department.description });
  };

  const deleteDepartment = async (id: number) => {
    await mutate("delete", `/departments/${id}/`);
    if (editingDepartmentId === id) resetDepartmentForm();
    refetchDepartments();
  };

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="dashboard-title">Utilisateurs et départements</h1>
          <p className="dashboard-copy">Gérez les comptes, les rôles, les avatars et les départements de travail.</p>
        </div>
      </section>

      <div className="card panel-large admin-section-card admin-tight-card">
        <div className="flex-between">
          <h3 className="section-title">Utilisateurs</h3>
          <span className="tag">Comptes</span>
        </div>
        <table className="table admin-table-tight" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Email</th>
              <th>Avatar</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <tr key={user.id}>
                <td>{user.first_name || user.username}</td>
                <td>{user.role}</td>
                <td>{user.email}</td>
                <td>{user.avatar ? <img src={user.avatar} alt={user.username} style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }} /> : <div className="user-chip">{user.username.slice(0, 1).toUpperCase()}</div>}</td>
                <td className="table-actions">
                  <button className="tag" onClick={() => startUserEdit(user)}>Modifier</button>
                  <button className="tag" onClick={() => deleteUser(user.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="admin-form-shell">
        <form onSubmit={submitUser} className="compact-form-grid">
          <h4 className="section-title" style={{ margin: 0 }}>{editingUserId ? "Modifier l'utilisateur" : "Créer un utilisateur"}</h4>
          <input placeholder="Nom d'utilisateur" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <input placeholder="Prénom" value={userForm.first_name} onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <input placeholder="Nom" value={userForm.last_name} onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <input placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <input placeholder={editingUserId ? "Nouveau mot de passe (optionnel)" : "Mot de passe"} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="admin">Admin</option>
            <option value="gestionnaire">Gestionnaire</option>
            <option value="auditeur_interne">Auditeur interne</option>
            <option value="auditeur_externe">Auditeur externe</option>
          </select>
          <select value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <option value="">Département (optionnel)</option>
            {(departments ?? []).map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
          <div className="field-stack compact-upload-block">
            <label className="muted">Photo de profil (optionnelle)</label>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} style={{ padding: 6 }} />
            <span className="muted">{avatarFile ? avatarFile.name : "Aucun fichier sélectionné"}</span>
          </div>
          {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Enregistrement..." : editingUserId ? "Enregistrer les modifications" : "Créer l'utilisateur"}</button>
            {editingUserId ? <button type="button" className="tag" onClick={resetUserForm}>Annuler</button> : null}
          </div>
        </form>
        </div>
      </div>

      <div className="card panel-large admin-section-card admin-tight-card">
          <div className="flex-between">
            <h3 className="section-title">Départements</h3>
            <span className="tag">Référentiel</span>
          </div>
          <table className="table admin-table-tight" style={{ marginBottom: 12 }}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(departments ?? []).map((department) => (
                <tr key={department.id}>
                  <td>{department.name}</td>
                  <td>{department.description}</td>
                  <td className="table-actions">
                    <button className="tag" onClick={() => startDepartmentEdit(department)}>Modifier</button>
                    <button className="tag" onClick={() => deleteDepartment(department.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-form-shell">
          <form onSubmit={submitDepartment} className="compact-form-grid compact-form-grid-narrow">
            <h4 className="section-title" style={{ margin: 0 }}>{editingDepartmentId ? "Modifier le département" : "Créer un département"}</h4>
            <input placeholder="Nom" value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <textarea placeholder="Description" value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 90 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" type="submit">{editingDepartmentId ? "Enregistrer les modifications" : "Créer le département"}</button>
              {editingDepartmentId ? <button type="button" className="tag" onClick={resetDepartmentForm}>Annuler</button> : null}
            </div>
          </form>
          </div>
      </div>
    </div>
  );
}

export default AdministrationPage;
