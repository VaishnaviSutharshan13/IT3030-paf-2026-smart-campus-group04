import React, { useEffect, useMemo, useState } from "react";
import { approveBooking, deleteBooking, getBookings, rejectBooking } from "../../bookings/services/bookingApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "approved") return "APPROVED";
  if (value === "rejected") return "REJECTED";
  if (value === "cancelled") return "CANCELLED";
  return "PENDING";
}

function getStatusBadgeClass(status) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700 border-rose-200";
  if (status === "CANCELLED") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

function getBookingId(booking) {
  return booking?._id || booking?.id;
}

export default function AdminBookingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [actionLoadingById, setActionLoadingById] = useState({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const bookingRows = await getBookings(true);
      setBookings(Array.isArray(bookingRows) ? bookingRows : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = String(searchText || "").trim().toLowerCase();
    return (bookings || []).filter((booking) => {
      const status = normalizeStatus(booking?.status);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (!query) return true;

      const haystack = [
        booking?.roomNumber,
        booking?.roomType,
        booking?.floor,
        booking?.purpose,
        booking?.date,
        booking?.startTime,
        booking?.endTime,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [bookings, searchText, statusFilter]);

  const stats = useMemo(() => {
    const safeRows = bookings || [];
    return {
      total: safeRows.length,
      pending: safeRows.filter((item) => normalizeStatus(item?.status) === "PENDING").length,
      approved: safeRows.filter((item) => normalizeStatus(item?.status) === "APPROVED").length,
      rejected: safeRows.filter((item) => normalizeStatus(item?.status) === "REJECTED").length,
      cancelled: safeRows.filter((item) => normalizeStatus(item?.status) === "CANCELLED").length,
    };
  }, [bookings]);

  async function onUpdate(bookingId, action, successMessage) {
    const booking = bookings.find((item) => String(item._id || item.id) === String(bookingId));
    const currentStatus = normalizeStatus(booking?.status);
    if (currentStatus !== "PENDING") {
      toast.info("Only pending bookings can be approved or rejected.");
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
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Failed to update booking status");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [bookingId]: false }));
    }
  }

  async function onDelete(bookingId) {
    const booking = bookings.find((item) => String(getBookingId(item)) === String(bookingId));
    const currentStatus = normalizeStatus(booking?.status);
    if (currentStatus !== "APPROVED") {
      toast.error("Only approved bookings can be deleted by admin.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this booking?")) {
      return;
    }

    setActionLoadingById((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((item) => String(item._id || item.id) !== String(bookingId)));
      toast.success("Booking deleted successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to delete booking");
    } finally {
      setActionLoadingById((prev) => ({ ...prev, [bookingId]: false }));
    }
  }

  return (
    <section className="space-y-5">
      <article className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Bookings Management</h2>
        <p className="mt-1 text-sm text-slate-500">Manage booking approvals, edits, and deletions from one place.</p>
        <p className="mt-1 text-xs text-slate-500">Rules: Pending bookings allow Approve/Reject, approved bookings allow Delete only, other statuses are read only.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase text-amber-700">Pending</p>
            <p className="text-xl font-semibold text-amber-800">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs uppercase text-emerald-700">Approved</p>
            <p className="text-xl font-semibold text-emerald-800">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs uppercase text-rose-700">Rejected</p>
            <p className="text-xl font-semibold text-rose-800">{stats.rejected}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-3">
            <p className="text-xs uppercase text-slate-600">Cancelled</p>
            <p className="text-xl font-semibold text-slate-800">{stats.cancelled}</p>
          </div>
        </div>
      </article>

      <article className="panel p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="input-field md:col-span-2"
            placeholder="Search room, purpose, status"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="flex items-center text-sm text-slate-500">{filteredBookings.length} results</div>
        </div>

        {loading ? <p className="mt-4 text-sm text-slate-500">Loading bookings...</p> : null}
        {!loading && filteredBookings.length === 0 ? <p className="mt-4 text-sm text-slate-500">No bookings found.</p> : null}

        <div className="mt-4 space-y-3">
          {filteredBookings.map((booking) => {
            const bookingId = getBookingId(booking);
            const currentStatus = normalizeStatus(booking.status);
            const isPending = currentStatus === "PENDING";
            const isApproved = currentStatus === "APPROVED";
            const rowBusy = Boolean(actionLoadingById[bookingId]);

            return (
              <article key={bookingId} className="rounded-xl border border-emerald-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{booking.floor} • {booking.roomNumber} ({booking.roomType})</p>
                    <p className="text-xs text-slate-500">{booking.date} • {booking.startTime}-{booking.endTime}</p>
                    <p className="mt-1 text-xs text-slate-600">{booking.purpose || booking.notes || "No purpose provided."}</p>
                  </div>

                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(currentStatus)}`}>
                    {currentStatus}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="btn-secondary min-w-28"
                        disabled={rowBusy}
                        onClick={() => onUpdate(bookingId, "approve", "Booking approved successfully")}
                      >
                        {rowBusy ? "Working..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary min-w-28"
                        disabled={rowBusy}
                        onClick={() => onUpdate(bookingId, "reject", "Booking rejected successfully")}
                      >
                        {rowBusy ? "Working..." : "Reject"}
                      </button>
                    </>
                  ) : null}

                  {isApproved ? (
                    <button
                      type="button"
                      className="btn-secondary min-w-24"
                      disabled={rowBusy}
                      onClick={() => onDelete(bookingId)}
                    >
                      {rowBusy ? "Deleting..." : "Delete"}
                    </button>
                  ) : null}

                  {!isPending && !isApproved ? (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Read only
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
