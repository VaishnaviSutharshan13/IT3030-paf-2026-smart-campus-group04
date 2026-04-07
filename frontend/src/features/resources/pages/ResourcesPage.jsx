import React, { useEffect, useState } from "react";
import AppShell from "../../../core/layouts/AppShell";
import SectionCard from "../../../shared/components/SectionCard";
import {
  createResource,
  deleteResource,
  fetchResources,
  updateResource,
} from "../services/resourceService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const EMPTY_FORM = {
  typeCode: "ROOM",
  code: "",
  name: "",
  location: "",
  capacity: "",
  description: "",
  active: true,
};

export default function ResourcesPage() {
  const toast = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  async function loadResources() {
    setLoading(true);
    try {
      const data = await fetchResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function onSubmit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : null,
    };

    try {
      if (editingId) {
        await updateResource(editingId, payload);
        toast.success("Resource updated.");
      } else {
        await createResource(payload);
        toast.success("Resource created.");
      }
      resetForm();
      await loadResources();
    } catch (error) {
      toast.error(error.message || "Failed to save resource.");
    }
  }

  async function onDelete(id) {
    try {
      await deleteResource(id);
      toast.info("Resource archived.");
      await loadResources();
    } catch (error) {
      toast.error(error.message || "Failed to delete resource.");
    }
  }

  function onEdit(resource) {
    setEditingId(resource.id);
    setForm({
      typeCode: resource.typeCode,
      code: resource.code,
      name: resource.name,
      location: resource.location,
      capacity: resource.capacity || "",
      description: resource.description || "",
      active: resource.active,
    });
  }

  return (
    <AppShell title="Resources" subtitle="Rooms, labs, and equipment catalogue">
      <SectionCard title={editingId ? "Edit Resource" : "Create Resource"}>
        <form className="form-grid" onSubmit={onSubmit}>
          <select
            className="input"
            value={form.typeCode}
            onChange={(event) => setForm((current) => ({ ...current, typeCode: event.target.value }))}
          >
            <option value="ROOM">Room</option>
            <option value="LAB">Lab</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
          <input className="input" placeholder="Code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <input className="input" placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="input" placeholder="Location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
          <input className="input" type="number" placeholder="Capacity" value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} />
          <textarea className="input textarea" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <div className="action-row">
            <button type="submit" className="btn btn-accent">{editingId ? "Update" : "Create"}</button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Clear</button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Resources Table">
        {loading ? <div className="loading">Loading resources...</div> : null}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Code</th>
                <th>Name</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.typeCode}</td>
                  <td>{resource.code}</td>
                  <td>{resource.name}</td>
                  <td>{resource.location}</td>
                  <td>{resource.capacity || "-"}</td>
                  <td>
                    <span className={`status ${resource.active ? "success" : "danger"}`}>
                      {resource.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="btn btn-ghost" onClick={() => onEdit(resource)}>Edit</button>
                      <button type="button" className="btn btn-danger" onClick={() => onDelete(resource.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
