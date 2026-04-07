import { apiFetch } from "../../../core/api/httpClient";

export function fetchBookings() {
  return apiFetch("/bookings", { method: "GET" });
}

export function createBooking(payload) {
  return apiFetch("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBooking(id, payload) {
  return apiFetch(`/bookings/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBooking(id) {
  return apiFetch(`/bookings/${id}`, { method: "DELETE" });
}

export function approveBooking(id) {
  return apiFetch(`/bookings/${id}/approve`, { method: "PUT" });
}

export function rejectBooking(id, reason) {
  return apiFetch(`/bookings/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

export function cancelBooking(id) {
  return apiFetch(`/bookings/${id}/cancel`, { method: "PUT" });
}
