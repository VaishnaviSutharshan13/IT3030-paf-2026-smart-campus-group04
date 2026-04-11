import React, { useEffect, useMemo, useState } from "react";
import { assignTechnician, listIncidents, updateIncidentPriority, updateIncidentStatus } from "../../incidents/services/incidentApi";
import { getUsers } from "../services/adminApi";
import StatusBadge from "../../../components/dashboard/StatusBadge";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const priorityClass = {
  HIGH: "bg-rose-100 text-rose-700 border-rose-200",
  MEDIUM: "bg-orange-100 text-orange-700 border-orange-200",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function PriorityBadge({ priority }) {
  const normalized = String(priority || "LOW").toUpperCase();
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass[normalized] || priorityClass.LOW}`}>{normalized}</span>;
}

function normalizeStatus(value) {
  const status = String(value || "").toUpperCase();
  if (status === "OPEN" || status === "ASSIGNED") return "PENDING";
  if (status === "IN PROGRESS") return "IN_PROGRESS";
  if (status === "CLOSED") return "RESOLVED";
  if (status === "COMPLETED") return "RESOLVED";
  return status || "PENDING";
}

function buildTransitionSteps(current, target) {
  if (current === target) return [];
  const steps = {
    PENDING: {
      IN_PROGRESS: ["IN_PROGRESS"],
      RESOLVED: ["IN_PROGRESS", "RESOLVED"],
    },
    ASSIGNED: {
      IN_PROGRESS: ["IN_PROGRESS"],
      RESOLVED: ["IN_PROGRESS", "RESOLVED"],
    },
    IN_PROGRESS: {
      RESOLVED: ["RESOLVED"],
    },
    RESOLVED: {},
  };

  return steps[current]?.[target] || null;
}

export default function AdminIncidentsPage() {
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", locationType: "" });
  const [searchText, setSearchText] = useState("");
  const [assignmentById, setAssignmentById] = useState({});
  const [priorityById, setPriorityById] = useState({});
  const [statusById, setStatusById] = useState({});
  const [actionLoadingById, setActionLoadingById] = useState({});

  const visibleIncidents = useMemo(() => {
    const query = String(searchText || "").trim().toLowerCase();
    if (!query) return incidents;
    return (incidents || []).filter((incident) => {
      const searchable = [
        incident?.issueType,
        incident?.description,
        incident?.locationType,
        incident?.floor,
        incident?.reportedByName,
        incident?.assignedToName,
        incident?.priority,
        incident?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [incidents, searchText]);

  const summary = useMemo(() => {
    const rows = incidents || [];
    return {
      total: rows.length,
      pending: rows.filter((item) => normalizeStatus(item?.status) === "PENDING").length,
      inProgress: rows.filter((item) => normalizeStatus(item?.status) === "IN_PROGRESS").length,
      resolved: rows.filter((item) => normalizeStatus(item?.status) === "RESOLVED").length,
    };
  }, [incidents]);

  async function loadData(activeFilters = filters) {
    setLoading(true);
    try {
      const [incidentRows, userRows] = await Promise.all([
        listIncidents(activeFilters),
        getUsers(),
      ]);
      setIncidents(Array.isArray(incidentRows) ? incidentRows : []);
      const techUsers = (Array.isArray(userRows) ? userRows : []).filter((user) => String(user.role || "").toLowerCase() === "technician");
      setTechnicians(techUsers);
    } catch (error) {
      toast.error(error.message || "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onApplyFilters() {
    await loadData(filters);
  }

  async function onResetFilters() {
    const reset = { status: "", priority: "", locationType: "" };
    setFilters(reset);
    setSearchText("");
    await loadData(reset);
  }

  async function onAssign(incidentId) {
    const technicianUserId = Number(assignmentById[incidentId]);
    if (!technicianUserId) {
      toast.error("Please select a technician.");
      return;
    }

    const incident = (incidents || []).find((item) => item.id === incidentId);
    const currentStatus = normalizeStatus(incident?.status);
    if (currentStatus === "RESOLVED") {
      toast.error("Resolved incidents cannot be reassigned.");
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
    try {
      const nextPriority = priorityById[incidentId];
      await assignTechnician({
        incidentId,
        technicianUserId,
        priority: nextPriority || undefined,
      });
      toast.success("Technician assigned successfully.");
      await loadData(filters);
    } catch (error) {
      toast.error(error.message || "Failed to assign technician.");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function onPriorityChange(incidentId) {
    const priority = priorityById[incidentId];
    if (!priority) {
      toast.error("Please select a priority.");
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
    try {
      await updateIncidentPriority(incidentId, priority);
      toast.success("Priority updated.");
      await loadData(filters);
    } catch (error) {
      toast.error(error.message || "Failed to update priority.");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function onStatusChange(incidentId) {
    const status = statusById[incidentId];
    if (!status) {
      toast.error("Please select a status.");
      return;
    }

    const incident = (incidents || []).find((item) => item.id === incidentId);
    const current = normalizeStatus(incident?.status);
    const target = normalizeStatus(status);
    const steps = buildTransitionSteps(current, target);
    if (steps === null) {
      toast.error(`Invalid status transition: ${current} -> ${target}`);
      return;
    }
    if (steps.length === 0) {
      toast.info("Incident is already in selected status.");
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
    try {
      for (const step of steps) {
        await updateIncidentStatus(incidentId, { status: step });
      }
      toast.success("Incident status updated.");
      await loadData(filters);
    } catch (error) {
      toast.error(error.message || "Failed to update incident status.");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function onResolveIncident(incidentId) {
    setActionLoadingById((prev) => ({ ...prev, [incidentId]: true }));
    try {
      const incident = (incidents || []).find((item) => item.id === incidentId);
      const current = normalizeStatus(incident?.status);
      const steps = buildTransitionSteps(current, "RESOLVED");
      if (steps === null) {
        throw new Error(`Invalid status transition: ${current} -> RESOLVED`);
      }
      for (const step of steps) {
        await updateIncidentStatus(incidentId, { status: step, notes: "Resolved by admin" });
      }
      toast.success("Incident marked as resolved.");
      await loadData(filters);
    } catch (error) {
      toast.error(error.message || "Failed to resolve incident.");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  return (
    <section className="space-y-5">
      <article className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Incidents</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor and assign maintenance incidents across campus rooms.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-800">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase text-amber-700">Pending</p>
            <p className="text-xl font-semibold text-amber-800">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs uppercase text-sky-700">In Progress</p>
            <p className="text-xl font-semibold text-sky-800">{summary.inProgress}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs uppercase text-emerald-700">Resolved</p>
            <p className="text-xl font-semibold text-emerald-800">{summary.resolved}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            className="input-field md:col-span-2"
            placeholder="Search by issue, location, reporter, technician"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select className="input-field" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
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
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={onApplyFilters}>Apply</button>
            <button type="button" className="btn-secondary" onClick={onResetFilters}>Reset</button>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">Showing {visibleIncidents.length} incidents</p>
      </article>

      <article className="panel p-5">
        {loading ? <p className="text-sm text-slate-500">Loading incidents...</p> : null}
        {!loading && visibleIncidents.length === 0 ? <p className="text-sm text-slate-500">No incidents found.</p> : null}

        <div className="space-y-3">
          {visibleIncidents.map((incident) => (
            <article key={incident.id} className="rounded-xl border border-emerald-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{String(incident?.locationType || "Unknown").replaceAll("_", " ")} - {incident?.issueType || "Unknown"}</h3>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={incident.priority} />
                  <StatusBadge status={incident.status} />
                </div>
              </div>

              <p className="mt-1 text-xs text-slate-500">Reported by {incident?.reportedByName || "Unknown"} on floor {incident?.floor || "N/A"}</p>
              <p className="mt-2 text-sm text-slate-700">{incident?.description || "No description provided."}</p>
              <p className="mt-2 text-xs text-slate-500">Assigned: {incident?.assignedToName || "Unassigned"}</p>

              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                <div className="rounded-lg border border-emerald-100 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Assign Technician</p>
                  <div className="mt-2 flex gap-2">
                    <select
                      className="input-field"
                      value={assignmentById[incident.id] || ""}
                      disabled={Boolean(actionLoadingById[incident.id]) || normalizeStatus(incident?.status) === "RESOLVED"}
                      onChange={(e) => setAssignmentById((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                    >
                      <option value="">Select Technician</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={Boolean(actionLoadingById[incident.id]) || normalizeStatus(incident?.status) === "RESOLVED"}
                      onClick={() => onAssign(incident.id)}
                    >
                      Assign
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Priority</p>
                  <div className="mt-2 flex gap-2">
                    <select
                      className="input-field"
                      value={priorityById[incident.id] || incident.priority}
                      disabled={Boolean(actionLoadingById[incident.id])}
                      onChange={(e) => setPriorityById((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    <button type="button" className="btn-secondary" disabled={Boolean(actionLoadingById[incident.id])} onClick={() => onPriorityChange(incident.id)}>
                      {actionLoadingById[incident.id] ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                  <div className="mt-2 flex gap-2">
                    <select
                      className="input-field"
                      value={statusById[incident.id] || incident.status}
                      disabled={Boolean(actionLoadingById[incident.id])}
                      onChange={(e) => setStatusById((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                    <button type="button" className="btn-secondary" disabled={Boolean(actionLoadingById[incident.id])} onClick={() => onStatusChange(incident.id)}>
                      Apply
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={Boolean(actionLoadingById[incident.id]) || normalizeStatus(incident?.status) === "RESOLVED"}
                      onClick={() => onResolveIncident(incident.id)}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
