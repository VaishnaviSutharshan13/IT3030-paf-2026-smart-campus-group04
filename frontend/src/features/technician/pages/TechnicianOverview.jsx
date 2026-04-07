import React, { useEffect, useState } from "react";
import { getTickets } from "../../tickets/services/ticketApi";

export default function TechnicianOverview() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTickets().then(setTickets).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
  }

  const pending = tickets.filter((t) => t.status === "Open" || t.status === "Pending").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const completed = tickets.filter((t) => t.status === "Resolved" || t.status === "Completed").length;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Open</p><p className="mt-2 text-3xl font-semibold text-campus-700">{pending}</p></div>
      <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">In Progress</p><p className="mt-2 text-3xl font-semibold text-campus-700">{inProgress}</p></div>
      <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Resolved</p><p className="mt-2 text-3xl font-semibold text-campus-700">{completed}</p></div>
    </section>
  );
}
