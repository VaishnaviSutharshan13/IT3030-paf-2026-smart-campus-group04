import { apiFetch } from "../../../core/api/httpClient";

export function getNotifications(options = {}) {
  const params = new URLSearchParams();
  if (options.filter) params.set("filter", options.filter);
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/notifications${query}`);
}

export function getNotificationSummary() {
  return apiFetch("/notifications/summary");
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiFetch("/notifications/read-all", { method: "PATCH" });
}

export function deleteNotification(id) {
  return apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

export function clearAllNotifications() {
  return apiFetch("/notifications/clear-all", { method: "DELETE" });
}

export function createAnnouncement(payload) {
  return apiFetch("/notifications/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
