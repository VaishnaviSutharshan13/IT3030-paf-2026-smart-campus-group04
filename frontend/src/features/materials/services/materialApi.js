import { apiFetch } from "../../../core/api/httpClient";

export function getMaterials(courseId) {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiFetch(`/materials${query}`);
}

export function createMaterial(payload) {
  return apiFetch("/materials", { method: "POST", body: JSON.stringify(payload) });
}

export function updateMaterial(id, payload) {
  return apiFetch(`/materials/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteMaterial(id) {
  return apiFetch(`/materials/${id}`, { method: "DELETE" });
}
