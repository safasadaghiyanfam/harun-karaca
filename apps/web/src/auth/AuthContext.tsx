import { createContext, useContext, useMemo, useState } from "react";
import { api, setToken } from "../api/client";

export type Role = "ADMIN" | "MANAGER" | "CASHIER" | "INVENTORY" | "ACCOUNTING" | "TECHNICIAN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenValue, setTokenValue] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  setToken(tokenValue);

  const value = useMemo<AuthState>(() => ({
    user,
    token: tokenValue,
    login: async (email, password) => {
      const response = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setTokenValue(response.token);
      setToken(response.token);
      setUser(response.user);
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTokenValue(null);
      setToken(null);
      setUser(null);
    }
  }), [tokenValue, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
