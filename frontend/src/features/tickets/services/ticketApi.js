import { apiFetch } from "../../../core/api/httpClient";

export function getTickets() {
  return apiFetch("/tickets");
}

export function createTicket(payload) {
  return apiFetch("/tickets", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTicket(id, payload) {
  return apiFetch(`/tickets/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteTicket(id) {
  return apiFetch(`/tickets/${id}`, { method: "DELETE" });
}
