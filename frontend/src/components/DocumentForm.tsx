import { useState } from "react";
import { useMutation } from "../hooks/useMutation";

type Props = {
  onSuccess: () => void;
};

function DocumentForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState("brouillon");
  const [file, setFile] = useState<File | null>(null);
  const { mutate, loading, error } = useMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("name", name);
    form.append("version", version);
    form.append("status", status);
    form.append("file", file);
    await mutate("post", "/documents/", form);
    setName("");
    setVersion("1.0");
    setStatus("brouillon");
    setFile(null);
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginBottom: 16 }}>
      <h4 className="section-title">Nouveau Document</h4>
      <div style={{ display: "grid", gap: 10 }}>
        <input
          required
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <input
          placeholder="Version"
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
        <input
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ padding: 6 }}
        />
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "En cours..." : "Uploader"}
        </button>
      </div>
    </form>
  );
}

export default DocumentForm;
