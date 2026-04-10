import { apiFetch } from "../../../core/api/httpClient";

export function getNotifications(options = {}) {
  return apiFetch("/notifications");
}

export function getNotificationSummary() {
  return getNotifications().then((items) => ({
    total: (items || []).length,
    unread: (items || []).filter((item) => !item.read).length,
  }));
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch("/notifications/read-all", { method: "POST" });
}

export function deleteNotification(id) {
  return apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

export function clearAllNotifications() {
  return markAllNotificationsRead();
}

export function createAnnouncement(payload) {
  return Promise.reject(new Error("Announcements endpoint is not available in this backend."));
}
