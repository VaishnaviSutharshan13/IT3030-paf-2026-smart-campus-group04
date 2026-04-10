import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Plus, CalendarClock, Bell, Wrench, Ticket } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { getBookings } from "../../bookings/services/bookingApi";
import { fetchResources } from "../../resources/services/resourceService";
import { getNotifications } from "../../notifications/services/notificationApi";
import { listIncidents, reportIncident } from "../../incidents/services/incidentApi";
import { createTicket, getTickets } from "../../tickets/services/ticketApi";
import StatusBadge from "../../../components/dashboard/StatusBadge";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

function toLocationType(value) {
  const upper = String(value || "").trim().toUpperCase();
  if (!upper) return "CLASSROOM";
  return upper.replaceAll(" ", "_");
}

function parseLocationFromDescription(description = "") {
  const text = String(description || "");
  const marker = text.match(/Location:\s*([^\n]+)/i);
  if (!marker) {
    return { floor: "", roomType: "" };
  }

  const [floor, roomType] = marker[1].split("-").map((part) => String(part || "").trim());
  return {
    floor: floor || "",
    roomType: roomType || "",
  };
}

function mapTicketToIncident(ticket) {
  const parsed = parseLocationFromDescription(ticket.description);
  const inferredRoomType = parsed.roomType || "Classroom";

  return {
    id: ticket.id,
    reportedBy: ticket.reporterUserId,
    locationType: toLocationType(inferredRoomType),
    floor: parsed.floor,
    issueType: ticket.title,
    description: ticket.description,
    priority: String(ticket.priority || "MEDIUM").toUpperCase(),
    status: String(ticket.status || "OPEN").toUpperCase(),
    createdAt: ticket.incidentAt,
  };
}

export default function Dashboard() {
  const toast = useToast();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    incidents: [],
    resources: [],
    notifications: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [incidentFilters, setIncidentFilters] = useState({ status: "", priority: "", locationType: "" });
  const [incident, setIncident] = useState({
    roomType: "SMART_CLASSROOM",
    floor: "Floor 1",
    issueType: "COMPUTER",
    description: "",
    priority: "MEDIUM",
  });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  async function fetchIncidentsWithFallback() {
    try {
      const incidentRows = await listIncidents();
      return Array.isArray(incidentRows) ? incidentRows : [];
    } catch {
      const ticketRows = await getTickets();
      const mapped = (Array.isArray(ticketRows) ? ticketRows : []).map(mapTicketToIncident);
      if (user?.id) {
        return mapped.filter((row) => Number(row.reportedBy) === Number(user.id));
      }
      return mapped;
    }
  }

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          getBookings(),
          fetchIncidentsWithFallback(),
          fetchResources(),
          getNotifications(),
        ]);

        const [bookingsResult, ticketsResult, resourcesResult, notificationsResult] = results;

        const bookings = bookingsResult.status === "fulfilled" && Array.isArray(bookingsResult.value)
          ? bookingsResult.value
          : [];
        const incidents = ticketsResult.status === "fulfilled" && Array.isArray(ticketsResult.value)
          ? ticketsResult.value
          : [];
        const resources = resourcesResult.status === "fulfilled" && Array.isArray(resourcesResult.value)
          ? resourcesResult.value
          : [];
        const notifications = notificationsResult.status === "fulfilled" && Array.isArray(notificationsResult.value)
          ? notificationsResult.value
          : [];

        const failed = results.filter((result) => result.status === "rejected").length;
        if (failed > 0) {
          toast.error(`Loaded dashboard with ${failed} unavailable data source${failed > 1 ? "s" : ""}.`);
        }

        setDashboardData({
          bookings,
          incidents,
          resources,
          notifications,
        });
      } catch (err) {
        setError(err.message || "Failed to load lecturer dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [toast]);

  const stats = useMemo(() => {
    const bookings = dashboardData.bookings || [];
    const incidents = dashboardData.incidents || [];
    const resources = dashboardData.resources || [];
    const notifications = dashboardData.notifications || [];

    const pendingBookings = bookings.filter((item) => String(item.status || "").toUpperCase() === "PENDING").length;
    const approvedBookings = bookings.filter((item) => String(item.status || "").toUpperCase() === "APPROVED").length;

    const openTickets = incidents.filter((item) => String(item.status || "").toUpperCase() === "PENDING").length;
    const inProgressTickets = incidents.filter((item) => String(item.status || "").toUpperCase() === "IN_PROGRESS").length;

    const activeResources = resources.filter((item) => Boolean(item.active)).length;
    const unreadNotifications = notifications.filter((item) => !item.read).length;

    return {
      totalBookings: bookings.length,
      pendingBookings,
      approvedBookings,
      totalTickets: incidents.length,
      openTickets,
      inProgressTickets,
      activeResources,
      totalResources: resources.length,
      unreadNotifications,
    };
  }, [dashboardData]);

  const filteredIncidents = useMemo(() => {
    const rows = dashboardData.incidents || [];
    return rows.filter((row) => {
      if (incidentFilters.status && String(row.status || "").toUpperCase() !== incidentFilters.status) return false;
      if (incidentFilters.priority && String(row.priority || "").toUpperCase() !== incidentFilters.priority) return false;
      if (incidentFilters.locationType && String(row.locationType || "").toUpperCase() !== incidentFilters.locationType) return false;
      return true;
    });
  }, [dashboardData.incidents, incidentFilters]);

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return [...(dashboardData.bookings || [])]
      .filter((booking) => booking?.startAt && new Date(booking.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [dashboardData.bookings]);

  const recentNotifications = useMemo(() => {
    return [...(dashboardData.notifications || [])]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [dashboardData.notifications]);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
  }

  if (isLoading) {
    return <section className="panel p-5 text-sm text-slate-500">Loading lecturer dashboard...</section>;
  }

  async function onCreateTicket(event) {
    event.preventDefault();

    const payload = {
      issueType: String(incident.issueType || "").trim(),
      description: String(incident.description || "").trim(),
      priority: String(incident.priority || "").trim(),
      floor: String(incident.floor || "").trim(),
      roomType: String(incident.roomType || "").trim(),
      date: new Date().toISOString(),
    };

    const hasInvalidUnknownLocation = /unknown/i.test(payload.floor) || /unknown/i.test(payload.roomType);
    if (!payload.issueType || !payload.description || !payload.priority || !payload.floor || !payload.roomType || hasInvalidUnknownLocation) {
      toast.error("Please fill all required fields");
      return;
    }

    console.log("Submitting ticket:", payload);

    setSubmittingIncident(true);
    try {
      try {
        await reportIncident(payload);
      } catch {
        const fallbackDescription = `${payload.description}\nLocation: ${payload.floor} - ${payload.roomType}`;
        await createTicket({
          title: payload.issueType,
          description: fallbackDescription,
          priority: payload.priority,
          incidentAt: payload.date,
        });
      }

      toast.success("✅ Issue reported successfully");

      setIncident({
        roomType: "SMART_CLASSROOM",
        floor: "Floor 1",
        issueType: "COMPUTER",
        description: "",
        priority: "MEDIUM",
      });

      const latest = await fetchIncidentsWithFallback();
      setDashboardData((prev) => ({ ...prev, incidents: Array.isArray(latest) ? latest : [] }));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmittingIncident(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="panel overflow-hidden p-5">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Lecturer Hub</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-800">Teaching Operations Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Track bookings, technical issues, and campus signals from a single command view.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Total Bookings</p>
            <CalendarClock size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats.totalBookings}</p>
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Open Tickets</p>
            <Ticket size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats.openTickets}</p>
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Active Resources</p>
            <Wrench size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats.activeResources}</p>
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Unread Alerts</p>
            <Bell size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{stats.unreadNotifications}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-5">
          <h3 className="text-base font-semibold text-slate-800">Booking Pipeline</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">{stats.pendingBookings}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Approved</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{stats.approvedBookings}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs uppercase tracking-wide text-sky-700">In Progress Tickets</p>
              <p className="mt-1 text-2xl font-semibold text-sky-800">{stats.inProgressTickets}</p>
            </div>
          </div>

          <h4 className="mt-5 text-sm font-semibold text-slate-700">Upcoming Bookings</h4>
          <div className="mt-3 space-y-2">
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming bookings found.</p>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">#{booking.id} - Resource {booking.resourceId}</p>
                    <span className="text-xs text-slate-500">{String(booking.status || "").toUpperCase()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{new Date(booking.startAt).toLocaleString()} to {new Date(booking.endAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">{booking.purpose}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-base font-semibold text-slate-800">Recent Notifications</h3>
          <div className="mt-3 space-y-2">
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications available.</p>
            ) : (
              recentNotifications.map((item) => (
                <article key={item.id} className="rounded-xl border border-emerald-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    {!item.read ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-700">New</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Report a Technical Incident</h3>
        <button type="button" className="btn-secondary mt-3" onClick={() => document.getElementById("lecturer-incident-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <Plus size={16} />
          Report Issue
        </button>

        <form id="lecturer-incident-form" className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onCreateTicket}>
          <select className="input-field" value={incident.roomType} onChange={(e) => setIncident((p) => ({ ...p, roomType: e.target.value }))}>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="SMART_CLASSROOM">Smart Classroom</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="LAB">Lab</option>
          </select>
          <input className="input-field" placeholder="Floor (e.g. Floor 2)" value={incident.floor} onChange={(e) => setIncident((p) => ({ ...p, floor: e.target.value }))} required />
          <select className="input-field" value={incident.issueType} onChange={(e) => setIncident((p) => ({ ...p, issueType: e.target.value }))}>
            <option value="COMPUTER">Computer</option>
            <option value="AC">AC</option>
            <option value="LIGHTS">Lights</option>
            <option value="PROJECTOR">Projector</option>
            <option value="NETWORK">Network</option>
            <option value="OTHER">Other</option>
          </select>
          <select className="input-field" value={incident.priority} onChange={(e) => setIncident((p) => ({ ...p, priority: e.target.value }))}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <textarea className="input-field md:col-span-2" placeholder="Describe the issue" value={incident.description} onChange={(e) => setIncident((p) => ({ ...p, description: e.target.value }))} required />
          <div className="md:col-span-2 mt-1 flex justify-end">
            <button type="submit" className="btn-primary gap-2" disabled={submittingIncident}>
              <Plus size={16} />
              {submittingIncident ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">My Reported Incidents</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="input-field" value={incidentFilters.status} onChange={(e) => setIncidentFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select className="input-field" value={incidentFilters.priority} onChange={(e) => setIncidentFilters((prev) => ({ ...prev, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className="input-field" value={incidentFilters.locationType} onChange={(e) => setIncidentFilters((prev) => ({ ...prev, locationType: e.target.value }))}>
            <option value="">All Locations</option>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="SMART_CLASSROOM">Smart Classroom</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="LAB">Lab</option>
          </select>
          <div className="flex items-center text-sm text-slate-500">{filteredIncidents.length} incidents</div>
        </div>

        <div className="mt-3 space-y-2">
          {filteredIncidents.length === 0 ? <p className="text-sm text-slate-500">No incidents yet. Start by reporting an issue.</p> : null}
          {filteredIncidents.map((row) => (
            <article key={row.id} className="rounded-xl border border-emerald-100 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{String(row.locationType || "CLASSROOM").replaceAll("_", " ")} - {row.issueType}</p>
                <StatusBadge status={row.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Priority: {row.priority} | {row.floor || "Location not specified"} - {String(row.locationType || "CLASSROOM").replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm text-slate-600">{row.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
