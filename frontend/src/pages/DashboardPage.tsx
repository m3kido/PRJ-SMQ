import { useMemo, useState } from "react";
import SortableHeader from "../components/SortableHeader";
import { sortItems, SortConfig } from "../utils/tableSort";

const urgent = [
  { ref: "NC-2024-001", process: "Production (Ligne B)", date: "14/03/2024", severity: "critique" },
  { ref: "NC-2024-005", process: "Ressources Humaines", date: "12/03/2024", severity: "majeure" },
  { ref: "NC-2023-089", process: "Maintenance SI", date: "10/03/2024", severity: "mineure" },
];

const activity = [
  {
    title: "Validation de l'action corrective AC-442",
    time: "Il y a 10 minutes",
    detail: "Processus de contrôle qualité mis à jour pour inclure les nouveaux capteurs laser.",
  },
  {
    title: "Nouveau rapport d'audit interne déposé",
    time: "Hier, 16:45",
    detail: "Audit n°12 sur le processus RH. Conclusion : 3 non-conformités mineures.",
  },
];

const urgentSortAccessors = {
  ref: (item: typeof urgent[number]) => item.ref,
  process: (item: typeof urgent[number]) => item.process,
  date: (item: typeof urgent[number]) => item.date,
  severity: (item: typeof urgent[number]) => item.severity,
};

function DashboardPage() {
  const [urgentSort, setUrgentSort] = useState<SortConfig>(null);
  const sortedUrgent = useMemo(() => sortItems(urgent, urgentSort, urgentSortAccessors), [urgentSort]);

  return (
    <div className="dashboard-stack">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">Tableau de bord</div>
          <h1 className="dashboard-title">Centre de pilotage qualité</h1>
          <p className="dashboard-copy">
            Une vue unique sur les audits, les actions correctives et les non-conformités critiques.
          </p>
        </div>
        <div className="hero-kpi">
          <span className="hero-kpi-label">Conformité globale</span>
          <strong>88%</strong>
        </div>
      </section>

      <div className="grid stats">
        <div className="card stat-card stat-card-primary">
          <div className="card-title">Actions Correctives</div>
          <div className="card-value">24</div>
          <div className="muted">+2 depuis hier</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Processus Audités</div>
          <div className="card-value" style={{ color: "#8a2d0f" }}>12</div>
          <div className="muted">Cycle 2024</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Taux KPI</div>
          <div className="card-value">92.4%</div>
          <div className="muted">Moyenne trimestrielle</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Prochains Audits</div>
          <div className="card-value" style={{ color: "#b45309" }}>3</div>
          <div className="muted">Échéance 7 jours</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card panel-large">
          <div className="flex-between">
            <h3 className="section-title">Non-Conformités Urgentes</h3>
            <span className="tag">Tout voir</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <SortableHeader label="Référence" sortKey="ref" sortConfig={urgentSort} onSort={(key, direction) => setUrgentSort({ key, direction })} />
                <SortableHeader label="Processus" sortKey="process" sortConfig={urgentSort} onSort={(key, direction) => setUrgentSort({ key, direction })} />
                <SortableHeader label="Date" sortKey="date" sortConfig={urgentSort} onSort={(key, direction) => setUrgentSort({ key, direction })} />
                <SortableHeader label="Sévérité" sortKey="severity" sortConfig={urgentSort} onSort={(key, direction) => setUrgentSort({ key, direction })} />
              </tr>
            </thead>
            <tbody>
              {sortedUrgent.map((item) => (
                <tr key={item.ref}>
                  <td>{item.ref}</td>
                  <td>{item.process}</td>
                  <td>{item.date}</td>
                  <td>
                    <span className={`badge ${item.severity}`}>{item.severity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card panel-side">
          <h3 className="section-title">Flux d'Activité</h3>
          <div className="activity">
            {activity.map((a, idx) => (
              <div key={idx} className="activity-item">
                <div className="muted" style={{ fontSize: 12 }}>{a.time}</div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
