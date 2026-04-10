import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, saveToken } from "../../../core/auth/tokenStorage";
import { apiFetch } from "../../../core/api/httpClient";

const AUTH_STORAGE_KEY = "smart-campus-auth";
const ROLE_PRIORITY = ["admin", "lecturer", "technician", "student"];
const ROLE_MAP = {
  ADMIN: "admin",
  LECTURER: "lecturer",
  TECHNICIAN: "technician",
  STUDENT: "student",
  USER: "student",
};

const AuthContext = createContext(null);

function normalizeRoleSet(rawRoles) {
  const roles = Array.isArray(rawRoles)
    ? rawRoles
    : rawRoles instanceof Set
      ? Array.from(rawRoles)
      : [];

  const mapped = roles
    .map((role) => {
      const upper = String(role || "").toUpperCase();
      if (upper.includes("ADMIN")) {
        return "admin";
      }
      return ROLE_MAP[upper] || String(role || "").toLowerCase();
    })
    .filter(Boolean);

  for (const candidate of ROLE_PRIORITY) {
    if (mapped.includes(candidate)) {
      return candidate;
    }
  }

  return "student";
}

function normalizeAuthUser(authResponse) {
  const backendRole = normalizeRoleSet(authResponse?.roles);
  const legacyRole = authResponse?.user?.role;
  const role = legacyRole || backendRole;

  return {
    id: authResponse?.user?.id ?? authResponse?.userId ?? null,
    name: authResponse?.user?.name ?? authResponse?.fullName ?? authResponse?.user?.fullName ?? "Campus User",
    email: authResponse?.user?.email ?? authResponse?.email ?? "user@campus.edu",
    role,
    status: authResponse?.user?.status || "active",
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
        const normalizedProfile = {
          id: profile?.id ?? state.user.id,
          name: profile?.fullName ?? state.user.name,
          email: profile?.email ?? state.user.email,
          role: normalizeRoleSet(profile?.roles),
          status: state.user.status || "active",
        };
        setState((prev) => ({ ...prev, user: normalizedProfile }));
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

    const user = normalizeAuthUser(authResponse);

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
