import { apiFetch } from "../api/httpClient";

export function getCurrentUser() {
  return apiFetch("/auth/me", { method: "GET" });
}
