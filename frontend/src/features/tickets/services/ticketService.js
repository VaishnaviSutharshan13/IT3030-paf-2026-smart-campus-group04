import { apiFetch } from "../../../core/api/httpClient";

export function fetchTickets() {
  return apiFetch("/tickets", { method: "GET" });
}

export function createTicket(payload) {
  return apiFetch("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTicket(id, payload) {
  return apiFetch(`/tickets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTicket(id) {
  return apiFetch(`/tickets/${id}`, { method: "DELETE" });
}

export function startTicketProgress(id) {
  return apiFetch(`/tickets/${id}/start-progress`, { method: "PUT" });
}

export function resolveTicket(id) {
  return apiFetch(`/tickets/${id}/resolve`, { method: "PUT" });
}

export function closeTicket(id) {
  return apiFetch(`/tickets/${id}/close`, { method: "PUT" });
}
