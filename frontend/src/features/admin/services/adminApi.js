import { apiFetch } from "../../../core/api/httpClient";

export function getUsers(filters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.role) query.set("role", filters.role);
  if (filters.status) query.set("status", filters.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/admin/users${suffix}`);
}

export function createUser(payload) {
  return apiFetch("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id, payload) {
  return apiFetch(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id) {
  return apiFetch(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export function getSystemStats() {
  return apiFetch("/admin/stats");
}
