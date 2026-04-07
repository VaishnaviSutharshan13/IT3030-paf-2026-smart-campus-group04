import { apiFetch } from "../../../core/api/httpClient";

export function getStudents() {
  return apiFetch("/students");
}

export function createStudent(payload) {
  return apiFetch("/students", { method: "POST", body: JSON.stringify(payload) });
}

export function updateStudent(id, payload) {
  return apiFetch(`/students/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteStudent(id) {
  return apiFetch(`/students/${id}`, { method: "DELETE" });
}

export function getMyAssignments() {
  return apiFetch("/students/assignments/me");
}

export function createAssignment(payload) {
  return apiFetch("/students/assignments", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAssignment(id, payload) {
  return apiFetch(`/students/assignments/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteAssignment(id) {
  return apiFetch(`/students/assignments/${id}`, { method: "DELETE" });
}
