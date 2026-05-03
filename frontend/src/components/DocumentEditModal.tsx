import { useEffect, useState } from "react";
import { useMutation } from "../hooks/useMutation";

type Props = {
  open: boolean;
  onClose: () => void;
  document: {
    id: number;
    name: string;
    version: string;
    status: string;
  } | null;
  onSuccess: () => void;
};

function DocumentEditModal({ open, onClose, document, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState("brouillon");
  const { mutate, loading, error } = useMutation();

  useEffect(() => {
    if (document) {
      setName(document.name);
      setVersion(document.version);
      setStatus(document.status);
    }
  }, [document]);

  if (!open || !document) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutate("patch", `/documents/${document.id}/`, {
      name,
      version,
      status,
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="card" style={{ position: "fixed", top: 100, right: 40, width: 360, zIndex: 20 }}>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h4 className="section-title" style={{ margin: 0 }}>Éditer Document</h4>
        <button className="tag" onClick={onClose}>Fermer</button>
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        >
          <option value="brouillon">Brouillon</option>
          <option value="revision">En révision</option>
          <option value="approuve">Approuvé</option>
        </select>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}

export default DocumentEditModal;
