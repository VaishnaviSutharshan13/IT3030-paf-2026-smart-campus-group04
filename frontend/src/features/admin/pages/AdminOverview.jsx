import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, CalendarClock, CheckCircle2, Shield, Users } from "lucide-react";
import DashboardCard from "../../../components/dashboard/DashboardCard";
import DataTable from "../../../components/dashboard/DataTable";
import StatusBadge from "../../../components/dashboard/StatusBadge";
import { getUsers, getSystemStats } from "../services/adminApi";
import { approveBooking, getBookings, rejectBooking } from "../../bookings/services/bookingApi";
import { fetchResources } from "../../resources/services/resourceService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function formatRoleLabel(role) {
  return String(role || "student")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminOverview() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyBookingId, setBusyBookingId] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setError("");

      const [overview, userRows, bookingRows, resourceRows] = await Promise.allSettled([
          getSystemStats(),
          getUsers(),
          getBookings(true),
          fetchResources(),
      ]);

      setStats(overview.status === "fulfilled" ? (overview.value || {}) : {});
      setUsers(userRows.status === "fulfilled" && Array.isArray(userRows.value) ? userRows.value : []);
      setBookings(bookingRows.status === "fulfilled" && Array.isArray(bookingRows.value) ? bookingRows.value : []);
      setResources(resourceRows.status === "fulfilled" && Array.isArray(resourceRows.value) ? resourceRows.value : []);

      const hasFailures = [overview, userRows, bookingRows, resourceRows].some((result) => result.status === "rejected");
      const permissionDenied = [overview, userRows, bookingRows, resourceRows].some((result) => {
        if (result.status !== "rejected") return false;
        const message = String(result.reason?.message || "").toLowerCase();
        return message.includes("permission") || message.includes("forbidden") || message.includes("403");
      });

      if (permissionDenied) {
        setError("You don't have permission to view this data");
      } else if (hasFailures) {
        setError("Some dashboard data is currently unavailable");
      }

      setIsLoading(false);
    }

    loadDashboardData();
  }, []);

  const pendingApprovals = useMemo(
    () => bookings.filter((item) => String(item.status || "").toUpperCase() === "PENDING").length,
    [bookings]
  );

  const topBookingRows = useMemo(() => bookings.slice(0, 12), [bookings]);
  const topUserRows = useMemo(() => users.slice(0, 12), [users]);

  const bookingsPerDay = useMemo(() => {
    const aggregate = new Map();
    bookings.forEach((booking) => {
      const day = booking.date || "Unknown";
      aggregate.set(day, (aggregate.get(day) || 0) + 1);
    });
    return Array.from(aggregate.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-7);
  }, [bookings]);

  const roomUsage = useMemo(() => {
    const aggregate = new Map();
    bookings.forEach((booking) => {
      const key = booking.roomNumber || "Unknown";
      aggregate.set(key, (aggregate.get(key) || 0) + 1);
    });
    return Array.from(aggregate.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [bookings]);

  async function onApproveBooking(id) {
    setBusyBookingId(id);
    try {
      await approveBooking(id);
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status: "APPROVED" } : booking)));
      toast.success("Booking approved successfully.");
    } catch (err) {
      toast.error(err.message || "Could not approve booking.");
    } finally {
      setBusyBookingId(null);
    }
  }

  async function onRejectBooking(id) {
    setBusyBookingId(id);
    try {
      await rejectBooking(id, "Rejected by super admin");
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status: "REJECTED" } : booking)));
      toast.success("Booking rejected.");
    } catch (err) {
      toast.error(err.message || "Could not reject booking.");
    } finally {
      setBusyBookingId(null);
    }
  }

  return (
    <section className="space-y-5">
      {error ? (
        <article className="dashboard-glass-card border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
          {error}
        </article>
      ) : null}

      <article className="dashboard-hero">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">SuperAdmin Workspace</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">Smart Campus Command Dashboard</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Monitor people, room allocations, and approval workflows from one place. All insights are generated from existing API data.
        </p>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Users"
          value={Number(stats?.totalUsers ?? users.length).toLocaleString()}
          subtitle="Registered campus members"
          icon={Users}
          trend="Live from existing user API"
        />
        <DashboardCard
          title="Total Bookings"
          value={Number(bookings.length).toLocaleString()}
          subtitle="All booking requests"
          icon={CalendarClock}
        />
        <DashboardCard
          title="Pending Approvals"
          value={Number(stats?.pendingBookings ?? pendingApprovals).toLocaleString()}
          subtitle="Requires admin action"
          icon={Shield}
        />
        <DashboardCard
          title="Active Rooms"
          value={Number(stats?.activeResources ?? resources.length).toLocaleString()}
          subtitle="Resources currently available"
          icon={Building2}
        />
      </div>

      <article className="dashboard-glass-card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-800">Booking Management</h3>
        </div>

        <DataTable
          loading={isLoading}
          rows={topBookingRows}
          emptyText="No data available"
          columns={[
            {
              key: "user",
              label: "User",
              render: (row) => row.userName || (row.userId ? `User #${row.userId}` : "-"),
            },
            { key: "roomType", label: "Room Type" },
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
            {
              key: "actions",
              label: "Actions",
              render: (row) => {
                const status = String(row.status || "").toUpperCase();
                const disabled = status !== "PENDING" || busyBookingId === row.id;

                return (
                  <div className="flex gap-2">
                    <button type="button" className="btn-primary h-8 px-3 text-xs" disabled={disabled} onClick={() => onApproveBooking(row.id)}>
                      Approve
                    </button>
                    <button type="button" className="btn-secondary h-8 px-3 text-xs" disabled={disabled} onClick={() => onRejectBooking(row.id)}>
                      Reject
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      </article>

      <article className="dashboard-glass-card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-cyan-600" />
          <h3 className="text-lg font-semibold text-slate-800">User Management</h3>
        </div>
        <DataTable
          loading={isLoading}
          rows={topUserRows}
          emptyText="No data available"
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "roles",
              label: "Role",
              render: (row) => formatRoleLabel(row.role),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
        />
      </article>

      <article className="dashboard-glass-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-800">Analytics</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            <h4 className="text-sm font-semibold text-slate-700">Bookings Per Day</h4>
            <div className="mt-3 space-y-3">
              {bookingsPerDay.length > 0 ? (
                bookingsPerDay.map(([day, count]) => {
                  const max = Math.max(1, ...bookingsPerDay.map((entry) => entry[1]));
                  return (
                    <div key={day}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{day}</span>
                        <span className="font-semibold text-slate-700">{count}</span>
                      </div>
                      <div className="chart-bar">
                        <div className="chart-bar-fill" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No data available</p>
              )}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-700">Room Usage</h4>
            <div className="mt-3 space-y-3">
              {roomUsage.length > 0 ? (
                roomUsage.map(([room, count]) => {
                  const max = Math.max(1, ...roomUsage.map((entry) => entry[1]));
                  return (
                    <div key={room}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{room}</span>
                        <span className="font-semibold text-slate-700">{count}</span>
                      </div>
                      <div className="chart-bar">
                        <div className="chart-bar-fill" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No data available</p>
              )}
            </div>
          </section>
        </div>
      </article>
    </section>
  );
}
