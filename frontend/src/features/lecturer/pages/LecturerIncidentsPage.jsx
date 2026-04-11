import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { listIncidents, reportIncident } from "../../incidents/services/incidentApi";
import { getTickets } from "../../tickets/services/ticketApi";
import { useAuth } from "../../auth/context/AuthContext";
import StatusBadge from "../../../components/dashboard/StatusBadge";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function toLocationType(value) {
  const upper = String(value || "").trim().toUpperCase();
  if (!upper) return "CLASSROOM";
  return upper.replaceAll(" ", "_");
}

function parseLocationFromDescription(description = "") {
  const text = String(description || "");
  const marker = text.match(/Location:\s*([^\n]+)/i);
  if (!marker) {
    return { floor: "", roomType: "" };
  }

  const [floor, roomType] = marker[1].split("-").map((part) => String(part || "").trim());
  return {
    floor: floor || "",
    roomType: roomType || "",
  };
}

function mapTicketToIncident(ticket) {
  const parsed = parseLocationFromDescription(ticket.description);
  const inferredRoomType = parsed.roomType || "Classroom";

  return {
    id: ticket.id,
    reportedBy: ticket.reporterUserId,
    locationType: toLocationType(inferredRoomType),
    floor: parsed.floor,
    issueType: ticket.title,
    description: ticket.description,
    priority: String(ticket.priority || "MEDIUM").toUpperCase(),
    status: String(ticket.status || "OPEN").toUpperCase(),
    createdAt: ticket.incidentAt,
  };
}

function extractErrorMessage(error, fallbackMessage) {
  const raw = String(error?.message || "").trim();
  if (!raw) return fallbackMessage;
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
  return raw;
}

export default function LecturerIncidentsPage() {
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({ status: "", priority: "", locationType: "" });
  const [incident, setIncident] = useState({
    roomType: "SMART_CLASSROOM",
    floor: "Floor 1",
    issueType: "COMPUTER",
    description: "",
    priority: "MEDIUM",
  });

  async function fetchIncidentsWithFallback() {
    try {
      const incidentRows = await listIncidents();
      return Array.isArray(incidentRows) ? incidentRows : [];
    } catch {
      const ticketRows = await getTickets();
      const mapped = (Array.isArray(ticketRows) ? ticketRows : []).map(mapTicketToIncident);
      if (user?.id) {
        return mapped.filter((row) => Number(row.reportedBy) === Number(user.id));
      }
      return mapped;
    }
  }

  async function loadIncidents() {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchIncidentsWithFallback();
      setIncidents(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  const filteredIncidents = useMemo(() => {
    return (incidents || []).filter((row) => {
      if (filters.status && String(row.status || "").toUpperCase() !== filters.status) return false;
      if (filters.priority && String(row.priority || "").toUpperCase() !== filters.priority) return false;
      if (filters.locationType && String(row.locationType || "").toUpperCase() !== filters.locationType) return false;
      return true;
    });
  }, [incidents, filters]);

  async function onSubmitIncident(event) {
    event.preventDefault();

    const payload = {
      issueType: String(incident.issueType || "").trim().toUpperCase(),
      description: String(incident.description || "").trim(),
      priority: String(incident.priority || "").trim().toUpperCase(),
      floor: String(incident.floor || "").trim(),
      roomType: String(incident.roomType || "").trim().toUpperCase(),
    };

    const hasInvalidUnknownLocation = /unknown/i.test(payload.floor) || /unknown/i.test(payload.roomType);
    if (!payload.issueType || !payload.description || !payload.priority || !payload.floor || !payload.roomType || hasInvalidUnknownLocation) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await reportIncident(payload);
      toast.success("Incident reported successfully");
      setIncident({
        roomType: "SMART_CLASSROOM",
        floor: "Floor 1",
        issueType: "COMPUTER",
        description: "",
        priority: "MEDIUM",
      });
      await loadIncidents();
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, "Failed to report incident. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Lecturer Incident Management</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-800">Report and Track Technical Incidents</h2>
          <p className="mt-1 text-sm text-slate-600">Create incidents and monitor status updates from one place.</p>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Make Incident</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmitIncident}>
          <select className="input-field" value={incident.roomType} onChange={(e) => setIncident((p) => ({ ...p, roomType: e.target.value }))}>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="SMART_CLASSROOM">Smart Classroom</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="LAB">Lab</option>
          </select>
          <input className="input-field" placeholder="Floor (e.g. Floor 2)" value={incident.floor} onChange={(e) => setIncident((p) => ({ ...p, floor: e.target.value }))} required />
          <select className="input-field" value={incident.issueType} onChange={(e) => setIncident((p) => ({ ...p, issueType: e.target.value }))}>
            <option value="COMPUTER">Computer</option>
            <option value="AC">AC</option>
            <option value="LIGHTS">Lights</option>
            <option value="PROJECTOR">Projector</option>
            <option value="NETWORK">Network</option>
            <option value="OTHER">Other</option>
          </select>
          <select className="input-field" value={incident.priority} onChange={(e) => setIncident((p) => ({ ...p, priority: e.target.value }))}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <textarea className="input-field md:col-span-2" placeholder="Describe the issue" value={incident.description} onChange={(e) => setIncident((p) => ({ ...p, description: e.target.value }))} required />
          <div className="md:col-span-2 mt-1 flex justify-end">
            <button type="submit" className="btn-primary gap-2" disabled={submitting}>
              <Plus size={16} />
              {submitting ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">View My Incidents</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="input-field" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="REJECTED">Rejected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select className="input-field" value={filters.priority} onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className="input-field" value={filters.locationType} onChange={(e) => setFilters((prev) => ({ ...prev, locationType: e.target.value }))}>
            <option value="">All Locations</option>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="SMART_CLASSROOM">Smart Classroom</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="LAB">Lab</option>
          </select>
          <div className="flex items-center text-sm text-slate-500">{filteredIncidents.length} incidents</div>
        </div>

        {loading ? <p className="mt-3 text-sm text-slate-500">Loading incidents...</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="mt-3 space-y-2">
            {filteredIncidents.length === 0 ? <p className="text-sm text-slate-500">No incidents yet. Start by reporting an issue.</p> : null}
            {filteredIncidents.map((row) => (
              <article key={row.id} className="rounded-xl border border-emerald-100 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{String(row.locationType || "CLASSROOM").replaceAll("_", " ")} - {row.issueType}</p>
                  <StatusBadge status={row.status} label={String(row.status || "").toUpperCase() === "RESOLVED" ? "FINISHED" : undefined} />
                </div>
                <p className="mt-1 text-xs text-slate-500">Priority: {row.priority} | {row.floor || "Location not specified"} - {String(row.locationType || "CLASSROOM").replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm text-slate-600">{row.description}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
