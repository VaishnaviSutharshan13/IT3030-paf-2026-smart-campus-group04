import React from "react";
import { FileUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getCourses } from "../../courses/services/courseApi";
import { createMaterial, deleteMaterial, getMaterials, updateMaterial } from "../../materials/services/materialApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initial = { title: "", description: "", fileUrl: "", course: "" };

export default function UploadMaterials() {
  const toast = useToast();
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initial);

  async function loadData() {
    try {
      const [courseRows, materialRows] = await Promise.all([getCourses(), getMaterials()]);
      setCourses(courseRows);
      setMaterials(materialRows);
      if (!form.course && courseRows.length > 0) {
        setForm((prev) => ({ ...prev, course: courseRows[0]._id || courseRows[0].id }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onCreate(event) {
    event.preventDefault();
    try {
      await createMaterial(form);
      toast.success("Material uploaded.");
      setForm((prev) => ({ ...initial, course: prev.course }));
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onQuickUpdate(material) {
    try {
      await updateMaterial(material._id || material.id, { title: `${material.title} (Updated)` });
      toast.success("Material updated.");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onDelete(id) {
    try {
      await deleteMaterial(id);
      toast.success("Material deleted.");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="panel p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <FileUp className="text-campus-600" size={18} />
          Upload Materials
        </h2>
        {materials.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
        <div className="mt-4 space-y-3">
          {materials.map((material) => (
            <div key={material._id || material.id} className="rounded-xl border border-emerald-100 px-4 py-3">
              <p className="font-medium text-slate-800">{material.title}</p>
              <p className="text-xs text-slate-500">{material.description || "No description available."}</p>
              <div className="mt-2 flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => onQuickUpdate(material)}>Update</button>
                <button type="button" className="text-sm text-rose-600" onClick={() => onDelete(material._id || material.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Upload New Material</h3>
        <form className="mt-4 grid gap-3" onSubmit={onCreate}>
          <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input className="input-field" placeholder="File URL" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} required />
          <select className="input-field" value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))} required>
            {courses.map((course) => <option key={course._id || course.id} value={course._id || course.id}>{course.code} - {course.title}</option>)}
          </select>
          <button type="submit" className="btn-primary">Upload</button>
        </form>
      </div>
    </section>
  );
}
