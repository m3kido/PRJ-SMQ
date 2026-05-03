import { useState } from "react";
import client from "../api/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const resp = await client.post("/auth/token/", { username, password });
      localStorage.setItem("accessToken", resp.data.access);
      localStorage.setItem("refreshToken", resp.data.refresh);
      const me = await client.get("/me", {
        headers: { Authorization: `Bearer ${resp.data.access}` },
      });
      const role = me.data.role ?? null;
      setAuth({
        id: me.data.id ?? null,
        accessToken: resp.data.access,
        refreshToken: resp.data.refresh,
        role,
        username: me.data.username ?? username,
        avatar: me.data.avatar || me.data.avatar_url || null,
      });
      navigate("/");
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401) {
        setError("Identifiants invalides");
      } else if (detail) {
        setError(String(detail));
      } else {
        setError("Connexion au backend impossible ou réponse inattendue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f5f7fb" }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 320 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Connexion</h3>
        <label style={{ display: "block", marginBottom: 8 }}>Nom d'utilisateur</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12 }}
        />
        <label style={{ display: "block", marginBottom: 8 }}>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 16 }}
        />
        {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
          {submitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
