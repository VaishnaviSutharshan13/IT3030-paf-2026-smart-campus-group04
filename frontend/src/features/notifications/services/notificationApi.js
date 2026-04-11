import { apiFetch } from "../../../core/api/httpClient";
import { getBookings } from "../../bookings/services/bookingApi";
import { listIncidents } from "../../incidents/services/incidentApi";

const AUTH_STORAGE_KEY = "smart-campus-auth";
const SYNTHETIC_READ_KEY = "smart-campus-synthetic-notification-read";
const SYNTHETIC_READ_ALL_AT_KEY = "smart-campus-synthetic-notification-read-all-at";

function readPersistedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || null;
  } catch {
    return null;
  }
}

function readSyntheticReadSet() {
  try {
    const raw = localStorage.getItem(SYNTHETIC_READ_KEY);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((item) => String(item)));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function writeSyntheticReadSet(set) {
  localStorage.setItem(SYNTHETIC_READ_KEY, JSON.stringify(Array.from(set)));
}

function getSyntheticReadAllAt() {
  const raw = localStorage.getItem(SYNTHETIC_READ_ALL_AT_KEY);
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

function setSyntheticReadAllNow() {
  localStorage.setItem(SYNTHETIC_READ_ALL_AT_KEY, String(Date.now()));
}

function toTimeMs(value) {
  const time = new Date(value).getTime();
  if (Number.isFinite(time)) return time;
  return 0;
}

function toSafeText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeStatus(value, fallback = "PENDING") {
  const upper = String(value || "").trim().toUpperCase();
  return upper || fallback;
}

function toNumberOrNaN(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isBookingVisibleForRole(booking, role, userId) {
  if (role === "admin") return true;
  if (role === "technician") return false;

  const requesterId = toNumberOrNaN(
    booking?.requesterUserId
      ?? booking?.requesterId
      ?? booking?.requestedBy
      ?? booking?.userId
  );

  if (!Number.isFinite(userId) || !Number.isFinite(requesterId)) {
    return false;
  }

  return requesterId === userId;
}

function isIncidentVisibleForRole(incident, role, userId) {
  if (role === "admin") return true;

  const reporterId = toNumberOrNaN(incident?.reportedBy);
  const assigneeId = toNumberOrNaN(incident?.assignedTo);
  if (!Number.isFinite(userId)) return false;

  if (role === "technician") {
    return reporterId === userId || assigneeId === userId;
  }

  return reporterId === userId;
}

function normalizeNotification(item) {
  return {
    id: item?.id,
    title: item?.title || item?.type || "Notification",
    type: item?.type || "SYSTEM",
    message: item?.message || "",
    read: Boolean(item?.read ?? item?.is_read),
    createdAt: item?.createdAt || item?.created_at,
    source: "server",
  };
}

function normalizeRows(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map(normalizeNotification);
}

function toBookingNotification(booking, userId, readSet, syntheticReadAllAt) {
  const bookingId = booking?.id;
  const status = normalizeStatus(booking?.status, "PENDING");
  const room = toSafeText(booking?.roomNumber, `Resource ${booking?.resourceId || "N/A"}`);
  const createdAt = booking?.updatedAt || booking?.createdAt || booking?.startAt || new Date().toISOString();
  const createdAtMs = toTimeMs(createdAt);
  const id = `booking-${bookingId}-${status}`;

  return {
    id,
    title: "Booking Update",
    type: "BOOKING",
    message: `Booking #${bookingId} for ${room} is ${status.replaceAll("_", " ")}.`,
    read: readSet.has(id) || (createdAtMs > 0 && createdAtMs <= syntheticReadAllAt),
    createdAt,
    source: "synthetic",
    sourceEntityType: "booking",
    sourceEntityId: bookingId,
    ownerId: userId,
  };
}

function toIncidentNotification(incident, userId, readSet, syntheticReadAllAt) {
  const incidentId = incident?.id;
  const status = normalizeStatus(incident?.status, "PENDING");
  const issue = toSafeText(incident?.issueType, "Issue");
  const location = toSafeText(String(incident?.locationType || "").replaceAll("_", " "), "Campus");
  const createdAt = incident?.updatedAt || incident?.createdAt || new Date().toISOString();
  const createdAtMs = toTimeMs(createdAt);
  const id = `incident-${incidentId}-${status}`;

  return {
    id,
    title: "Incident Update",
    type: "INCIDENT",
    message: `${issue} at ${location} is ${status.replaceAll("_", " ")}.`,
    read: readSet.has(id) || (createdAtMs > 0 && createdAtMs <= syntheticReadAllAt),
    createdAt,
    source: "synthetic",
    sourceEntityType: "incident",
    sourceEntityId: incidentId,
    ownerId: userId,
  };
}

function applyFilter(rows, filter) {
  if (filter === "unread") {
    return rows.filter((item) => !item.read);
  }
  if (filter === "read") {
    return rows.filter((item) => item.read);
  }
  return rows;
}

function applyPagination(rows, page, limit) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || rows.length || 1);
  const start = (safePage - 1) * safeLimit;
  return rows.slice(start, start + safeLimit);
}

export function getNotifications(options = {}) {
  const user = readPersistedAuthUser();
  const userId = Number(user?.id);
  const role = String(user?.role || "").toLowerCase();
  const readSet = readSyntheticReadSet();
  const syntheticReadAllAt = getSyntheticReadAllAt();

  return Promise.allSettled([
    apiFetch("/notifications").then(normalizeRows),
    getBookings(),
    listIncidents(),
  ]).then(([serverResult, bookingsResult, incidentsResult]) => {
    const serverRows = serverResult.status === "fulfilled" ? serverResult.value : [];
    const bookingRows = bookingsResult.status === "fulfilled" && Array.isArray(bookingsResult.value)
      ? bookingsResult.value
      : [];
    const incidentRows = incidentsResult.status === "fulfilled" && Array.isArray(incidentsResult.value)
      ? incidentsResult.value
      : [];

    const bookingNotifications = bookingRows
      .filter((booking) => isBookingVisibleForRole(booking, role, userId))
      .slice(0, 100)
      .map((booking) => toBookingNotification(booking, userId, readSet, syntheticReadAllAt));

    const incidentNotifications = incidentRows
      .filter((incident) => isIncidentVisibleForRole(incident, role, userId))
      .slice(0, 100)
      .map((incident) => toIncidentNotification(incident, userId, readSet, syntheticReadAllAt));

    const merged = [...serverRows, ...bookingNotifications, ...incidentNotifications]
      .filter((item) => item?.id)
      .sort((a, b) => toTimeMs(b?.createdAt) - toTimeMs(a?.createdAt));

    const filtered = applyFilter(merged, options?.filter);
    return applyPagination(filtered, options?.page, options?.limit);
  });
}

export function getNotificationSummary() {
  return getNotifications({ filter: "all" }).then((items = []) => ({
    total: (items || []).length,
    unread: (items || []).filter((item) => !item?.read).length,
  }));
}

export function markNotificationRead(id) {
  if (String(id || "").startsWith("booking-") || String(id || "").startsWith("incident-")) {
    const readSet = readSyntheticReadSet();
    readSet.add(String(id));
    writeSyntheticReadSet(readSet);
    return Promise.resolve(null);
  }
  return apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  setSyntheticReadAllNow();
  return apiFetch("/notifications/read-all", { method: "POST" }).catch(() => null);
}

export function deleteNotification(id) {
  if (String(id || "").startsWith("booking-") || String(id || "").startsWith("incident-")) {
    const readSet = readSyntheticReadSet();
    readSet.add(String(id));
    writeSyntheticReadSet(readSet);
    return Promise.resolve(null);
  }
  return apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

export function clearAllNotifications() {
  return markAllNotificationsRead();
}

export function createAnnouncement(payload) {
  return Promise.reject(new Error("Announcements endpoint is not available in this backend."));
}
