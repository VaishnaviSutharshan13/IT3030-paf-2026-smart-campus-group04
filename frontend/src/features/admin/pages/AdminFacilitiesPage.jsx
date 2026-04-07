import React, { useEffect, useState } from "react";
import { createFacility, deleteFacility, getFacilities, updateFacility } from "../../facilities/services/facilityApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initial = { name: "", type: "Room", capacity: 1, availabilityStatus: "Available" };

export default function AdminFacilitiesPage() {
  const toast = useToast();
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState(initial);

  async function loadFacilities() {
    try {
      const data = await getFacilities();
      setFacilities(data);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadFacilities();
  }, []);

  async function onCreate(event) {
    event.preventDefault();
    try {
      await createFacility(form);
      setForm(initial);
      toast.success("Facility created.");
      loadFacilities();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onToggleAvailability(facility) {
    const nextStatus = facility.availabilityStatus === "Available" ? "Unavailable" : "Available";
    try {
      await updateFacility(facility._id || facility.id, { availabilityStatus: nextStatus });
      toast.success("Facility updated.");
      loadFacilities();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onDelete(id) {
    try {
      await deleteFacility(id);
      toast.success("Facility deleted.");
      loadFacilities();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Manage Facilities & Resources</h2>
        {facilities.length === 0 ? <p className="mt-3 text-sm text-slate-500">No facilities added yet. Create your first resource to get started.</p> : null}
        <div className="mt-4 space-y-2">
          {facilities.map((facility) => (
            <div key={facility._id || facility.id} className="rounded-xl border border-emerald-100 p-3">
              <p className="text-sm font-semibold text-slate-800">{facility.name}</p>
              <p className="text-xs text-slate-500">{facility.type} • Capacity {facility.capacity}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs font-semibold text-campus-700">{facility.availabilityStatus}</span>
                <button type="button" className="btn-secondary" onClick={() => onToggleAvailability(facility)}>Toggle</button>
                <button type="button" className="text-xs text-rose-600" onClick={() => onDelete(facility._id || facility.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Create Facility</h3>
        <form className="mt-4 grid gap-3" onSubmit={onCreate}>
          <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <select className="input-field" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="Room">Room</option>
            <option value="Lab">Lab</option>
            <option value="Equipment">Equipment</option>
          </select>
          <input className="input-field" type="number" min={1} value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} required />
          <select className="input-field" value={form.availabilityStatus} onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
          <button type="submit" className="btn-primary">Create</button>
        </form>
      </div>
    </section>
  );
}
