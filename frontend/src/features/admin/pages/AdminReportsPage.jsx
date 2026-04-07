import React, { useEffect, useState } from "react";
import { getSystemStats } from "../services/adminApi";

export default function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSystemStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
  }

  if (!stats) {
    return <section className="panel p-5 text-sm text-slate-500">Loading reports...</section>;
  }

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Reports</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 p-3"><p className="text-xs uppercase text-slate-500">Bookings</p><p className="mt-1 text-2xl font-semibold text-campus-700">{stats.totalBookings || 0}</p></div>
        <div className="rounded-xl border border-emerald-100 p-3"><p className="text-xs uppercase text-slate-500">Tickets</p><p className="mt-1 text-2xl font-semibold text-campus-700">{stats.totalTickets || 0}</p></div>
        <div className="rounded-xl border border-emerald-100 p-3"><p className="text-xs uppercase text-slate-500">Facilities</p><p className="mt-1 text-2xl font-semibold text-campus-700">{stats.totalFacilities || 0}</p></div>
      </div>
      {(stats.recentUsers || []).length === 0 ? <p className="mt-4 text-sm text-slate-500">No data available.</p> : null}
      <div className="mt-4 space-y-2">
        {(stats.recentUsers || []).map((user) => (
          <div key={user.id} className="rounded-lg border border-emerald-100 p-3">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email} • {String(user.role || "").toUpperCase()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
