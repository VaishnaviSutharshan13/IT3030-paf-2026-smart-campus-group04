import React, { useEffect, useMemo, useState } from "react";
import { createCourse, deleteCourse, getCourses, updateCourse } from "../../courses/services/courseApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initial = { code: "", title: "", description: "", lecturer: "" };

export default function AdminCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);

  const hasData = useMemo(() => courses.length > 0, [courses.length]);

  async function loadCourses() {
    setLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    try {
      await createCourse(form);
      toast.success("Course created.");
      setForm(initial);
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCourse(id);
      toast.success("Course deleted.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleQuickUpdate(course) {
    try {
      await updateCourse(course._id || course.id, { title: `${course.title} (Updated)` });
      toast.success("Course updated.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Manage Courses</h2>
        {loading ? <p className="mt-3 text-sm text-slate-500">Loading courses...</p> : null}
        {!loading && !hasData ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
        {hasData ? (
          <div className="mt-4 space-y-3">
            {courses.map((course) => (
              <article key={course._id || course.id} className="rounded-xl border border-emerald-100 p-4">
                <p className="text-xs font-semibold text-campus-700">{course.code}</p>
                <p className="font-semibold text-slate-800">{course.title}</p>
                <p className="text-sm text-slate-500">{course.description || "No description available."}</p>
                <div className="mt-3 flex gap-3">
                  <button type="button" className="btn-secondary" onClick={() => handleQuickUpdate(course)}>Update</button>
                  <button type="button" className="text-sm text-rose-600" onClick={() => handleDelete(course._id || course.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Create Course</h2>
        <form className="mt-4 grid gap-3" onSubmit={handleCreate}>
          <input className="input-field" placeholder="Course code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
          <input className="input-field" placeholder="Course title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input className="input-field" placeholder="Lecturer ID" value={form.lecturer} onChange={(e) => setForm((p) => ({ ...p, lecturer: e.target.value }))} required />
          <button type="submit" className="btn-primary">Create Course</button>
        </form>
      </div>
    </section>
  );
}
