import { apiFetch } from "../../../core/api/httpClient";

function shouldRetryWithAlternateMethod(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("404")
    || message.includes("405")
    || message.includes("not found")
    || message.includes("method not allowed")
  );
}

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
  const requestBody = {
    technician_id: payload.technicianUserId,
    technicianUserId: payload.technicianUserId,
    priority: payload.priority,
  };

  return apiFetch(`/incidents/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify(requestBody),
  }).catch((error) => {
    if (!shouldRetryWithAlternateMethod(error)) {
      throw error;
    }

    return apiFetch(`/incidents/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify(requestBody),
    });
  });
}

export function updateIncidentPriority(id, priority) {
  return apiFetch(`/incidents/${id}/priority`, {
    method: "PUT",
    body: JSON.stringify({ priority }),
  });
}

export function updateIncidentStatus(id, payload) {
  const requestBody = {
    status: payload.status,
    notes: payload.notes,
  };

  return apiFetch(`/incidents/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(requestBody),
  }).catch((error) => {
    if (!shouldRetryWithAlternateMethod(error)) {
      throw error;
    }

    return apiFetch(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(requestBody),
    });
  });
}

export function updateIncident(id, payload) {
  return apiFetch(`/incidents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function assignTechnician(payload) {
  return assignIncident(payload.incidentId, payload);
}
