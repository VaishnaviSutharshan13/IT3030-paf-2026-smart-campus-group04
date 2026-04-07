import React, { useEffect, useState } from "react";
import { createAssignment, deleteAssignment, getMyAssignments } from "../../students/services/studentApi";
import { getCourses } from "../../courses/services/courseApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initial = { title: "", submissionText: "", course: "" };

export default function StudentAssignmentsPage() {
  const toast = useToast();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initial);

  async function loadData() {
    try {
      const [assignmentRows, courseRows] = await Promise.all([getMyAssignments(), getCourses()]);
      setAssignments(assignmentRows);
      setCourses(courseRows);
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

  async function handleCreate(event) {
    event.preventDefault();
    try {
      await createAssignment(form);
      toast.success("Assignment submitted.");
      setForm((prev) => ({ ...initial, course: prev.course }));
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAssignment(id);
      toast.success("Assignment deleted.");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Submit Assignments</h2>
        <form className="mt-4 grid gap-3" onSubmit={handleCreate}>
          <input className="input-field" placeholder="Assignment title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea className="input-field" placeholder="Submission text" value={form.submissionText} onChange={(e) => setForm((p) => ({ ...p, submissionText: e.target.value }))} required />
          <select className="input-field" value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))} required>
            {courses.map((course) => <option key={course._id || course.id} value={course._id || course.id}>{course.code} - {course.title}</option>)}
          </select>
          <button type="submit" className="btn-primary">Submit</button>
        </form>
      </div>

      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">My Submissions</h2>
        {assignments.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
        <div className="mt-3 space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment._id || assignment.id} className="rounded-xl border border-emerald-100 p-3">
              <p className="font-medium text-slate-800">{assignment.title}</p>
              <p className="text-xs text-slate-500">Status: {assignment.status}</p>
              <button type="button" className="mt-2 text-xs text-rose-600" onClick={() => handleDelete(assignment._id || assignment.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
