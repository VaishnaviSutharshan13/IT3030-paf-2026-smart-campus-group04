import React, { useEffect, useState } from "react";
import { getBookings } from "../../bookings/services/bookingApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function StudentBookingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  async function loadData() {
    setLoading(true);
    try {
      const bookingRows = await getBookings();
      setBookings(bookingRows);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">University Booking Schedule</h2>
      <p className="mt-1 text-sm text-slate-500">Students can view approved lecture hall and classroom schedules.</p>

      {loading ? <p className="mt-3 text-sm text-slate-500">Loading bookings...</p> : null}
      {!loading && bookings.length === 0 ? <p className="mt-3 text-sm text-slate-500">No bookings yet.</p> : null}

      <div className="mt-4 space-y-2">
        {bookings.map((booking) => (
          <article key={booking._id || booking.id} className="rounded-xl border border-emerald-100 p-3">
            <p className="text-sm font-semibold text-slate-800">{booking.floor} • {booking.roomNumber} ({booking.roomType})</p>
            <p className="text-xs text-slate-500">{booking.department} • {booking.course}</p>
            <p className="text-xs text-slate-500">{booking.date} • {booking.startTime}-{booking.endTime}</p>
            <p className="mt-1 text-xs font-semibold text-campus-700">{booking.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
