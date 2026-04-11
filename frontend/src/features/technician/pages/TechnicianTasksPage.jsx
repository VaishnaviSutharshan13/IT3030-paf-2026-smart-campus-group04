import React from "react";
import { useEffect, useMemo, useState } from "react";
import { fetchAssignedIncidents, patchIncidentStatus } from "../services/technicianIncidentApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const statusClass = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  IN_PROGRESS: "bg-sky-100 text-sky-800 border-sky-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function normalizeStatus(value) {
  const raw = String(value || "").toUpperCase();
  if (!raw || raw === "OPEN" || raw === "ASSIGNED") return "PENDING";
  if (raw === "IN PROGRESS") return "IN_PROGRESS";
  if (raw === "IN_PROGRESS") return "IN_PROGRESS";
  if (raw === "RESOLVED" || raw === "CLOSED") return "RESOLVED";
  return "PENDING";
}

export default function TechnicianTasksPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [actionLoadingById, setActionLoadingById] = useState({});

  async function loadTasks() {
    setLoading(true);
    try {
      setError(null);
      const rows = await fetchAssignedIncidents();
      const normalized = (rows || []).map((row) => ({
        ...row,
        uiStatus: normalizeStatus(row?.status),
      }));
      setTasks(normalized);
    } catch (error) {
      const message = error?.message || "Failed to load technician tasks";
      setError(message);
      toast.error(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function onTaskStatusChange(taskId, status) {
    if (status === "PENDING") {
      return;
    }
    setActionLoadingById((prev) => ({ ...prev, [taskId]: true }));
    try {
      await patchIncidentStatus(taskId, status === "COMPLETED" ? "Resolved" : "In Progress");
      toast.success("Task status updated.");
      await loadTasks();
    } catch (error) {
      toast.error(error.message || "Failed to update task status");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [taskId]: false }));
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const groupedTasks = useMemo(() => {
    const safeRows = Array.isArray(tasks) ? tasks : [];
    return {
      PENDING: safeRows.filter((row) => row?.uiStatus === "PENDING"),
      IN_PROGRESS: safeRows.filter((row) => row?.uiStatus === "IN_PROGRESS"),
      RESOLVED: safeRows.filter((row) => row?.uiStatus === "RESOLVED"),
    };
  }, [tasks]);

  const columns = [
    { key: "PENDING", label: "Pending", tone: "border-amber-200 bg-amber-50/70" },
    { key: "IN_PROGRESS", label: "In Progress", tone: "border-sky-200 bg-sky-50/70" },
    { key: "RESOLVED", label: "Completed", tone: "border-emerald-200 bg-emerald-50/70" },
  ];

  return (
    <section className="space-y-5">
      <article className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Task Board</h2>
          <button type="button" className="btn-secondary" disabled={loading} onClick={loadTasks}>
            {loading ? "Refreshing..." : "Refresh Board"}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Move incidents through your workflow without leaving the board.</p>
      </article>

      {loading ? <div className="panel p-5 text-sm text-slate-500">Loading tasks...</div> : null}
      {!loading && error ? <div className="panel p-5 text-sm text-rose-600">{error}</div> : null}
      {!loading && !error && tasks.length === 0 ? <div className="panel p-5 text-sm text-slate-500">No Data Available</div> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <article key={column.key} className={`panel p-4 ${column.tone}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{column.label}</h3>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {(groupedTasks?.[column.key] || []).length}
              </span>
            </div>

            <div className="space-y-3">
              {(groupedTasks?.[column.key] || []).map((task) => (
                <article key={task?.id} className="rounded-xl border border-white/80 bg-white/85 p-3">
                  <p className="text-sm font-semibold text-slate-800">{task?.title || "No Title"}</p>
                  <p className="mt-1 text-xs text-slate-500">{task?.locationType?.replaceAll("_", " ") || "N/A"} • Floor {task?.floor || "N/A"}</p>
                  <p className="mt-2 text-xs text-slate-600">{task?.description || "No description"}</p>
                  <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass?.[task?.uiStatus] || statusClass.PENDING}`}>
                    {task?.uiStatus?.replaceAll("_", " ") || "PENDING"}
                  </span>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-sky-200 bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800"
                      disabled={Boolean(actionLoadingById?.[task?.id]) || task?.uiStatus !== "PENDING"}
                      onClick={() => onTaskStatusChange(task?.id, "IN_PROGRESS")}
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                      disabled={Boolean(actionLoadingById?.[task?.id]) || task?.uiStatus === "RESOLVED"}
                      onClick={() => onTaskStatusChange(task?.id, "COMPLETED")}
                    >
                      Complete
                    </button>
                  </div>
                </article>
              ))}
              {(groupedTasks?.[column.key] || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300/80 bg-white/60 px-3 py-2 text-xs text-slate-500">
                  No {column.label.toLowerCase()} tasks.
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
