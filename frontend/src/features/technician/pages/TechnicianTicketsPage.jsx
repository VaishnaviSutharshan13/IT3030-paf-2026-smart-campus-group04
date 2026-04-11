import React, { useEffect, useMemo, useState } from "react";
import { Clock3, Edit3, MapPin, MessageSquare, Play, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";
import {
  deleteIncidentTicket,
  fetchAssignedIncidents,
  patchIncidentNote,
  patchIncidentStatus,
  updateIncidentTicket,
} from "../services/technicianIncidentApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";
import { useAuth } from "../../auth/context/AuthContext";

const statusBadgeClass = {
  PENDING: "border-amber-300 bg-amber-100 text-amber-800",
  ASSIGNED: "border-indigo-300 bg-indigo-100 text-indigo-800",
  REJECTED: "border-rose-300 bg-rose-100 text-rose-800",
  IN_PROGRESS: "border-sky-300 bg-sky-100 text-sky-800",
  RESOLVED: "border-emerald-300 bg-emerald-100 text-emerald-800",
};

const priorityClass = {
  HIGH: "border-rose-300 bg-rose-100 text-rose-700",
  MEDIUM: "border-orange-300 bg-orange-100 text-orange-700",
  LOW: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

const statusOptions = ["ALL", "PENDING", "ASSIGNED", "REJECTED", "IN_PROGRESS", "RESOLVED"];
const priorityFilterOptions = ["ALL", "HIGH", "MEDIUM", "LOW"];
const locationFilterOptions = ["ALL", "LAB", "CLASSROOM", "SMART_CLASSROOM", "LECTURE_HALL"];
const locationOptions = ["LAB", "CLASSROOM", "SMART_CLASSROOM", "LECTURE_HALL"];
const issueOptions = ["COMPUTER", "AC", "LIGHTS", "PROJECTOR", "NETWORK", "OTHER"];

function normalizeStatus(value) {
  const status = String(value || "").toUpperCase();
  if (status === "IN PROGRESS") return "IN_PROGRESS";
  if (status === "APPROVED") return "ASSIGNED";
  if (status === "FINISHED" || status === "CLOSED" || status === "COMPLETED") return "RESOLVED";
  if (status === "COMPLETED") return "RESOLVED";
  if (status === "") return "PENDING";
  if (status === "OPEN") return "PENDING";
  return status;
}

function canMoveTo(current, target) {
  if (current === target) return true;
  if (current === "PENDING") return target === "ASSIGNED" || target === "REJECTED";
  if (current === "ASSIGNED") return target === "IN_PROGRESS" || target === "REJECTED";
  if (current === "IN_PROGRESS") return target === "RESOLVED";
  return false;
}

function buildActivityLog(ticket) {
  const items = [];
  items.push(`Created on ${toDateLabel(ticket?.createdAt)}`);
  if (ticket?.status === "IN_PROGRESS") {
    items.push("Technician started work");
  }
  if (ticket?.status === "ASSIGNED") {
    items.push("Technician approved incident");
  }
  if (ticket?.status === "REJECTED") {
    items.push("Technician rejected incident");
  }
  if (ticket?.status === "RESOLVED") {
    items.push("Technician marked as finished");
  }
  if (ticket?.note) {
    items.push("Technician added note");
  }
  return items;
}

function toDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-campus-600" />
      <span>{label}</span>
    </div>
  );
}

function extractErrorMessage(err, fallback) {
  const raw = String(err?.message || "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return raw;
}

export default function TechnicianTicketsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "ALL", priority: "ALL", location: "ALL" });
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [noteById, setNoteById] = useState({});
  const [editingById, setEditingById] = useState({});

  async function loadIncidents(activeFilters = filters) {
    try {
      setLoading(true);
      setError(null);
      const rows = await fetchAssignedIncidents(activeFilters);
      const safeRows = Array.isArray(rows) ? rows : [];
      setTickets(safeRows);
      setNoteById(Object.fromEntries(safeRows.map((row) => [row?.id, row?.note || ""])));
      setEditingById((prev) => {
        const next = { ...prev };
        safeRows.forEach((row) => {
          if (!next[row.id]) {
            next[row.id] = {
              issueType: row.issueType,
              locationType: row.locationType,
              floor: row.floor,
              description: row.description,
            };
          }
        });
        return next;
      });
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to fetch incidents"));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents(filters);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadIncidents(filters);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [filters]);

  const filteredTickets = useMemo(() => {
    const safeRows = Array.isArray(tickets) ? tickets : [];
    return safeRows.filter((incident) => {
      const status = normalizeStatus(incident?.status);
      const priority = String(incident?.priority || "").toUpperCase();
      const location = String(incident?.locationType || "").toUpperCase();
      const fullText = [
        incident?.title,
        incident?.issueType,
        incident?.description,
        incident?.locationType,
        incident?.floor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchOk = !search || fullText.includes(search.toLowerCase());
      const statusOk = filters.status === "ALL" || status === filters.status;
      const priorityOk = filters.priority === "ALL" || priority === filters.priority;
      const locationOk = filters.location === "ALL" || location === filters.location;
      return searchOk && statusOk && priorityOk && locationOk;
    });
  }, [tickets, search, filters]);

  const metrics = useMemo(() => {
    const safeRows = Array.isArray(tickets) ? tickets : [];
    const all = safeRows.length;
    const pending = safeRows.filter((row) => normalizeStatus(row?.status) === "PENDING").length;
    const approved = safeRows.filter((row) => normalizeStatus(row?.status) === "ASSIGNED").length;
    const rejected = safeRows.filter((row) => normalizeStatus(row?.status) === "REJECTED").length;
    const inProgress = safeRows.filter((row) => normalizeStatus(row?.status) === "IN_PROGRESS").length;
    const finished = safeRows.filter((row) => normalizeStatus(row?.status) === "RESOLVED").length;
    return { all, pending, approved, rejected, inProgress, finished };
  }, [tickets]);

  const hasRows = useMemo(() => filteredTickets.length > 0, [filteredTickets]);

  async function onStatusUpdate(incidentId, status) {
    if (!incidentId) {
      toast.error("Invalid incident id");
      return;
    }
    try {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
      const updated = await patchIncidentStatus(incidentId, status);
      setTickets((prev) => prev.map((row) => (row?.id === incidentId ? { ...row, ...updated } : row)));
      if (status === "ASSIGNED") {
        toast.success("Incident Approved");
      } else if (status === "REJECTED") {
        toast.success("Incident Rejected");
      } else
      if (status === "IN_PROGRESS") {
        toast.success("Work Started");
      } else if (status === "RESOLVED") {
        toast.success("Marked as Finished");
      } else {
        toast.success("Status updated");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Status update failed"));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function onSaveNote(incidentId) {
    if (!incidentId) {
      toast.error("Invalid incident id");
      return;
    }
    try {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
      const current = (tickets || []).find((row) => row?.id === incidentId);
      const updated = await patchIncidentNote(
        incidentId,
        noteById?.[incidentId] || "",
        current?.status || "PENDING"
      );
      setTickets((prev) => prev.map((row) => (row?.id === incidentId ? { ...row, ...updated } : row)));
      toast.success("Note Saved");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to save note"));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function onDeleteIncident(incidentId) {
    if (!incidentId) {
      toast.error("Invalid incident id");
      return;
    }
    try {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
      await deleteIncidentTicket(incidentId);
      setTickets((prev) => prev.filter((row) => row?.id !== incidentId));
      toast.success("Ticket deleted");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete incident"));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function onSaveEdit(incidentId) {
    const edit = editingById?.[incidentId];
    if (!edit?.issueType || !edit?.locationType || !edit?.floor || !edit?.description) {
      toast.error("All edit fields are required");
      return;
    }

    try {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
      const updated = await updateIncidentTicket(incidentId, {
        issueType: edit.issueType,
        locationType: edit.locationType,
        floor: edit.floor,
        description: edit.description,
      });
      setTickets((prev) => prev.map((row) => (row?.id === incidentId ? { ...row, ...updated } : row)));
      toast.success("Ticket updated");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update ticket"));
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  function onApplyFilters() {
    loadIncidents(filters);
  }

  return (
    <section className="space-y-5">
      <article className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold text-slate-800">Technician Incident Management</h2>
            <p className="mt-1 text-sm text-slate-500">Professional ticket board with status flow, note persistence, and live refresh.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={loadIncidents} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{metrics.pending}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
            <p className="text-xs uppercase tracking-wide text-indigo-700">Approved</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-800">{metrics.approved}</p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-3">
            <p className="text-xs uppercase tracking-wide text-sky-700">In Progress</p>
            <p className="mt-1 text-2xl font-semibold text-sky-800">{metrics.inProgress}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-3">
            <p className="text-xs uppercase tracking-wide text-rose-700">Rejected</p>
            <p className="mt-1 text-2xl font-semibold text-rose-800">{metrics.rejected}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Finished</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-800">{metrics.finished}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <label className="relative md:col-span-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by title, description, floor, location"
              value={search}
              onChange={(event) => setSearch(event?.target?.value || "")}
            />
          </label>

          <select className="input-field" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event?.target?.value || "ALL" }))}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option === "ALL" ? "All Status" : option.replaceAll("_", " ")}</option>
            ))}
          </select>

          <select className="input-field" value={filters.priority} onChange={(event) => setFilters((prev) => ({ ...prev, priority: event?.target?.value || "ALL" }))}>
            {priorityFilterOptions.map((option) => (
              <option key={option} value={option}>{option === "ALL" ? "All Priority" : option}</option>
            ))}
          </select>

          <select className="input-field" value={filters.location} onChange={(event) => setFilters((prev) => ({ ...prev, location: event?.target?.value || "ALL" }))}>
            {locationFilterOptions.map((option) => (
              <option key={option} value={option}>{option === "ALL" ? "All Locations" : option.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Showing {filteredTickets.length} incidents</p>
          <button type="button" className="btn-primary" onClick={onApplyFilters} disabled={loading}>Apply Filters</button>
        </div>
      </article>

      <article className="panel p-5 space-y-3">
        {loading ? <LoadingSpinner label="Fetching incidents..." /> : null}
        {!loading && error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!loading && !error && !hasRows ? <p className="text-sm text-slate-500">No Data Available</p> : null}

        {(filteredTickets || []).map((incident) => {
          const id = incident?.id;
          const status = normalizeStatus(incident?.status);
          const isBusy = Boolean(actionLoadingById?.[id]);
          const isFinal = status === "RESOLVED" || status === "REJECTED";

          return (
            <article key={id} className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[17px] font-semibold text-slate-800">{incident?.title || "No Title"}</h3>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass?.[status] || statusBadgeClass.PENDING}`}>
                  {status?.replaceAll("_", " ") || "PENDING"}
                </span>
              </div>

              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {incident?.locationLabel || "N/A"}</p>
              <p className="mt-2 text-sm text-slate-700">{incident?.description || "No description"}</p>
              <p className="mt-1 text-xs text-slate-500">Assigned Technician: {incident?.assignedToName || user?.name || "Current User"}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass?.[incident?.priority] || priorityClass.LOW}`}>
                  {incident?.priority || "LOW"}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <Clock3 size={12} className="mr-1" /> Created: {toDateLabel(incident?.createdAt)}
                </span>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Timeline</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5">Created</span>
                  <span>→</span>
                  <span className={`rounded-full border px-2 py-0.5 ${status === "PENDING" ? "border-amber-300 bg-amber-100" : "border-slate-300 bg-white"}`}>Pending</span>
                  <span>→</span>
                  <span className={`rounded-full border px-2 py-0.5 ${status === "ASSIGNED" ? "border-indigo-300 bg-indigo-100" : "border-slate-300 bg-white"}`}>Approved</span>
                  <span>→</span>
                  <span className={`rounded-full border px-2 py-0.5 ${status === "IN_PROGRESS" ? "border-sky-300 bg-sky-100" : "border-slate-300 bg-white"}`}>In Progress</span>
                  <span>→</span>
                  <span className={`rounded-full border px-2 py-0.5 ${status === "RESOLVED" ? "border-emerald-300 bg-emerald-100" : "border-slate-300 bg-white"}`}>Finished</span>
                  <span>•</span>
                  <span className={`rounded-full border px-2 py-0.5 ${status === "REJECTED" ? "border-rose-300 bg-rose-100" : "border-slate-300 bg-white"}`}>Rejected</span>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Edit Ticket</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <select
                    className="input-field"
                    value={editingById?.[id]?.issueType || incident?.issueType || "OTHER"}
                    disabled={isBusy || isFinal}
                    onChange={(event) => setEditingById((prev) => ({
                      ...prev,
                      [id]: { ...(prev?.[id] || {}), issueType: event?.target?.value || "OTHER" },
                    }))}
                  >
                    {issueOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <select
                    className="input-field"
                    value={editingById?.[id]?.locationType || incident?.locationType || "LAB"}
                    disabled={isBusy || isFinal}
                    onChange={(event) => setEditingById((prev) => ({
                      ...prev,
                      [id]: { ...(prev?.[id] || {}), locationType: event?.target?.value || "LAB" },
                    }))}
                  >
                    {locationOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
                  </select>
                  <input
                    className="input-field"
                    value={editingById?.[id]?.floor || incident?.floor || ""}
                    disabled={isBusy || isFinal}
                    onChange={(event) => setEditingById((prev) => ({
                      ...prev,
                      [id]: { ...(prev?.[id] || {}), floor: event?.target?.value || "" },
                    }))}
                    placeholder="Floor"
                  />
                  <textarea
                    className="input-field h-20 md:col-span-2"
                    value={editingById?.[id]?.description || incident?.description || ""}
                    disabled={isBusy || isFinal}
                    onChange={(event) => setEditingById((prev) => ({
                      ...prev,
                      [id]: { ...(prev?.[id] || {}), description: event?.target?.value || "" },
                    }))}
                    placeholder="Edit description"
                  />
                </div>
              </div>

              <textarea
                className="input-field mt-3 h-24"
                placeholder="Add comment / note"
                value={noteById?.[id] ?? incident?.note ?? ""}
                disabled={isBusy}
                onChange={(event) => setNoteById((prev) => ({ ...prev, [id]: event?.target?.value || "" }))}
              />

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Activity Log</p>
                <div className="mt-2 space-y-1">
                  {buildActivityLog(incident).map((activity) => (
                    <p key={`${id}-${activity}`} className="text-xs text-slate-600">• {activity}</p>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isBusy || !canMoveTo(status, "ASSIGNED")}
                  onClick={() => onStatusUpdate(id, "ASSIGNED")}
                >
                  <CheckCircle2 size={14} className="mr-1" /> Approve
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isBusy || !canMoveTo(status, "REJECTED")}
                  onClick={() => onStatusUpdate(id, "REJECTED")}
                >
                  <XCircle size={14} className="mr-1" /> Reject
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isBusy || !canMoveTo(status, "IN_PROGRESS")}
                  onClick={() => onStatusUpdate(id, "IN_PROGRESS")}
                >
                  <Play size={14} className="mr-1" /> Start Work
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isBusy || !canMoveTo(status, "RESOLVED")}
                  onClick={() => onStatusUpdate(id, "RESOLVED")}
                >
                  <CheckCircle2 size={14} className="mr-1" /> Mark Finished
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isBusy || isFinal}
                  onClick={() => onSaveEdit(id)}
                >
                  <Edit3 size={14} className="mr-1" /> Edit Ticket
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isBusy || isFinal}
                  onClick={() => onDeleteIncident(id)}
                >
                  <Trash2 size={14} className="mr-1" /> Delete Ticket
                </button>

                <button type="button" className="btn-primary" disabled={isBusy} onClick={() => onSaveNote(id)}>
                  <MessageSquare size={14} className="mr-1" /> {isBusy ? "Saving..." : "Save Note"}
                </button>
              </div>
            </article>
          );
        })}
      </article>
    </section>
  );
}
