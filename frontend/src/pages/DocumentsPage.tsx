import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import DocumentForm from "../components/DocumentForm";
import DocumentEditModal from "../components/DocumentEditModal";

type Doc = {
  id: number;
  name: string;
  version: string;
  status: string;
  updated_at: string;
};

function DocumentsPage() {
  const { data, loading, error, refetch } = useFetch<Doc[]>("/documents/");
  const docs = data ?? [];
  const [editing, setEditing] = useState<Doc | null>(null);

  return (
    <>
      <DocumentForm onSuccess={refetch} />
      <DocumentEditModal
        open={Boolean(editing)}
        document={editing}
        onClose={() => setEditing(null)}
        onSuccess={refetch}
      />
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Documents</h3>
        </div>
        {loading && <div className="muted">Chargement...</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Nom du fichier</th>
              <th>Version</th>
              <th>Statut</th>
              <th>Dernière modification</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.version}</td>
                <td>{d.status}</td>
                <td>{new Date(d.updated_at).toLocaleDateString()}</td>
                <td className="table-actions">
                  <button className="tag" onClick={() => setEditing(d)}>
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default DocumentsPage;
