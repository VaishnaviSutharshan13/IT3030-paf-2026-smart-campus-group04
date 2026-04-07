import React from "react";
import { Bell, BookOpen, CalendarDays, Clock3 } from "lucide-react";
import AppShell from "../../../core/layouts/AppShell";

const courses = [
  { code: "IT3030", name: "Advanced Web Engineering", lecturer: "Dr. Perera" },
  { code: "SE3070", name: "Software Architecture", lecturer: "Ms. Dissanayake" },
  { code: "CS3110", name: "Database Systems", lecturer: "Mr. Fernando" },
];

const timetable = [
  { day: "Mon", time: "08:30 - 10:30", module: "Advanced Web Engineering", venue: "Lab B4" },
  { day: "Tue", time: "11:30 - 13:30", module: "Software Architecture", venue: "Hall A2" },
  { day: "Thu", time: "09:30 - 11:30", module: "Database Systems", venue: "Lab C1" },
];

const announcements = [
  { title: "Semester registration closes Friday", time: "2 hours ago" },
  { title: "Network maintenance on Sunday", time: "Yesterday" },
  { title: "Exam timetable draft released", time: "2 days ago" },
];

export default function StudentDashboardPage() {
  return (
    <AppShell role="STUDENT" title="Student Dashboard" subtitle="Courses, timetable, and campus updates">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Current GPA</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">3.82</p>
          <p className="mt-2 text-sm text-slate-500">Excellent standing in this semester.</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Active Modules</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{courses.length}</p>
          <p className="mt-2 text-sm text-slate-500">All modules synchronized with timetable.</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Upcoming Class</p>
          <p className="mt-2 text-xl font-semibold text-campus-700">Tue 11:30</p>
          <p className="mt-2 text-sm text-slate-500">Software Architecture - Hall A2</p>
        </div>
      </section>

      <section id="courses" className="panel p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <BookOpen className="text-campus-600" size={18} />
          Courses
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.code} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <p className="text-xs font-semibold tracking-wide text-campus-700">{course.code}</p>
              <h3 className="mt-1 font-semibold text-slate-800">{course.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{course.lecturer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div id="timetable" className="panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <CalendarDays className="text-campus-600" size={18} />
            Timetable
          </h2>
          <div className="mt-4 space-y-3">
            {timetable.map((slot) => (
              <div key={`${slot.day}-${slot.time}`} className="flex items-center justify-between rounded-xl border border-emerald-100 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{slot.module}</p>
                  <p className="text-sm text-slate-500">{slot.day} • {slot.time}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-campus-700">
                  <Clock3 size={14} />
                  {slot.venue}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside id="announcements" className="panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Bell className="text-campus-600" size={18} />
            Announcements
          </h2>
          <div className="mt-4 space-y-3">
            {announcements.map((item) => (
              <div key={item.title} className="rounded-xl border border-emerald-100 p-3">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.time}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
