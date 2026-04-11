import React, { useEffect, useMemo, useState } from "react";
import { fetchResources } from "../../resources/services/resourceService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function isResourceAvailable(resource) {
  const status = String(resource?.availabilityStatus || "").trim().toLowerCase();
  if (status) {
    return status === "available";
  }
  return Boolean(resource?.active);
}

function getResourceStatusLabel(resource) {
  return isResourceAvailable(resource) ? "Available" : "Unavailable";
}

export default function LecturerResourcesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadResources() {
    setLoading(true);
    try {
      const rows = await fetchResources();
      setResources(Array.isArray(rows) ? rows : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load resources.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  const visibleResources = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    return (resources || []).filter((resource) => {
      const typeCode = String(resource?.typeCode || resource?.type || "").toUpperCase();
      if (typeFilter !== "ALL" && typeCode !== typeFilter) return false;
      const statusLabel = getResourceStatusLabel(resource).toUpperCase();
      if (statusFilter !== "ALL" && statusLabel !== statusFilter) return false;

      if (!query) return true;
      const text = [resource?.name, resource?.code, resource?.location, typeCode, statusLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [resources, search, typeFilter, statusFilter]);

  const availableCount = useMemo(
    () => (resources || []).filter((resource) => isResourceAvailable(resource)).length,
    [resources]
  );
  const unavailableCount = useMemo(
    () => (resources || []).filter((resource) => !isResourceAvailable(resource)).length,
    [resources]
  );

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Resources</h2>
        <p className="mt-1 text-sm text-slate-500">Browse available and unavailable rooms, labs, and equipment.</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Available: {availableCount}
          </span>
          <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
            Unavailable: {unavailableCount}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            className="input-field md:col-span-2"
            placeholder="Search by name, code, location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="ROOM">Room</option>
            <option value="LAB">Lab</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
          <div className="flex items-center text-sm text-slate-500">{visibleResources.length} results</div>
        </div>
      </div>

      <div className="panel p-5">
        {loading ? <p className="text-sm text-slate-500">Loading resources...</p> : null}
        {!loading && visibleResources.length === 0 ? <p className="text-sm text-slate-500">No resources found for the selected filters.</p> : null}

        {visibleResources.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-emerald-100">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Capacity</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleResources.map((resource) => {
                  const available = isResourceAvailable(resource);
                  return (
                    <tr key={resource.id || resource.code} className="border-t border-emerald-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{resource.code || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{resource.name || "-"}</td>
                      <td className="px-3 py-2 text-slate-600">{String(resource.typeCode || resource.type || "-")}</td>
                      <td className="px-3 py-2 text-slate-600">{resource.location || "-"}</td>
                      <td className="px-3 py-2 text-slate-600">{resource.capacity ?? "-"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
