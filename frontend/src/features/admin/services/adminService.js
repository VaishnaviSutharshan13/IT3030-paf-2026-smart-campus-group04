import { apiFetch } from "../../../core/api/httpClient";

export function fetchAdminOverview() {
  return apiFetch("/admin/overview", { method: "GET" });
}

export function fetchUsers() {
  return apiFetch("/admin/users", { method: "GET" });
}

export function updateUserRole(userId, role) {
  return apiFetch(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}
