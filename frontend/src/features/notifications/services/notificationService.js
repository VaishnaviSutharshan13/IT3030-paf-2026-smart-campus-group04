import { apiFetch } from "../../../core/api/httpClient";

export function fetchNotifications() {
  return apiFetch("/notifications", { method: "GET" });
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch("/notifications/read-all", { method: "POST" });
}
