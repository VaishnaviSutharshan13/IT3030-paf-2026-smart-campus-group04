import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, saveToken } from "../../../core/auth/tokenStorage";
import { apiFetch } from "../../../core/api/httpClient";

const AUTH_STORAGE_KEY = "smart-campus-auth";

const AuthContext = createContext(null);

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
        const profile = await apiFetch("/user/profile");
        setState((prev) => ({ ...prev, user: { ...prev.user, ...profile } }));
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

    const fallbackName = authResponse?.user?.email?.split("@")[0] || "Campus User";
    const user = {
      id: authResponse?.user?.id || null,
      name: authResponse?.user?.name || fallbackName,
      email: authResponse?.user?.email || "user@campus.edu",
      role: authResponse?.user?.role || "student",
      status: authResponse?.user?.status || "active",
    };

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
