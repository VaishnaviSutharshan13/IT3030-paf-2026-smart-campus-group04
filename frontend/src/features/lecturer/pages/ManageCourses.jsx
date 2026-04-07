import React from "react";
import { BookOpenCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { createCourse, deleteCourse, getCourses, updateCourse } from "../../courses/services/courseApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initial = { code: "", title: "", description: "" };

export default function ManageCourses() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initial);

  async function loadCourses() {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function onCreate(event) {
    event.preventDefault();
    try {
      await createCourse(form);
      setForm(initial);
      toast.success("Course created.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onQuickUpdate(course) {
    try {
      await updateCourse(course._id || course.id, { title: `${course.title} (Updated)` });
      toast.success("Course updated.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function onDelete(id) {
    try {
      await deleteCourse(id);
      toast.success("Course deleted.");
      loadCourses();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="panel p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <BookOpenCheck className="text-campus-600" size={18} />
          Manage Courses
        </h2>
        {courses.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <div key={course._id || course.id} className="rounded-xl border border-emerald-100 p-4">
              <p className="text-xs font-semibold tracking-wide text-campus-700">{course.code}</p>
              <h3 className="mt-1 font-semibold text-slate-800">{course.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{course.description || "No description available."}</p>
              <div className="mt-3 flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => onQuickUpdate(course)}>Update</button>
                <button type="button" className="text-sm text-rose-600" onClick={() => onDelete(course._id || course.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Create Course</h3>
        <form className="mt-4 grid gap-3" onSubmit={onCreate}>
          <input className="input-field" placeholder="Course code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
          <input className="input-field" placeholder="Course title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="input-field" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <button type="submit" className="btn-primary">Create</button>
        </form>
      </div>
    </section>
  );
}
