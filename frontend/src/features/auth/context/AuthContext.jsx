import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, saveToken } from "../../../core/auth/tokenStorage";
import { apiFetch } from "../../../core/api/httpClient";

const AUTH_STORAGE_KEY = "smart-campus-auth";

const AuthContext = createContext(null);

function normalizeRole(role) {
  const value = String(role || "").trim().toUpperCase();
  if (value === "SUPER_ADMIN") return "super_admin";
  if (value === "ADMIN") return "admin";
  if (value === "LECTURER") return "lecturer";
  if (value === "TECHNICIAN") return "technician";
  if (value === "STUDENT" || value === "USER") return "student";
  return null;
}

function resolvePrimaryRole(roles) {
  const list = Array.isArray(roles) ? roles : [];
  return (
    list.map(normalizeRole).find(Boolean) ||
    "student"
  );
}

function mapAuthResponseToUser(authResponse) {
  return {
    id: authResponse?.userId || null,
    name: authResponse?.fullName || "Campus User",
    email: authResponse?.email || "user@campus.edu",
    role: resolvePrimaryRole(authResponse?.roles),
    roles: Array.isArray(authResponse?.roles) ? authResponse.roles : [],
    status: "active",
  };
}

function mapProfileToUser(profile, previousUser) {
  return {
    ...(previousUser || {}),
    id: profile?.id ?? previousUser?.id ?? null,
    name: profile?.fullName || previousUser?.name || "Campus User",
    email: profile?.email || previousUser?.email || "user@campus.edu",
    role: resolvePrimaryRole(profile?.roles || previousUser?.roles),
    roles: Array.isArray(profile?.roles) ? profile.roles : (previousUser?.roles || []),
    status: previousUser?.status || "active",
  };
}

function readPersistedAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return { isAuthenticated: false, user: null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      isAuthenticated: Boolean(parsed?.isAuthenticated),
      user: parsed?.user || null,
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => readPersistedAuth());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    async function bootstrapProfile() {
      if (!state.isAuthenticated || !state.user) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const profile = await apiFetch("/auth/me");
        setState((prev) => ({ ...prev, user: mapProfileToUser(profile, prev.user) }));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        clearToken();
        setState({ isAuthenticated: false, user: null });
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrapProfile();
  }, []);

  const login = useCallback((authResponse) => {
    if (authResponse?.token) {
      saveToken(authResponse.token);
    }

    const user = mapAuthResponseToUser(authResponse);

    setState({ isAuthenticated: true, user });
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    clearToken();
    setState({ isAuthenticated: false, user: null });
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      isBootstrapping,
      login,
      logout,
    }),
    [isBootstrapping, login, logout, state.isAuthenticated, state.user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
