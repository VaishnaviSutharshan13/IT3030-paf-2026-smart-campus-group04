import React, { useEffect, useMemo, useState } from "react";
import { assignIncident, listIncidents, updateIncidentPriority } from "../../incidents/services/incidentApi";
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

export default function AdminIncidentsPage() {
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", locationType: "" });
  const [assignmentById, setAssignmentById] = useState({});
  const [priorityById, setPriorityById] = useState({});

  const filteredCount = useMemo(() => incidents.length, [incidents]);

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

  async function onAssign(incidentId) {
    const technicianUserId = Number(assignmentById[incidentId]);
    if (!technicianUserId) {
      toast.error("Please select a technician.");
      return;
    }

    try {
      const nextPriority = priorityById[incidentId];
      await assignIncident(incidentId, {
        technicianUserId,
        priority: nextPriority || undefined,
      });
      toast.success("Technician assigned successfully.");
      await loadData(filters);
    } catch (error) {
      toast.error(error.message || "Failed to assign technician.");
    }
  }

  async function onPriorityChange(incidentId) {
    const priority = priorityById[incidentId];
    if (!priority) {
      toast.error("Please select a priority.");
      return;
    }

    try {
      await updateIncidentPriority(incidentId, priority);
      toast.success("Priority updated.");
      await loadData(filters);
    } catch (error) {
      toast.error(error.message || "Failed to update priority.");
    }
  }

  return (
    <section className="space-y-5">
      <article className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Incidents</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor and assign maintenance incidents across campus rooms.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
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
          <button type="button" className="btn-primary" onClick={onApplyFilters}>Apply Filters</button>
        </div>

        <p className="mt-3 text-xs text-slate-500">Showing {filteredCount} incidents</p>
      </article>

      <article className="panel p-5">
        {loading ? <p className="text-sm text-slate-500">Loading incidents...</p> : null}
        {!loading && incidents.length === 0 ? <p className="text-sm text-slate-500">No incidents found.</p> : null}

        <div className="space-y-3">
          {incidents.map((incident) => (
            <article key={incident.id} className="rounded-xl border border-emerald-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{incident.locationType.replaceAll("_", " ")} - {incident.issueType}</h3>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={incident.priority} />
                  <StatusBadge status={incident.status} />
                </div>
              </div>

              <p className="mt-1 text-xs text-slate-500">Reported by {incident.reportedByName} on floor {incident.floor}</p>
              <p className="mt-2 text-sm text-slate-700">{incident.description}</p>
              <p className="mt-2 text-xs text-slate-500">Assigned: {incident.assignedToName || "Unassigned"}</p>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <select
                  className="input-field"
                  value={assignmentById[incident.id] || ""}
                  onChange={(e) => setAssignmentById((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                >
                  <option value="">Select Technician</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>

                <select
                  className="input-field"
                  value={priorityById[incident.id] || incident.priority}
                  onChange={(e) => setPriorityById((prev) => ({ ...prev, [incident.id]: e.target.value }))}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={() => onPriorityChange(incident.id)}>Update Priority</button>
                  <button type="button" className="btn-primary" onClick={() => onAssign(incident.id)}>Assign</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
