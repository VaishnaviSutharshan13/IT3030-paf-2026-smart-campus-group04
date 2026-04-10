import { apiFetch } from "../../../core/api/httpClient";

function toQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", String(filters.status).toUpperCase());
  if (filters.priority) params.set("priority", String(filters.priority).toUpperCase());
  if (filters.locationType) params.set("locationType", String(filters.locationType).toUpperCase());
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listIncidents(filters = {}) {
  return apiFetch(`/incidents${toQuery(filters)}`);
}

export function reportIncident(payload) {
  const rawPayload = {
    locationType: payload.roomType,
    issueType: payload.issueType,
    description: payload.description,
    priority: payload.priority,
    floor: payload.floor,
  };

  const cleanedPayload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
  );

  return apiFetch("/incidents", {
    method: "POST",
    body: JSON.stringify(cleanedPayload),
  });
}

export function assignIncident(id, payload) {
  return apiFetch(`/incidents/${id}/assign`, {
    method: "PUT",
    body: JSON.stringify({
      technicianUserId: payload.technicianUserId,
      priority: payload.priority,
    }),
  });
}

export function updateIncidentPriority(id, priority) {
  return apiFetch(`/incidents/${id}/priority`, {
    method: "PUT",
    body: JSON.stringify({ priority }),
  });
}

export function updateIncidentStatus(id, payload) {
  return apiFetch(`/incidents/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status: payload.status,
      notes: payload.notes,
    }),
  });
}
