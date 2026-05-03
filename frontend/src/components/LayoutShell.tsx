import { NavLink } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Tableau de Bord", icon: "◫", roles: ["admin", "gestionnaire", "auditeur_interne", "auditeur_externe"] },
  { to: "/processes", label: "Processus", icon: "◎", roles: ["admin", "gestionnaire", "auditeur_interne", "auditeur_externe"] },
  { to: "/audits", label: "Audits", icon: "◌", roles: ["admin", "auditeur_interne", "auditeur_externe"] },
  { to: "/non-conformities", label: "Non-Conformités", icon: "△", roles: ["admin", "auditeur_interne"] },
  { to: "/actions", label: "Actions Correctives", icon: "↗", roles: ["admin", "auditeur_interne"] },
  { to: "/criteria", label: "Critères ISO", icon: "≣", roles: ["admin", "auditeur_interne"] },
  { to: "/evaluation-scales", label: "Échelles", icon: "◍", roles: ["admin", "auditeur_interne"] },
  { to: "/administration", label: "Administration", icon: "◧", roles: ["admin"] },
];

function LayoutShell({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth();
  const role = auth.role;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div>
            <div className="brand">ESI SMQ</div>
            <div className="sidebar-subtitle">Système de management qualité</div>
          </div>
        </div>
        <div className="nav-section">
          <div className="sidebar-section-label">Navigation</div>
          {navItems
            .filter((item) => !role || item.roles.includes(role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                end={item.to === "/"}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-section-label">Session</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {auth.avatar ? (
              <img src={auth.avatar} alt={auth.username ?? "Utilisateur"} style={{ width: 42, height: 42, borderRadius: 999, objectFit: "cover" }} />
            ) : (
              <div className="user-chip">{(auth.username ?? "U").slice(0, 1).toUpperCase()}</div>
            )}
            <div className="sidebar-user">{auth.username ?? "Utilisateur"}</div>
          </div>
          <div className="sidebar-role">{role ?? "role inconnu"}</div>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <div>
            <div className="topbar-title">Pilotage qualité</div>
            <div className="topbar-meta">Vision synthétique des processus, audits et actions</div>
          </div>
          <div className="topbar-right" style={{ gap: 10 }}>
            <span className="user-chip">{auth.username ?? "Utilisateur"}</span>
            <button className="btn-primary" onClick={logout} style={{ padding: "6px 10px" }}>
              Déconnexion
            </button>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

export default LayoutShell;
