import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../../../core/layouts/AppShell";
import SectionCard from "../../../shared/components/SectionCard";
import {
  approveBooking,
  cancelBooking,
  createBooking,
  deleteBooking,
  fetchBookings,
} from "../services/bookingService";
import { useAuth } from "../../auth/context/AuthContext";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const EMPTY_FORM = {
  resourceId: "",
  startAt: "",
  endAt: "",
  purpose: "",
};

export default function BookingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const isAdmin = useMemo(() => (user?.roles || []).includes("ADMIN"), [user?.roles]);

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function onCreateBooking(event) {
    event.preventDefault();
    if (!form.resourceId || !form.startAt || !form.endAt || !form.purpose.trim()) {
      toast.error("All booking fields are required.");
      return;
    }

    try {
      await createBooking({
        resourceId: Number(form.resourceId),
        startAt: form.startAt,
        endAt: form.endAt,
        purpose: form.purpose,
      });
      toast.success("Booking created successfully.");
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadBookings();
    } catch (createError) {
      toast.error(createError.message || "Failed to create booking.");
    }
  }

  async function onApprove(bookingId) {
    try {
      await approveBooking(bookingId);
      toast.success("Booking approved.");
      await loadBookings();
    } catch (approveError) {
      toast.error(approveError.message || "Failed to approve booking.");
    }
  }

  async function onCancel(bookingId) {
    try {
      await cancelBooking(bookingId);
      toast.info("Booking cancelled.");
      await loadBookings();
    } catch (cancelError) {
      toast.error(cancelError.message || "Failed to cancel booking.");
    }
  }

  async function onDelete(bookingId) {
    try {
      await deleteBooking(bookingId);
      toast.info("Booking deleted.");
      await loadBookings();
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete booking.");
    }
  }

  return (
    <AppShell title="Bookings" subtitle="Manage room, lab, and equipment reservations">
      <SectionCard title="Bookings Actions">
        <div className="toolbar-grid toolbar-grid-compact">
          <button type="button" className="btn btn-accent" onClick={() => setShowModal(true)}>
            Create Booking
          </button>
          <button type="button" className="btn btn-ghost" onClick={loadBookings}>
            Refresh
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Bookings Table">
        {loading ? <div className="loading">Loading bookings...</div> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Resource</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.resourceId}</td>
                  <td>{new Date(booking.startAt).toLocaleString()}</td>
                  <td>{new Date(booking.endAt).toLocaleString()}</td>
                  <td>
                    <span
                      className={`status ${
                        booking.status === "APPROVED"
                          ? "success"
                          : booking.status === "PENDING"
                            ? "warning"
                            : "danger"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td>{booking.purpose}</td>
                  <td>
                    <div className="action-row">
                      {isAdmin && booking.status === "PENDING" ? (
                        <button type="button" className="btn btn-accent" onClick={() => onApprove(booking.id)}>
                          Approve
                        </button>
                      ) : null}
                      <button type="button" className="btn btn-ghost" onClick={() => onCancel(booking.id)}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => onDelete(booking.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showModal ? (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={(event) => event.stopPropagation()}>
            <h3>Create Booking</h3>
            <form className="form-grid" onSubmit={onCreateBooking}>
              <input
                className="input"
                placeholder="Resource ID"
                type="number"
                value={form.resourceId}
                onChange={(event) => setForm((current) => ({ ...current, resourceId: event.target.value }))}
              />
              <input
                className="input"
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
              />
              <input
                className="input"
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
              />
              <input
                className="input"
                placeholder="Purpose"
                value={form.purpose}
                onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
