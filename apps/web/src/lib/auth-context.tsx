"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, getToken, setToken, clearToken } from "./api";
import type { AuthUser, RolUsuario } from "./auth-types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: RolUsuario[]) => boolean;
}

const AuthContext = createContext<AuthContextValue>(undefined as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  function hasRole(...roles: RolUsuario[]) {
    if (!user) return false;
    return roles.includes(user.rol);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}