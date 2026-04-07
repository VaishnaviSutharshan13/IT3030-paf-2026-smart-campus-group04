import React, { useEffect, useState } from "react";
import { getTickets, updateTicket } from "../../tickets/services/ticketApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function TechnicianTicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [notes, setNotes] = useState({});

  async function loadTickets() {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function onStatusChange(ticketId, status) {
    try {
      await updateTicket(ticketId, { status, technicianNotes: notes[ticketId] || "" });
      toast.success("Ticket updated.");
      loadTickets();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Assigned Tickets</h2>
      {tickets.length === 0 ? <p className="mt-3 text-sm text-slate-500">No incident tickets assigned yet.</p> : null}
      <div className="mt-4 space-y-3">
        {tickets.map((ticket) => (
          <article key={ticket._id || ticket.id} className="rounded-xl border border-emerald-100 p-4">
            <p className="text-sm font-semibold text-slate-800">{ticket.title}</p>
            <p className="mt-1 text-xs text-slate-500">Priority: {ticket.priority}</p>
            <p className="mt-1 text-sm text-slate-600">{ticket.description}</p>
            <textarea
              className="input-field mt-3"
              placeholder="Technician notes"
              value={notes[ticket._id || ticket.id] || ticket.technicianNotes || ""}
              onChange={(e) => setNotes((prev) => ({ ...prev, [ticket._id || ticket.id]: e.target.value }))}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {["Open", "In Progress", "Resolved"].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${ticket.status === status ? "bg-campus-600 text-white" : "bg-emerald-50 text-campus-700"}`}
                  onClick={() => onStatusChange(ticket._id || ticket.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
            {ticket.attachmentUrl ? (
              <a className="mt-3 inline-block text-xs font-semibold text-campus-700" href={ticket.attachmentUrl} target="_blank" rel="noreferrer">
                View Attachment
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
