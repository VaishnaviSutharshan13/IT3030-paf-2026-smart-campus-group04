import { create } from "zustand";
import { getCurrentUser } from "../../core/auth/authService";
import { clearToken, getToken } from "../../core/auth/tokenStorage";

export const useAuthStore = create((set) => ({
  user: null,
  isBootstrapping: false,
  isAuthenticated: Boolean(getToken()),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  bootstrapSession: async () => {
    if (!getToken()) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ isBootstrapping: true });
    try {
      const user = await getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      clearToken();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isBootstrapping: false });
    }
  },
  logout: () => {
    clearToken();
    set({ user: null, isAuthenticated: false });
  },
}));
