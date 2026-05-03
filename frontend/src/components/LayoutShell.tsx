import { NavLink } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";

const navItems = [
  { to: "/", label: "Tableau de Bord", icon: "◫", roles: ["admin", "responsable_qualite", "gestionnaire", "auditeur_interne", "auditeur_externe"] },
  { to: "/processes", label: "Processus", icon: "◎", roles: ["admin", "responsable_qualite", "gestionnaire", "auditeur_interne", "auditeur_externe"] },
  { to: "/audits", label: "Audits", icon: "◌", roles: ["admin", "responsable_qualite", "auditeur_interne", "auditeur_externe"] },
  { to: "/non-conformities", label: "Non-Conformités", icon: "△", roles: ["admin", "responsable_qualite", "auditeur_interne"] },
  { to: "/actions", label: "Actions Correctives", icon: "↗", roles: ["admin", "responsable_qualite", "gestionnaire", "auditeur_interne"] },
  { to: "/criteria", label: "Critères ISO", icon: "≣", roles: ["admin", "responsable_qualite", "auditeur_interne"] },
  { to: "/evaluation-scales", label: "Échelles", icon: "◍", roles: ["admin", "responsable_qualite", "auditeur_interne"] },
  { to: "/administration", label: "Administration", icon: "◧", roles: ["admin"] },
];

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  responsable_qualite: "Responsable qualité",
  gestionnaire: "Gestionnaire",
  auditeur_interne: "Auditeur interne",
  auditeur_externe: "Auditeur externe",
};

function LayoutShell({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth();
  const { isLoading } = useLoading();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const role = auth.role;
  const avatarSrc = auth.avatar && !avatarFailed ? auth.avatar : null;

  useEffect(() => {
    setAvatarFailed(false);
  }, [auth.avatar]);

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
          <div className="sidebar-session-row">
            {avatarSrc ? (
              <img className="sidebar-avatar" src={avatarSrc} alt={auth.username ?? "Utilisateur"} onError={() => setAvatarFailed(true)} />
            ) : (
              <div className="user-chip sidebar-session-chip">{(auth.username ?? "U").slice(0, 1).toUpperCase()}</div>
            )}
            <div className="sidebar-user">{auth.username ?? "Utilisateur"}</div>
          </div>
          <div className="sidebar-role">{role ? roleLabels[role] ?? role : "role inconnu"}</div>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <div className={`global-loading-bar ${isLoading ? "active" : ""}`} aria-hidden={!isLoading}>
            <span />
          </div>
          <div>
            <div className="topbar-title">Pilotage qualité</div>
            <div className="topbar-meta">Vision synthétique des processus, audits et actions</div>
          </div>
          <div className="topbar-right" style={{ gap: 10 }}>
            {avatarSrc ? (
              <img className="topbar-avatar" src={avatarSrc} alt={auth.username ?? "Utilisateur"} onError={() => setAvatarFailed(true)} />
            ) : (
              <span className="user-chip">{(auth.username ?? "U").slice(0, 1).toUpperCase()}</span>
            )}
            <span className="topbar-user-name">{auth.username ?? "Utilisateur"}</span>
            <button className="btn-primary" onClick={logout} style={{ padding: "6px 10px" }}>
              Déconnexion
            </button>
          </div>
        </header>
        <main className="main" aria-busy={isLoading}>{children}</main>
      </div>
    </div>
  );
}

export default LayoutShell;
