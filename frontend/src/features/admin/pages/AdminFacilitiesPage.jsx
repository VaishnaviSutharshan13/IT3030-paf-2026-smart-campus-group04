import React, { useEffect, useMemo, useState } from "react";
import { createFacility, deleteFacility, getFacilities, updateFacility } from "../../facilities/services/facilityApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initial = { name: "", type: "Room", capacity: 1, availabilityStatus: "Available", location: "" };

const RESOURCE_NAME_OPTIONS = {
  ROOM: ["Lecture Hall", "Seminar Room", "Tutorial Room", "Smart Classroom", "Meeting Room"],
  LAB: ["Computer Lab", "Networking Lab", "Electronics Lab", "IoT Lab", "Research Lab"],
  EQUIPMENT: ["Projector Unit", "Smart Board", "PA System", "3D Printer", "Workstation Set"],
  AUDITORIUM: ["Main Auditorium", "Conference Hall", "Event Hall"],
};

const RESOURCE_TYPE_OPTIONS = ["Room", "Lab", "Equipment", "Auditorium", "Workshop", "Studio", "Library Space"];
const RESOURCE_CAPACITY_OPTIONS = [10, 20, 30, 40, 60, 80, 100, 150, 200];
const RESOURCE_STATUS_OPTIONS = ["Available", "Unavailable"];

function normalizeStatusInput(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "unavailable" || raw === "out of service") return "Unavailable";
  return "Available";
}

function buildFacilityPayload(form) {
  const capacity = Number(form?.capacity);
  return {
    name: String(form?.name || "").trim(),
    type: String(form?.type || "").trim(),
    capacity,
    availabilityStatus: normalizeStatusInput(form?.availabilityStatus),
    location: String(form?.location || "").trim(),
  };
}

function normalizeTypeKey(typeValue) {
  const raw = String(typeValue || "").trim().toUpperCase();
  if (!raw) return "ROOM";
  if (raw.includes("LAB")) return "LAB";
  if (raw.includes("EQUIP")) return "EQUIPMENT";
  if (raw.includes("AUDITOR")) return "AUDITORIUM";
  if (raw.includes("ROOM") || raw.includes("CLASS")) return "ROOM";
  return "ROOM";
}

function isAvailableStatus(value) {
  return String(value || "").trim().toLowerCase() === "available";
}

function displayAvailabilityStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "unavailable") return "Unavailable";
  if (normalized === "out of service") return "Unavailable";
  if (normalized === "available") return "Available";
  return String(value || "-");
}

export default function AdminFacilitiesPage() {
  const toast = useToast();
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const suggestedResourceNames = useMemo(() => {
    const key = normalizeTypeKey(form?.type);
    return RESOURCE_NAME_OPTIONS[key] || RESOURCE_NAME_OPTIONS.ROOM;
  }, [form?.type]);

  const suggestedResourceTypes = useMemo(() => {
    const existingTypes = (facilities || [])
      .map((item) => String(item?.type || "").trim())
      .filter(Boolean);
    return Array.from(new Set([...RESOURCE_TYPE_OPTIONS, ...existingTypes]));
  }, [facilities]);

  const suggestedLocations = useMemo(() => {
    const defaults = [
      "Main Block - Floor 1",
      "Main Block - Floor 2",
      "Engineering Block - Floor 1",
      "Engineering Block - Floor 2",
      "Library Wing",
    ];
    const existingLocations = (facilities || [])
      .map((item) => String(item?.location || "").trim())
      .filter(Boolean);
    return Array.from(new Set([...defaults, ...existingLocations]));
  }, [facilities]);

  const visibleFacilities = useMemo(() => {
    const query = String(searchText || "").trim().toLowerCase();
    const filtered = (facilities || []).filter((facility) => {
      const statusValue = isAvailableStatus(facility?.availabilityStatus) ? "AVAILABLE" : "UNAVAILABLE";
      if (statusFilter !== "ALL" && statusValue !== statusFilter) return false;
      if (!query) return true;
      const text = [
        facility?.name,
        facility?.type,
        displayAvailabilityStatus(facility?.availabilityStatus),
        facility?.capacity,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });

    const sorted = [...filtered].sort((left, right) => {
      const normalize = (value) => String(value ?? "").toLowerCase();

      let leftValue;
      let rightValue;
      if (sortBy === "capacity") {
        leftValue = Number(left?.capacity || 0);
        rightValue = Number(right?.capacity || 0);
      } else if (sortBy === "status") {
        leftValue = normalize(left?.availabilityStatus);
        rightValue = normalize(right?.availabilityStatus);
      } else if (sortBy === "type") {
        leftValue = normalize(left?.type);
        rightValue = normalize(right?.type);
      } else {
        leftValue = normalize(left?.name);
        rightValue = normalize(right?.name);
      }

      if (leftValue < rightValue) return sortOrder === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [facilities, searchText, statusFilter, sortBy, sortOrder]);

  async function loadFacilities() {
    setLoading(true);
    try {
      const data = await getFacilities();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load resources.");
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFacilities();
  }, []);

  async function onCreate(event) {
    event.preventDefault();

    const payload = buildFacilityPayload(form);
    if (!payload.name) {
      toast.error("Resource name is required.");
      return;
    }
    if (!payload.type) {
      toast.error("Resource type is required.");
      return;
    }
    if (!Number.isFinite(payload.capacity) || payload.capacity < 1) {
      toast.error("Capacity must be a valid number greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateFacility(editingId, payload);
        toast.success("Facility updated.");
      } else {
        await createFacility(payload);
        toast.success("Facility created.");
      }
      setForm(initial);
      setEditingId(null);
      await loadFacilities();
    } catch (error) {
      toast.error(error?.message || "Failed to save resource.");
    } finally {
      setSubmitting(false);
    }
  }

  function onEdit(facility) {
    setEditingId(facility._id || facility.id);
    setForm({
      name: facility?.name || "",
      type: facility?.type || "Room",
      capacity: Number(facility?.capacity || 1),
      availabilityStatus: displayAvailabilityStatus(facility?.availabilityStatus) === "Available" ? "Available" : "Unavailable",
      location: facility?.location || "",
    });
  }

  function onCancelEdit() {
    setEditingId(null);
    setForm(initial);
  }

  async function onSetAvailability(facility, status) {
    const id = facility._id || facility.id;
    if (!id) {
      toast.error("Invalid resource id.");
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [id]: true }));
    try {
      await updateFacility(id, { availabilityStatus: status });
      toast.success("Facility updated.");
      await loadFacilities();
    } catch (error) {
      toast.error(error?.message || "Failed to update status.");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function onDelete(id) {
    if (!id) {
      toast.error("Invalid resource id.");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this resource?");
    if (!confirmed) return;

    setActionLoadingById((prev) => ({ ...prev, [id]: true }));
    try {
      await deleteFacility(id);
      toast.success("Facility deleted.");
      await loadFacilities();
    } catch (error) {
      toast.error(error?.message || "Failed to delete resource.");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Manage Facilities & Resources</h2>
        <p className="mt-1 text-sm text-slate-500">Quickly search, sort, and update room/service availability.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            className="input-field md:col-span-2"
            placeholder="Search by name, type, or capacity"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
          <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="capacity">Sort by Capacity</option>
            <option value="status">Sort by Status</option>
          </select>
          <select className="input-field" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="mt-2 text-xs text-slate-500">Showing {visibleFacilities.length} resource(s)</div>
        {loading ? <p className="mt-3 text-sm text-slate-500">Loading resources...</p> : null}

        {visibleFacilities.length === 0 ? <p className="mt-3 text-sm text-slate-500">No resources found. Try clearing filters or add a new one.</p> : null}

        {visibleFacilities.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Capacity</th>
                  <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleFacilities.map((facility) => {
                  const available = isAvailableStatus(facility?.availabilityStatus);
                  const rowId = facility._id || facility.id;
                  const rowBusy = Boolean(actionLoadingById[rowId]);
                  return (
                    <tr key={rowId} className="border-t border-emerald-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{facility.name}</td>
                      <td className="px-3 py-2 text-slate-600">{facility.type}</td>
                      <td className="px-3 py-2 text-slate-600">{facility.capacity}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {displayAvailabilityStatus(facility.availabilityStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{facility.location || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-secondary h-9 px-3 py-1.5 text-xs"
                            disabled={rowBusy}
                            onClick={() => onEdit(facility)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-secondary h-9 px-3 py-1.5 text-xs"
                            disabled={available || rowBusy}
                            onClick={() => onSetAvailability(facility, "Available")}
                          >
                            Available
                          </button>
                          <button
                            type="button"
                            className="btn-secondary h-9 px-3 py-1.5 text-xs"
                            disabled={!available || rowBusy}
                            onClick={() => onSetAvailability(facility, "Unavailable")}
                          >
                            Unavailable
                          </button>
                          <button type="button" className="text-xs font-semibold text-rose-600 disabled:opacity-50" disabled={rowBusy} onClick={() => onDelete(rowId)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">{editingId ? "Edit Resource" : "Add New Resource"}</h3>
        <p className="mt-1 text-sm text-slate-500">Create or update resources with any type (Room, Lab, Equipment, etc.).</p>
        <form className="mt-4 grid gap-3" onSubmit={onCreate}>
          <input
            className="input-field"
            list="resource-name-options"
            placeholder="Resource Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <datalist id="resource-name-options">
            {suggestedResourceNames.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <p className="-mt-2 text-xs text-slate-500">Tip: select a suggested name or type a custom resource name.</p>
          <input
            className="input-field"
            list="resource-type-options"
            placeholder="Type (e.g. Room, Lab, Equipment, Auditorium)"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            required
          />
          <datalist id="resource-type-options">
            {suggestedResourceTypes.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>

          <input
            className="input-field"
            type="number"
            min={1}
            list="resource-capacity-options"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
            required
          />
          <datalist id="resource-capacity-options">
            {RESOURCE_CAPACITY_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>

          <input
            className="input-field"
            list="resource-location-options"
            placeholder="Location (e.g. Main Block - Floor 2)"
            value={form.location || ""}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          />
          <datalist id="resource-location-options">
            {suggestedLocations.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>

          <input
            className="input-field"
            list="resource-status-options"
            placeholder="Status"
            value={form.availabilityStatus}
            onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}
            required
          />
          <datalist id="resource-status-options">
            {RESOURCE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : editingId ? "Update" : "Create"}</button>
            {editingId ? <button type="button" className="btn-secondary" onClick={onCancelEdit} disabled={submitting}>Cancel</button> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
