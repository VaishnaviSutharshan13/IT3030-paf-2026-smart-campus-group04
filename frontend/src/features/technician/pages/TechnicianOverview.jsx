import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Microscope, Wrench } from "lucide-react";
import DashboardCard from "../../../components/dashboard/DashboardCard";
import DataTable from "../../../components/dashboard/DataTable";
import StatusBadge from "../../../components/dashboard/StatusBadge";
import { getBookings } from "../../bookings/services/bookingApi";

const MAINTENANCE_KEY = "technician-maintenance-rooms";

function readMaintenanceState() {
  const raw = localStorage.getItem(MAINTENANCE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export default function TechnicianOverview() {
  const [bookings, setBookings] = useState([]);
  const [maintenanceRooms, setMaintenanceRooms] = useState(readMaintenanceState);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true);
      setError("");

      try {
        try {
          const allBookings = await getBookings(true);
          setBookings(Array.isArray(allBookings) ? allBookings : []);
        } catch {
          const fallbackBookings = await getBookings(false);
          setBookings(Array.isArray(fallbackBookings) ? fallbackBookings : []);
        }
      } catch (err) {
        setError(err.message || "Failed to load technician dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, []);

  useEffect(() => {
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(maintenanceRooms));
  }, [maintenanceRooms]);

  const labBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const type = String(booking.roomType || "").toLowerCase();
        const room = String(booking.roomNumber || "").toLowerCase();
        return type.includes("lab") || room.startsWith("lab");
      }),
    [bookings]
  );

  const maintenanceRoomList = useMemo(() => {
    const rooms = new Set(labBookings.map((booking) => booking.roomNumber).filter(Boolean));
    return Array.from(rooms).sort();
  }, [labBookings]);

  const maintenanceAlerts = useMemo(
    () =>
      labBookings.filter((booking) => {
        const underMaintenance = Boolean(maintenanceRooms[booking.roomNumber]);
        const activeBooking = ["PENDING", "APPROVED"].includes(String(booking.status || "").toUpperCase());
        return underMaintenance && activeBooking;
      }),
    [labBookings, maintenanceRooms]
  );

  function toggleMaintenance(roomCode) {
    setMaintenanceRooms((prev) => ({
      ...prev,
      [roomCode]: !prev[roomCode],
    }));
  }

  if (error) {
    return <section className="dashboard-glass-card p-5 text-sm text-rose-700">{error}</section>;
  }

  return (
    <section className="space-y-5">
      <article className="dashboard-hero">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Technician Workspace</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">Labs and Maintenance Dashboard</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">Track lab bookings, mark rooms under maintenance, and surface conflicts early.</p>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Lab Bookings" value={labBookings.length} subtitle="Current records" icon={Microscope} />
        <DashboardCard
          title="Under Maintenance"
          value={Object.values(maintenanceRooms).filter(Boolean).length}
          subtitle="Frontend-only maintenance marks"
          icon={Wrench}
        />
        <DashboardCard title="Maintenance Alerts" value={maintenanceAlerts.length} subtitle="Potential scheduling conflicts" icon={AlertTriangle} />
      </div>

      <article className="dashboard-glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800">Lab Bookings</h3>
        <div className="mt-4">
          <DataTable
            loading={isLoading}
            rows={labBookings.slice(0, 15)}
            emptyText="No data available"
            columns={[
              { key: "roomNumber", label: "Lab" },
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
                key: "maintenance",
                label: "Maintenance",
                render: (row) => (
                  <StatusBadge
                    status={maintenanceRooms[row.roomNumber] ? "maintenance" : "active"}
                    label={maintenanceRooms[row.roomNumber] ? "Under Maintenance" : "Operational"}
                  />
                ),
              },
            ]}
          />
        </div>
      </article>

      <article className="dashboard-glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800">Maintenance Panel</h3>
        <p className="mt-1 text-sm text-slate-500">Frontend-only controls to simulate room maintenance flags.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {maintenanceRoomList.length > 0 ? (
            maintenanceRoomList.map((roomCode) => (
              <button
                key={roomCode}
                type="button"
                onClick={() => toggleMaintenance(roomCode)}
                className={maintenanceRooms[roomCode] ? "btn-secondary h-9 border-orange-200 bg-orange-100 text-orange-800" : "btn-primary h-9"}
              >
                {maintenanceRooms[roomCode] ? `Clear ${roomCode}` : `Mark ${roomCode}`}
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500">No data available</p>
          )}
        </div>
      </article>

      <article className="dashboard-glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-800">Alerts</h3>
        <p className="mt-1 text-sm text-slate-500">Warnings for labs booked while marked under maintenance.</p>
        <div className="mt-3 space-y-2">
          {maintenanceAlerts.length > 0 ? (
            maintenanceAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {alert.roomNumber} is under maintenance but has a {String(alert.status).toLowerCase()} booking on {alert.date} at {alert.startTime}-{alert.endTime}.
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No data available</p>
          )}
        </div>
      </article>
    </section>
  );
}
