import React, { useEffect, useState } from "react";
import { approveBooking, getBookings, rejectBooking } from "../../bookings/services/bookingApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "approved") return "APPROVED";
  if (value === "rejected") return "REJECTED";
  return "PENDING";
}

function getStatusBadgeClass(status) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export default function AdminBookingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [actionLoadingById, setActionLoadingById] = useState({});

  async function loadData() {
    setLoading(true);
    try {
      const bookingRows = await getBookings(true);
      setBookings(bookingRows || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onUpdate(bookingId, action, successMessage) {
    const booking = bookings.find((item) => String(item._id || item.id) === String(bookingId));
    const currentStatus = normalizeStatus(booking?.status);
    if (currentStatus !== "PENDING") {
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const updated = action === "approve"
        ? await approveBooking(bookingId)
        : await rejectBooking(bookingId, "Rejected by administrator");

      setBookings((prev) =>
        prev.map((item) =>
          String(item._id || item.id) === String(bookingId)
            ? { ...item, ...updated, status: updated?.status || item.status }
            : item
        )
      );

      toast.success(successMessage);

      // Optional sync pass to avoid stale UI if backend mutates additional fields.
      loadData();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [bookingId]: false }));
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Lecturer Booking Approvals</h2>
      <p className="mt-1 text-sm text-slate-500">Approve or reject lecturer classroom bookings and assign technicians when needed.</p>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading bookings...</p> : null}
      {!loading && bookings.length === 0 ? <p className="mt-4 text-sm text-slate-500">No lecturer booking requests are pending review.</p> : null}

      <div className="mt-4 space-y-3">
        {bookings.map((booking) => (
          <article key={booking._id || booking.id} className="rounded-xl border border-emerald-100 p-4 transition-all duration-300">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{booking.floor} • {booking.roomNumber} ({booking.roomType})</p>
                <p className="text-xs text-slate-500">{booking.department} • {booking.course || "No course"}</p>
                <p className="text-xs text-slate-500">{booking.date} • {booking.startTime}-{booking.endTime}</p>
                <p className="mt-1 text-xs text-slate-600">{booking.purpose || booking.notes || "No purpose provided."}</p>
              </div>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${getStatusBadgeClass(normalizeStatus(booking.status))}`}
              >
                {normalizeStatus(booking.status)}
              </span>
            </div>

            {normalizeStatus(booking.status) === "PENDING" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary min-w-28"
                  disabled={Boolean(actionLoadingById[booking._id || booking.id])}
                  onClick={() => onUpdate(booking._id || booking.id, "approve", "Booking Approved Successfully")}
                >
                  {actionLoadingById[booking._id || booking.id] ? "Approving..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="btn-secondary min-w-28"
                  disabled={Boolean(actionLoadingById[booking._id || booking.id])}
                  onClick={() => onUpdate(booking._id || booking.id, "reject", "Booking Rejected Successfully")}
                >
                  {actionLoadingById[booking._id || booking.id] ? "Updating..." : "Reject"}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
