import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getCourses } from "../../courses/services/courseApi";
import { createTicket } from "../../tickets/services/ticketApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function StudentOverview() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState({ title: "", description: "", priority: "Medium", attachmentUrl: "" });

  useEffect(() => {
    getCourses().then(setCourses).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
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

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Enrolled Courses</p><p className="mt-2 text-3xl font-semibold text-campus-700">{courses.length}</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Materials</p><p className="mt-2 text-3xl font-semibold text-campus-700">Live</p></div>
        <div className="panel p-5"><p className="text-xs uppercase text-emerald-500">Assignment Status</p><p className="mt-2 text-3xl font-semibold text-campus-700">Tracked</p></div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Report an Incident</h3>
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
