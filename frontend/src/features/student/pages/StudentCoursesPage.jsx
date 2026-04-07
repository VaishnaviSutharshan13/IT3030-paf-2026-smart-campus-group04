import React, { useEffect, useState } from "react";
import { getCourses } from "../../courses/services/courseApi";

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Enrolled Courses</h2>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading courses...</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {!loading && !error && courses.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course._id || course.id} className="rounded-xl border border-emerald-100 p-4">
            <p className="text-xs font-semibold text-campus-700">{course.code}</p>
            <p className="font-semibold text-slate-800">{course.title}</p>
            <p className="text-sm text-slate-500">{course.description || "No description available."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
