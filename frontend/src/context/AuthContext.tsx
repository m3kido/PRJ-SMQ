import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthInfo = {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  username: string | null;
  avatar: string | null;
};

type AuthContextType = {
  auth: AuthInfo;
  setAuth: (info: AuthInfo) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthInfo>({
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username"),
    avatar: localStorage.getItem("avatar"),
  });

  useEffect(() => {
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

  const setAuth = (info: AuthInfo) => setAuthState(info);

  const logout = () => {
    setAuthState({ accessToken: null, refreshToken: null, role: null, username: null, avatar: null });
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("avatar");
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
