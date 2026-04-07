import React, { useEffect, useState } from "react";
import AppShell from "../../../core/layouts/AppShell";
import SectionCard from "../../../shared/components/SectionCard";
import {
  closeTicket,
  createTicket,
  deleteTicket,
  fetchTickets,
  resolveTicket,
  startTicketProgress,
} from "../services/ticketService";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "MEDIUM",
  resourceId: "",
};

export default function TicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await fetchTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function onCreate(event) {
    event.preventDefault();
    try {
      await createTicket({
        ...form,
        resourceId: form.resourceId ? Number(form.resourceId) : null,
      });
      setForm(EMPTY_FORM);
      toast.success("Ticket created.");
      await loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to create ticket.");
    }
  }

  async function transition(ticketId, action) {
    try {
      await action(ticketId);
      toast.success("Ticket updated.");
      await loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to update ticket.");
    }
  }

  async function onDelete(ticketId) {
    try {
      await deleteTicket(ticketId);
      toast.info("Ticket deleted.");
      await loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to delete ticket.");
    }
  }

  return (
    <AppShell title="Tickets" subtitle="Track incidents and maintenance workflow">
      <div className="panel-grid">
        <SectionCard title="Create Ticket">
          <form className="form-grid" onSubmit={onCreate}>
            <input className="input" placeholder="Issue title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <select className="input" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <input className="input" placeholder="Resource ID (optional)" value={form.resourceId} onChange={(event) => setForm((current) => ({ ...current, resourceId: event.target.value }))} />
            <textarea className="input textarea" placeholder="Describe the incident" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <button type="submit" className="btn btn-accent">Create Ticket</button>
          </form>
        </SectionCard>

        <SectionCard title="Ticket Queue">
          {loading ? <div className="loading">Loading tickets...</div> : null}
          <div className="list">
            {tickets.map((ticket) => (
              <div className="list-item" key={ticket.id}>
                <div>
                  <strong>{ticket.title}</strong>
                  <p className="muted-text">Priority: {ticket.priority} | Status: {ticket.status}</p>
                </div>
                <div className="action-row">
                  <button type="button" className="btn btn-ghost" onClick={() => transition(ticket.id, startTicketProgress)}>Start</button>
                  <button type="button" className="btn btn-accent" onClick={() => transition(ticket.id, resolveTicket)}>Resolve</button>
                  <button type="button" className="btn btn-ghost" onClick={() => transition(ticket.id, closeTicket)}>Close</button>
                  <button type="button" className="btn btn-danger" onClick={() => onDelete(ticket.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
