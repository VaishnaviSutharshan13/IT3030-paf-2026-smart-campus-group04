import { apiFetch } from "../../../core/api/httpClient";

export function getFacilities() {
  return apiFetch("/facilities");
}

export function createFacility(payload) {
  return apiFetch("/facilities", { method: "POST", body: JSON.stringify(payload) });
}

export function updateFacility(id, payload) {
  return apiFetch(`/facilities/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteFacility(id) {
  return apiFetch(`/facilities/${id}`, { method: "DELETE" });
}
