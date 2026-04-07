import React from "react";
import { BookOpenCheck, FileUp, Users } from "lucide-react";
import AppShell from "../../../core/layouts/AppShell";

const managedCourses = [
  { code: "IT3030", name: "Advanced Web Engineering", students: 86 },
  { code: "SE3070", name: "Software Architecture", students: 74 },
];

const materials = [
  { title: "Week 05 - React State Patterns", uploaded: "Today" },
  { title: "Architecture Assignment Brief", uploaded: "Yesterday" },
];

const students = [
  { name: "Nimal Perera", course: "IT3030", status: "Submitted" },
  { name: "Ayesha Silva", course: "SE3070", status: "Pending" },
  { name: "Dilan Fernando", course: "IT3030", status: "Submitted" },
];

export default function LecturerDashboardPage() {
  return (
    <AppShell role="LECTURER" title="Lecturer Dashboard" subtitle="Manage courses, materials, and student progress">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Managed Courses</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{managedCourses.length}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Total Students</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">160</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Pending Reviews</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">12</p>
        </div>
      </section>

      <section id="manage-courses" className="panel p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <BookOpenCheck className="text-campus-600" size={18} />
          Manage Courses
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {managedCourses.map((course) => (
            <div key={course.code} className="rounded-xl border border-emerald-100 p-4">
              <p className="text-xs font-semibold tracking-wide text-campus-700">{course.code}</p>
              <h3 className="mt-1 font-semibold text-slate-800">{course.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{course.students} students enrolled</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div id="materials" className="panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileUp className="text-campus-600" size={18} />
            Upload Materials
          </h2>
          <button type="button" className="btn-primary mt-4">Upload New Material</button>
          <div className="mt-4 space-y-3">
            {materials.map((material) => (
              <div key={material.title} className="rounded-xl border border-emerald-100 px-4 py-3">
                <p className="font-medium text-slate-800">{material.title}</p>
                <p className="text-xs text-slate-500">Uploaded: {material.uploaded}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="students" className="panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users className="text-campus-600" size={18} />
            View Students
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.name} className="border-t border-emerald-100">
                    <td className="px-3 py-2 text-slate-700">{student.name}</td>
                    <td className="px-3 py-2 text-slate-600">{student.course}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-campus-700">
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
