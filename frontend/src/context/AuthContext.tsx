import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import client, { API_BASE } from "../api/client";

type AuthInfo = {
  id: number | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  username: string | null;
  avatar: string | null;
};

type AuthContextType = {
  auth: AuthInfo;
  setAuth: (info: AuthInfo) => void;
  refreshAuth: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAvatarUrl(value?: string | null) {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const host = API_BASE.replace(/\/api\/?$/, "");
  return `${host}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthInfo>({
    id: Number(localStorage.getItem("userId")) || null,
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username"),
    avatar: localStorage.getItem("avatar"),
  });

  useEffect(() => {
    if (auth.id) {
      localStorage.setItem("userId", String(auth.id));
    } else {
      localStorage.removeItem("userId");
    }
    if (auth.accessToken) {
      localStorage.setItem("accessToken", auth.accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
    if (auth.refreshToken) {
      localStorage.setItem("refreshToken", auth.refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
    if (auth.role) {
      localStorage.setItem("role", auth.role);
    } else {
      localStorage.removeItem("role");
    }
    if (auth.username) {
      localStorage.setItem("username", auth.username);
    } else {
      localStorage.removeItem("username");
    }
    if (auth.avatar) {
      localStorage.setItem("avatar", auth.avatar);
    } else {
      localStorage.removeItem("avatar");
    }
  }, [auth]);

  const setAuth = (info: AuthInfo) => setAuthState({ ...info, avatar: normalizeAvatarUrl(info.avatar) });

  const refreshAuth = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) return;
    const resp = await client.get("/me");
    setAuthState((current) => ({
      ...current,
      id: resp.data.id ?? current.id,
      role: resp.data.role ?? current.role,
      username: resp.data.username ?? current.username,
      avatar: normalizeAvatarUrl(resp.data.avatar || resp.data.avatar_url),
    }));
  }, []);

  useEffect(() => {
    if (!auth.accessToken) return;
    refreshAuth().catch(() => undefined);
  }, [auth.accessToken, refreshAuth]);

  const logout = () => {
    setAuthState({ id: null, accessToken: null, refreshToken: null, role: null, username: null, avatar: null });
    localStorage.removeItem("userId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("avatar");
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, refreshAuth, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
