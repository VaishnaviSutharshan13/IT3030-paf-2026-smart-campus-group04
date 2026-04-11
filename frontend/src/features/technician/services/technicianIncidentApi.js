import { apiFetch } from "../../../core/api/httpClient";

function normalizeIncidentRow(incident) {
  const issueType = String(incident?.issueType || "OTHER").toUpperCase();
  const locationType = String(incident?.locationType || "LAB").toUpperCase();

  return {
    id: incident?.id,
    title: issueType.replaceAll("_", " "),
    issueType,
    status: String(incident?.status || "PENDING").toUpperCase(),
    priority: String(incident?.priority || "LOW").toUpperCase(),
    floor: incident?.floor || "N/A",
    locationType,
    locationLabel: `${incident?.floor || "N/A"} • ${locationType.replaceAll("_", " ")}`,
    description: incident?.description || "No description",
    note: incident?.technicianNotes || incident?.note || "",
    technicianId: incident?.assignedTo || null,
    assignedToName: incident?.assignedToName || "Unassigned",
    createdAt: incident?.createdAt || null,
    updatedAt: incident?.updatedAt || null,
  };
}

function toFiltersQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "ALL") params.set("status", String(filters.status).toUpperCase());
  if (filters?.priority && filters.priority !== "ALL") params.set("priority", String(filters.priority).toUpperCase());
  if (filters?.location && filters.location !== "ALL") params.set("locationType", String(filters.location).toUpperCase());
  const query = params.toString();
  return query ? `?${query}` : "";
}

function normalizeStatusForApi(status) {
  const normalized = String(status || "PENDING").trim().toUpperCase();
  if (normalized === "IN PROGRESS") return "IN_PROGRESS";
  if (normalized === "OPEN") return "PENDING";
  if (normalized === "APPROVED") return "ASSIGNED";
  if (normalized === "COMPLETED") return "RESOLVED";
  if (normalized === "FINISHED") return "RESOLVED";
  if (normalized === "CLOSED") return "RESOLVED";
  return normalized;
}

export async function fetchAssignedIncidents(filters = {}) {
  const query = toFiltersQuery(filters);
  // Stable path for technician users: backend already scopes /incidents by assignee.
  // This avoids noisy 404s when /assigned compatibility routes are unavailable.
  let rows = await apiFetch(`/incidents${query}`);

  // Fallback for environments where dedicated assigned route is required.
  if (!Array.isArray(rows)) {
    try {
      rows = await apiFetch(`/incidents/assigned${query}`);
    } catch {
      rows = await apiFetch(`/technician/incidents/assigned${query}`);
    }
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.map((item) => normalizeIncidentRow(item));
}

export async function patchIncidentStatus(id, status) {
  let updated;
  try {
    updated = await apiFetch(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  } catch {
    updated = await apiFetch(`/incidents/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }
  return normalizeIncidentRow(updated || {});
}

export async function patchIncidentNote(id, note, currentStatus = "PENDING") {
  let updated;
  try {
    updated = await apiFetch(`/incidents/${id}/note`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
  } catch {
    try {
      // Compatibility path for servers exposing technician-scoped note endpoint.
      updated = await apiFetch(`/technician/incidents/${id}/note`, {
        method: "PATCH",
        body: JSON.stringify({ note }),
      });
    } catch {
      // Stable fallback on older backends: use status endpoint with a valid transition.
      const normalized = normalizeStatusForApi(currentStatus);
      const fallbackStatus = normalized === "PENDING" ? "IN_PROGRESS" : normalized;

      try {
        updated = await apiFetch(`/incidents/${id}/status`, {
          method: "PUT",
          body: JSON.stringify({
            status: fallbackStatus,
            notes: note,
          }),
        });
      } catch {
        updated = await apiFetch(`/incidents/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: fallbackStatus,
            notes: note,
          }),
        });
      }
    }
  }
  return normalizeIncidentRow(updated || {});
}

export async function updateIncidentTicket(id, payload) {
  const updated = await apiFetch(`/incidents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizeIncidentRow(updated || {});
}

export async function deleteIncidentTicket(id) {
  await apiFetch(`/incidents/${id}`, {
    method: "DELETE",
  });
  return { id };
}

export async function createTechnicianIncident(payload) {
  let response;
  try {
    response = await apiFetch("/incidents/technician", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    try {
      response = await apiFetch("/technician/incidents/technician", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      // Final compatibility fallback.
      response = await apiFetch("/incidents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
  }
  return normalizeIncidentRow(response || {});
}
