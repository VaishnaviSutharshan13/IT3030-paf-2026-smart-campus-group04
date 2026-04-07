import React from "react";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getCourses } from "../../courses/services/courseApi";
import { getMaterials } from "../../materials/services/materialApi";
import { getStudents } from "../../students/services/studentApi";
import { getBookings } from "../../bookings/services/bookingApi";
import { createTicket } from "../../tickets/services/ticketApi";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState({ courses: 0, materials: 0, students: 0, bookings: 0, pending: 0, approved: 0 });
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState({ title: "", description: "", priority: "Medium", attachmentUrl: "" });
  const [attachmentName, setAttachmentName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [courses, materials, students, bookings] = await Promise.all([
          getCourses(),
          getMaterials(),
          getStudents(),
          getBookings(),
        ]);
        setData({
          courses: courses.length,
          materials: materials.length,
          students: students.length,
          bookings: bookings.length,
          pending: bookings.filter((item) => item.status === "Pending").length,
          approved: bookings.filter((item) => item.status === "Approved").length,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  if (error) {
    return <section className="panel p-5 text-sm text-rose-600">{error}</section>;
  }

  async function onCreateTicket(event) {
    event.preventDefault();
    try {
      await createTicket(ticket);
      setTicket({ title: "", description: "", priority: "Medium", attachmentUrl: "" });
      setAttachmentName("");
      toast.success("Incident ticket created.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function onAttachmentChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported attachment type.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Attachment must be 5MB or less.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTicket((prev) => ({ ...prev, attachmentUrl: String(reader.result || "") }));
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Managed Courses</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{data.courses}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Materials</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{data.materials}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Students</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{data.students}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Total Bookings</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{data.bookings}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Pending Requests</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{data.pending}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-500">Approved Bookings</p>
          <p className="mt-2 text-3xl font-semibold text-campus-700">{data.approved}</p>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Report a Technical Incident</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onCreateTicket}>
          <input className="input-field" placeholder="Ticket title" value={ticket.title} onChange={(e) => setTicket((p) => ({ ...p, title: e.target.value }))} required />
          <select className="input-field" value={ticket.priority} onChange={(e) => setTicket((p) => ({ ...p, priority: e.target.value }))}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <textarea className="input-field md:col-span-2" placeholder="Describe the issue" value={ticket.description} onChange={(e) => setTicket((p) => ({ ...p, description: e.target.value }))} required />
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label htmlFor="lecturer-ticket-attachment" className="text-sm font-medium text-slate-700">
              Attachment (optional)
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label
                htmlFor="lecturer-ticket-attachment"
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Upload File
              </label>
              <input
                id="lecturer-ticket-attachment"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={onAttachmentChange}
              />
              {attachmentName ? <span className="text-xs text-slate-600">{attachmentName}</span> : <span className="text-xs text-slate-500">No file selected</span>}
            </div>
          </div>
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
