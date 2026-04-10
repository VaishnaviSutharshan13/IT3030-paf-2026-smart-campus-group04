import { apiFetch } from "../../../core/api/httpClient";

function normalizeAdminApiError(error) {
  const message = String(error?.message || "");
  if (message.includes("403") || message.toLowerCase().includes("forbidden")) {
    throw new Error("You don't have permission to view this data");
  }
  throw error;
}

function mapRoleFromBackend(roles) {
  const roleList = Array.isArray(roles)
    ? roles
    : roles instanceof Set
      ? Array.from(roles)
      : [];

  const normalized = roleList.map((role) => String(role || "").toUpperCase());
  if (normalized.some((role) => role.includes("ADMIN"))) return "admin";
  if (normalized.includes("LECTURER")) return "lecturer";
  if (normalized.includes("TECHNICIAN")) return "technician";
  if (normalized.includes("STUDENT") || normalized.includes("USER")) return "student";
  return "student";
}

function mapRoleToBackend(role) {
  const value = String(role || "").toLowerCase();
  if (value.includes("admin")) return "ADMIN";
  if (value === "lecturer") return "LECTURER";
  if (value === "technician") return "TECHNICIAN";
  return "USER";
}

function normalizeAdminUser(user) {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: mapRoleFromBackend(user.roles),
    status: user.active ? "active" : "inactive",
    roles: Array.isArray(user.roles) ? user.roles.map((role) => String(role).toLowerCase()) : [],
    active: Boolean(user.active),
  };
}

export function getUsers(filters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.role) query.set("role", filters.role);
  if (filters.status) query.set("status", filters.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/admin/users${suffix}`).then((users) =>
    Array.isArray(users) ? users.map(normalizeAdminUser) : []
  ).catch(normalizeAdminApiError);
}

export function createUser(payload) {
  return apiFetch("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.name || payload.fullName,
      email: payload.email,
      password: payload.password,
      role: mapRoleToBackend(payload.role),
    }),
  }).then(normalizeAdminUser).catch(normalizeAdminApiError);
}

export function updateUser(id, payload) {
  const requestBody = {};
  if (payload.role) requestBody.role = mapRoleToBackend(payload.role);
  if (payload.status) requestBody.status = payload.status;

  return apiFetch(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(requestBody),
  }).then(normalizeAdminUser).catch(normalizeAdminApiError);
}

export function deleteUser(id) {
  return apiFetch(`/admin/users/${id}`, {
    method: "DELETE",
  }).catch(normalizeAdminApiError);
}

export function getSystemStats() {
  return apiFetch("/admin/overview").catch(normalizeAdminApiError);
}

export function getReports() {
  return apiFetch("/reports").catch(normalizeAdminApiError);
}
