import React from "react";
import { useEffect, useState } from "react";
import { getBookings } from "../../bookings/services/bookingApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function TechnicianTasksPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  async function loadBookings() {
    setLoading(true);
    try {
      const rows = await getBookings();
      setBookings((rows || []).filter((row) => ["PENDING", "APPROVED"].includes(String(row.status || "").toUpperCase())));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Lab Maintenance Schedule</h2>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading tasks...</p> : null}
      {!loading && bookings.length === 0 ? <p className="mt-3 text-sm text-slate-500">No bookings yet.</p> : null}

      <div className="mt-4 space-y-3">
        {bookings.map((booking) => (
          <article key={booking._id || booking.id} className="rounded-xl border border-emerald-100 p-4">
            <p className="text-sm font-semibold text-slate-800">{booking.floor} • {booking.roomNumber} ({booking.roomType})</p>
            <p className="text-xs text-slate-500">{booking.date || "TBD"} • {booking.startTime || "--:--"}-{booking.endTime || "--:--"}</p>
            <p className="text-xs text-slate-500">{booking.department} • {booking.course || "No course linked"}</p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-campus-700">{booking.status}</span>
            <p className="mt-2 text-xs text-slate-500">Maintenance note: Prepare lab systems and check smart devices before the class starts.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
