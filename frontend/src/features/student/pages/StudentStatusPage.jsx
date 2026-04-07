import React, { useEffect, useState } from "react";
import { getMyAssignments } from "../../students/services/studentApi";

export default function StudentStatusPage() {
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyAssignments().then(setAssignments).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
  }

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Assignment Status</h2>
      {assignments.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
      <div className="mt-4 space-y-2">
        {assignments.map((assignment) => (
          <div key={assignment._id || assignment.id} className="rounded-xl border border-emerald-100 p-3">
            <p className="font-medium text-slate-800">{assignment.title}</p>
            <p className="text-xs text-slate-500">{String(assignment.status || "pending").toUpperCase()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
