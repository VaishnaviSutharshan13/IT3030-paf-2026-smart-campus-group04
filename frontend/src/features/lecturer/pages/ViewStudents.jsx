import React from "react";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getStudents } from "../../students/services/studentApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function ViewStudents() {
  const toast = useToast();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getStudents().then(setStudents).catch((error) => toast.error(error.message));
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Users className="text-campus-600" size={18} />
        View Students
      </h2>
      {students.length === 0 ? <p className="mt-3 text-sm text-slate-500">No data available.</p> : null}
      <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id || student.id} className="border-t border-emerald-100">
                <td className="px-3 py-2 text-slate-700">{student.name}</td>
                <td className="px-3 py-2 text-slate-600">{student.email}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-campus-700">
                    {String(student.role || "student").toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
