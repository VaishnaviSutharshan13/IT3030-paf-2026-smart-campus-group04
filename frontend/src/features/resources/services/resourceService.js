import { apiFetch } from "../../../core/api/httpClient";

export function fetchResources() {
  return apiFetch("/resources", { method: "GET" });
}

export function createResource(payload) {
  return apiFetch("/resources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateResource(id, payload) {
  return apiFetch(`/resources/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteResource(id) {
  return apiFetch(`/resources/${id}`, { method: "DELETE" });
}
