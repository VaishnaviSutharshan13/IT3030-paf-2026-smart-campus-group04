import React, { useEffect, useState } from "react";
import { getReports } from "../services/adminApi";

export default function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getReports().then(setStats).catch((err) => setError(err.message));
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
        <div className="rounded-xl border border-emerald-100 p-3"><p className="text-xs uppercase text-slate-500">Total Bookings</p><p className="mt-1 text-2xl font-semibold text-campus-700">{stats?.totalBookings || 0}</p></div>
        <div className="rounded-xl border border-emerald-100 p-3"><p className="text-xs uppercase text-slate-500">Approved Bookings</p><p className="mt-1 text-2xl font-semibold text-campus-700">{stats?.approvedBookings || 0}</p></div>
        <div className="rounded-xl border border-emerald-100 p-3"><p className="text-xs uppercase text-slate-500">Rejected Bookings</p><p className="mt-1 text-2xl font-semibold text-campus-700">{stats?.rejectedBookings || 0}</p></div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-amber-100 p-3">
          <p className="text-xs uppercase text-slate-500">Total Incidents</p>
          <p className="mt-1 text-sm text-slate-700">Count: <span className="font-semibold">{stats?.totalIncidents || 0}</span></p>
        </div>
        <div className="rounded-xl border border-emerald-100 p-3">
          <p className="text-xs uppercase text-slate-500">Resolved Incidents</p>
          <p className="mt-1 text-sm text-slate-700">Count: <span className="font-semibold">{stats?.resolvedIncidents || 0}</span></p>
        </div>
        <div className="rounded-xl border border-emerald-100 p-3">
          <p className="text-xs uppercase text-slate-500">Technicians Workload</p>
          <p className="mt-1 text-sm text-slate-700">Open work: <span className="font-semibold">{Math.max(0, Number(stats?.totalIncidents || 0) - Number(stats?.resolvedIncidents || 0))}</span></p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">Summary updates automatically from live database counts.</p>
    </section>
  );
}
