import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getSystemStats } from "../services/adminApi";
import { createTicket } from "../../tickets/services/ticketApi";
import { createAnnouncement } from "../../notifications/services/notificationApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function AdminOverview() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState({ title: "", description: "", priority: "Medium", attachmentUrl: "" });
  const [announcement, setAnnouncement] = useState({ title: "", message: "" });

  useEffect(() => {
    getSystemStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
  }

  if (!stats) {
    return <section className="panel p-5 text-sm text-slate-500">Loading statistics...</section>;
  }

  async function onCreateTicket(event) {
    event.preventDefault();
    try {
      await createTicket(ticket);
      setTicket({ title: "", description: "", priority: "Medium", attachmentUrl: "" });
      toast.success("Incident ticket created.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function onCreateAnnouncement(event) {
    event.preventDefault();
    try {
      await createAnnouncement(announcement);
      setAnnouncement({ title: "", message: "" });
      toast.success("Announcement sent successfully.");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Total Users</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalUsers}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Total Courses</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalCourses || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Total Materials</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalMaterials || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Super Admins</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.roleCounts?.super_admin || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Students</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.roleCounts?.student || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Technicians</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.roleCounts?.technician || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Facilities</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalFacilities || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Bookings</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalBookings || 0}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Tickets</p><p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalTickets || 0}</p></div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Create Announcement</h3>
        <form className="mt-4 grid gap-3" onSubmit={onCreateAnnouncement}>
          <input
            className="input-field"
            placeholder="Announcement title"
            value={announcement.title}
            onChange={(e) => setAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <textarea
            className="input-field"
            placeholder="Announcement message"
            value={announcement.message}
            onChange={(e) => setAnnouncement((prev) => ({ ...prev, message: e.target.value }))}
            required
          />
          <div className="mt-1 flex justify-end">
            <button type="submit" className="btn-primary gap-2">
              <Plus size={16} />
              Send Announcement
            </button>
          </div>
        </form>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Create Incident Ticket</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onCreateTicket}>
          <input className="input-field" placeholder="Ticket title" value={ticket.title} onChange={(e) => setTicket((p) => ({ ...p, title: e.target.value }))} required />
          <select className="input-field" value={ticket.priority} onChange={(e) => setTicket((p) => ({ ...p, priority: e.target.value }))}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <textarea className="input-field md:col-span-2" placeholder="Describe the issue" value={ticket.description} onChange={(e) => setTicket((p) => ({ ...p, description: e.target.value }))} required />
          <input className="input-field md:col-span-2" placeholder="Attachment URL (.jpg/.png/.pdf...)" value={ticket.attachmentUrl} onChange={(e) => setTicket((p) => ({ ...p, attachmentUrl: e.target.value }))} />
          <div className="md:col-span-2 mt-1 flex justify-end">
            <button type="submit" className="btn-primary gap-2">
              <Plus size={16} />
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
