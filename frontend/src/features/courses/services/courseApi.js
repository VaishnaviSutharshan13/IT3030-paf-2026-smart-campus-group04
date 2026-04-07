import { apiFetch } from "../../../core/api/httpClient";

export function getCourses() {
  return apiFetch("/courses");
}

export function createCourse(payload) {
  return apiFetch("/courses", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCourse(id, payload) {
  return apiFetch(`/courses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteCourse(id) {
  return apiFetch(`/courses/${id}`, { method: "DELETE" });
}
