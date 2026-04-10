import React, { useEffect, useMemo, useState } from "react";
import {
  listIncidents,
  updateIncidentStatus,
} from "../../incidents/services/incidentApi";
import {
  getTickets,
  startTicketProgress,
  resolveTicket,
} from "../../tickets/services/ticketApi";
import { fetchResources } from "../../resources/services/resourceService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const priorityBadgeClass = {
  HIGH: "border-rose-200 bg-rose-100 text-rose-700",
  MEDIUM: "border-orange-200 bg-orange-100 text-orange-700",
  LOW: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

const statusBadgeClass = {
  OPEN: "border-amber-200 bg-amber-100 text-amber-800",
  PENDING: "border-amber-200 bg-amber-100 text-amber-800",
  ASSIGNED: "border-amber-200 bg-amber-100 text-amber-800",
  IN_PROGRESS: "border-sky-200 bg-sky-100 text-sky-800",
  RESOLVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
};

function normalizeStatus(rawStatus) {
  const value = String(rawStatus || "").toUpperCase();
  if (!value) return "OPEN";
  if (value === "ASSIGNED") return "OPEN";
  return value;
}

function normalizePriority(rawPriority) {
  const value = String(rawPriority || "").toUpperCase();
  if (value === "CRITICAL") return "HIGH";
  if (!value) return "LOW";
  return value;
}

function mapIssueIcon(type) {
  const issue = String(type || "").toUpperCase();
  if (issue.includes("LIGHT")) return "💡";
  if (issue.includes("AC")) return "❄️";
  if (issue.includes("NETWORK")) return "🌐";
  if (issue.includes("COMPUTER") || issue.includes("EQUIPMENT") || issue.includes("PROJECTOR")) return "🖥️";
  return "🔧";
}

function toDateTimeLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
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

function normalizeTicketRow(row, source, resourcesById = new Map()) {
  const resource = resourcesById.get(Number(row.resourceId)) || null;
  const parsed = parseLocationFromDescription(row.description);

  const floor = row.floor || row.floor_name || row.floorNumber || row.level || parsed.floor || resource?.location || "";
  const roomType = row.room_type || row.roomType || row.locationType || parsed.roomType || resource?.name || "";
  const roomNumber = row.room_number || row.roomNumber || resource?.code || "";
  const locationRaw = row.location || "";

  return {
    source,
    id: row.id ?? row._id,
    type: row.issueType || row.type || row.title || "Technical Issue",
    floor: String(floor || "").trim(),
    roomType: String(roomType || "").replaceAll("_", " ").trim(),
    roomNumber: String(roomNumber || "").trim(),
    locationRaw: String(locationRaw || "").trim(),
    description: row.description || row.notes || "No description provided",
    priority: normalizePriority(row.priority),
    rawStatus: String(row.status || "").toUpperCase(),
    status: normalizeStatus(row.status),
    createdAt: row.createdAt || row.created_at || row.incidentAt || row.created_at,
    assignedTo: row.assignedTo ?? row.assignedTechnicianUserId ?? null,
    role: String(row.role || "").toLowerCase(),
    notes: row.technicianNotes || row.notes || "",
  };
}

function PriorityBadge({ priority }) {
  const value = normalizePriority(priority);
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass[value] || priorityBadgeClass.LOW}`}>
      Priority: {value}
    </span>
  );
}

function StatusChip({ status }) {
  const value = normalizeStatus(status);
  const statusIcon = {
    OPEN: "🟡",
    IN_PROGRESS: "🔵",
    RESOLVED: "🟢",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-[18px] font-bold uppercase tracking-wide ${statusBadgeClass[value] || statusBadgeClass.OPEN}`}>
      STATUS: {value.replaceAll("_", " ")} {statusIcon[value] || "🟡"}
    </span>
  );
}

function formatLocation(ticket) {
  const parts = [ticket.floor, ticket.roomType || ticket.roomNumber].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" • ");
  }
  if (ticket.locationRaw) {
    return ticket.locationRaw;
  }
  return "Location not specified";
}

export default function TechnicianTicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [filters, setFilters] = useState({ status: "", priority: "", locationType: "" });
  const [loading, setLoading] = useState(true);
  const [currentSource, setCurrentSource] = useState("incidents");

  async function loadTickets(activeFilters = filters) {
    setLoading(true);
    try {
      const response = await listIncidents(activeFilters);
      console.log("Tickets:", response?.data || response);

      const incidentRows = Array.isArray(response) ? response.map((row) => normalizeTicketRow(row, "incidents")) : [];
      setTickets(incidentRows);
      setCurrentSource("incidents");
    } catch (error) {
      try {
        const fallbackResponse = await getTickets();
        console.log("Tickets:", fallbackResponse?.data || fallbackResponse);

        const resourcesResponse = await fetchResources().catch(() => []);
        const resources = Array.isArray(resourcesResponse)
          ? resourcesResponse
          : Array.isArray(resourcesResponse?.items)
            ? resourcesResponse.items
            : [];
        const resourcesById = new Map(resources.map((item) => [Number(item.id), item]));

        const fallbackRows = (Array.isArray(fallbackResponse) ? fallbackResponse : [])
          .map((row) => normalizeTicketRow(row, "tickets", resourcesById))
          .filter((row) => row.role === "technician" || row.status !== "RESOLVED");

        setTickets(fallbackRows);
        setCurrentSource("tickets");
      } catch (fallbackError) {
        toast.error(fallbackError.message || error.message || "Failed to load tickets");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.locationType) {
        const locationSearch = [ticket.roomType, ticket.locationRaw].join(" ").toUpperCase();
        if (!locationSearch.includes(filters.locationType)) return false;
      }
      return true;
    });
  }, [tickets, filters]);

  async function onApplyFilters() {
    await loadTickets(filters);
  }

  async function onStatusChange(ticketId, status, ticketSource) {
    try {
      if (ticketSource === "incidents") {
        await updateIncidentStatus(ticketId, {
          status,
          notes: notesById[ticketId] || "",
        });
      } else if (status === "IN_PROGRESS") {
        await startTicketProgress(ticketId);
      } else if (status === "RESOLVED") {
        await resolveTicket(ticketId);
      }

      toast.success("Ticket status updated.");
      await loadTickets(filters);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="space-y-5">
      <article className="panel p-5">
        <h2 className="text-[20px] font-semibold text-slate-800">Assigned Tickets</h2>
        <p className="mt-1 text-[16px] text-slate-500">Review issue details and update status safely using existing APIs.</p>
        <p className="mt-1 text-xs text-slate-500">Data source: {currentSource}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="input-field" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
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
          <button type="button" className="btn-primary" onClick={onApplyFilters}>Apply Filters</button>
        </div>
      </article>

      <article className="panel p-5">
        {loading ? <p className="text-[16px] text-slate-500">Loading tickets...</p> : null}
        {!loading && filteredTickets.length === 0 ? <p className="text-[16px] text-slate-500">No tickets assigned yet</p> : null}

        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            console.log("Ticket Data:", ticket);
            return (
            <article key={ticket.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[18px] font-bold text-slate-800">
                  {mapIssueIcon(ticket.type)} {ticket.type}
                </p>
                <StatusChip status={ticket.status} />
              </div>
              <p className="mt-2 text-[16px] font-semibold text-slate-700">📍 {formatLocation(ticket)}</p>
              <p className="mt-2 text-[16px] text-slate-600">📝 "{ticket.description}"</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  Created: {toDateTimeLabel(ticket.createdAt)}
                </span>
              </div>

              <textarea
                className="input-field mt-3 h-28 text-[16px] focus:border-campus-500"
                placeholder="Add update for this issue..."
                value={notesById[ticket.id] || ticket.notes || ""}
                onChange={(e) => setNotesById((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.status === "OPEN" ? (
                  <>
                    <button
                      type="button"
                      className="rounded-lg border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                      onClick={() => onStatusChange(ticket.id, "IN_PROGRESS", ticket.source)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800"
                      onClick={() => onStatusChange(ticket.id, "IN_PROGRESS", ticket.source)}
                    >
                      Start Work
                    </button>
                  </>
                ) : null}

                {ticket.status === "IN_PROGRESS" ? (
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                    onClick={() => onStatusChange(ticket.id, "RESOLVED", ticket.source)}
                  >
                    Mark Resolved
                  </button>
                ) : null}

                {ticket.status === "RESOLVED" ? (
                  <>
                    <button type="button" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500" disabled>
                      Approve
                    </button>
                    <button type="button" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500" disabled>
                      Start Work
                    </button>
                    <button type="button" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500" disabled>
                      Mark Resolved
                    </button>
                  </>
                ) : null}
              </div>
            </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
