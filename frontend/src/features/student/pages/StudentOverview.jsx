import React, { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarClock, MapPinned } from "lucide-react";
import DashboardCard from "../../../components/dashboard/DashboardCard";
import DataTable from "../../../components/dashboard/DataTable";
import StatusBadge from "../../../components/dashboard/StatusBadge";
import { getBookings } from "../../bookings/services/bookingApi";
import { fetchResources } from "../../resources/services/resourceService";

export default function StudentOverview() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setError("");
      try {
        const [resourceRows, bookingRows] = await Promise.all([fetchResources(), getBookings()]);
        setResources(Array.isArray(resourceRows) ? resourceRows : []);
        setBookings(Array.isArray(bookingRows) ? bookingRows : []);
      } catch (err) {
        setError(err.message || "Failed to load student dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const availableRooms = useMemo(
    () => resources.filter((resource) => resource.active !== false).slice(0, 10),
    [resources]
  );

  const scheduleRows = useMemo(() => bookings.slice(0, 10), [bookings]);

  const notifications = [
    "Lab orientation opens at 09:00 tomorrow.",
    "Two of your recent booking requests are pending approval.",
    "Upload assignment files before Friday 5:00 PM.",
  ];

  if (error) {
    return <section className="dashboard-glass-card p-5 text-sm text-rose-700">{error}</section>;
  }

  return (
    <section className="space-y-5">
      <article className="dashboard-hero">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Student Workspace</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">Your Smart Campus Dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Read-only snapshots of room availability, booking timetable, and notifications.</p>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Available Rooms" value={availableRooms.length} subtitle="Open resources right now" icon={MapPinned} />
        <DashboardCard title="My Schedule" value={scheduleRows.length} subtitle="Recent booking entries" icon={CalendarClock} />
        <DashboardCard title="Notifications" value={notifications.length} subtitle="Latest updates" icon={BellRing} />
      </div>

      <article className="dashboard-glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800">View Available Rooms</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {availableRooms.length > 0 ? (
            availableRooms.map((room) => (
              <div key={room.id || room.code} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                <p className="text-sm font-semibold text-slate-700">{room.code || room.name || `Room #${room.id}`}</p>
                <p className="mt-1 text-xs text-slate-500">{room.type || "Room"}</p>
                <div className="mt-2">
                  <StatusBadge status={room.active === false ? "inactive" : "active"} label={room.active === false ? "Inactive" : "Active"} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No data available</p>
          )}
        </div>
      </article>

      <article className="dashboard-glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800">View Booking Schedule</h3>
        <p className="mt-1 text-sm text-slate-500">Timetable view of your latest booking records.</p>
        <div className="mt-4">
          <DataTable
            loading={isLoading}
            rows={scheduleRows}
            emptyText="No data available"
            columns={[
              { key: "roomNumber", label: "Room" },
              { key: "date", label: "Date" },
              {
                key: "time",
                label: "Time",
                render: (row) => `${row.startTime || "--:--"} - ${row.endTime || "--:--"}`,
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
            ]}
          />
        </div>
      </article>

      <article className="dashboard-glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
        <div className="mt-3 space-y-2">
          {notifications.map((notice) => (
            <div key={notice} className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-3 py-2 text-sm text-slate-700">
              {notice}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
