import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, DoorOpen, MonitorSpeaker, FlaskConical } from "lucide-react";
import {
  createLecturerBooking,
  getAvailableSlots,
  getBookingSchedule,
  getBookings,
} from "../../bookings/services/bookingApi";
import { fetchResources } from "../../resources/services/resourceService";
import {
  DEPARTMENT_COURSES,
  FLOORS,
  getRoomTypesByFloor,
} from "../../bookings/constants/universityBookingData";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const initialForm = {
  floor: "",
  roomType: "",
  roomNumber: "",
  department: "IT",
  course: "",
  date: "",
  startTime: "08:00",
  endTime: "10:00",
  purpose: "",
  notes: "",
};

function getBadgeClass(status) {
  if (status === "Approved") return "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  if (status === "Completed") return "bg-blue-100 text-blue-700";
  if (status === "In Progress") return "bg-amber-100 text-amber-700";
  if (status === "Ready") return "bg-cyan-100 text-cyan-700";
  return "bg-slate-100 text-slate-700";
}

function getWeekDates(baseDate) {
  const current = baseDate ? new Date(baseDate) : new Date();
  const day = current.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + mondayOffset);

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return {
      key: `${yyyy}-${mm}-${dd}`,
      label: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    };
  });
}

function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentTimeString() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toMinutes(time) {
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function hasOverlap(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function formatTimeLabel(time) {
  if (!time || !/^\d{2}:\d{2}$/.test(String(time))) return time;
  const [hh, mm] = String(time).split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

function toTimeString(minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function mergeBookedRanges(slots) {
  const normalized = (slots || [])
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      start: toMinutes(slot.startTime),
      end: toMinutes(slot.endTime),
    }))
    .filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end) && slot.end > slot.start)
    .sort((a, b) => a.start - b.start);

  if (normalized.length === 0) {
    return [];
  }

  const merged = [normalized[0]];
  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      last.endTime = toTimeString(last.end);
    } else {
      merged.push(current);
    }
  }

  return merged.map((slot, index) => ({
    id: `booked-range-${index}-${slot.start}-${slot.end}`,
    startTime: toTimeString(slot.start),
    endTime: toTimeString(slot.end),
  }));
}

function calculateAvailableRanges(bookedRanges, workdayStart = 8 * 60, workdayEnd = 20 * 60) {
  const ranges = [];
  let cursor = workdayStart;

  for (const slot of bookedRanges) {
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      continue;
    }

    if (start > cursor) {
      ranges.push({ startTime: toTimeString(cursor), endTime: toTimeString(start) });
    }

    cursor = Math.max(cursor, end);
  }

  if (cursor < workdayEnd) {
    ranges.push({ startTime: toTimeString(cursor), endTime: toTimeString(workdayEnd) });
  }

  return ranges;
}

function buildTimeBreakdown(bookedRanges, availableRanges) {
  return [
    ...(bookedRanges || []).map((slot, index) => ({
      id: `timeline-booked-${index}-${slot.startTime}-${slot.endTime}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: "booked",
    })),
    ...(availableRanges || []).map((slot, index) => ({
      id: `timeline-free-${index}-${slot.startTime}-${slot.endTime}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: "available",
    })),
  ].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

function deriveFloorLabel(resource) {
  const code = String(resource?.code || "");
  const location = String(resource?.location || "");
  const locationMatch = location.match(/(?:floor|level)\s*(\d+)/i);
  const codeMatch = code.match(/(\d)/);
  const level = locationMatch?.[1] || codeMatch?.[1];
  return level ? `Floor ${level}` : "Floor 1";
}

function deriveRoomTypeLabel(resource) {
  const typeCode = String(resource?.typeCode || "").toUpperCase();
  if (typeCode === "LAB") return "Lab";
  if (typeCode === "EQUIP") return "Smart Classroom";
  if (typeCode === "ROOM") return "Lecture Hall";
  return "Classroom";
}

function normalizeResourceRows(resourcesResponse) {
  if (Array.isArray(resourcesResponse)) return resourcesResponse;
  if (Array.isArray(resourcesResponse?.items)) return resourcesResponse.items;
  if (Array.isArray(resourcesResponse?.content)) return resourcesResponse.content;
  return [];
}

function generateAutoRoomNumber(floor, roomType) {
  const floorNo = String(floor || "").match(/\d+/)?.[0] || "1";
  const prefixMap = {
    "Lecture Hall": "LH",
    "Smart Classroom": "SC",
    Classroom: "CR",
    Lab: "LAB",
  };

  const prefix = prefixMap[roomType] || "CR";
  return `${prefix}${floorNo}01`;
}

function normalizeRoomCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function buildRoomAliases(code) {
  const aliases = new Set([normalizeRoomCode(code)]);
  const upper = String(code || "").toUpperCase();
  const labBMatch = upper.match(/^LAB[-_ ]?B(\d)$/);
  if (labBMatch) {
    aliases.add(normalizeRoomCode(`LAB10${labBMatch[1]}`));
  }
  return aliases;
}

export default function LecturerBookingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [resourceCatalog, setResourceCatalog] = useState([]);
  const [resourceCatalogLoading, setResourceCatalogLoading] = useState(false);
  const [scheduleBookings, setScheduleBookings] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [selectedCriteriaLabel, setSelectedCriteriaLabel] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [statusFilter, setStatusFilter] = useState("All");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const todayStr = getTodayDateString();
  const nowTimeStr = getCurrentTimeString();
  const nowMinutes = toMinutes(nowTimeStr);
  const isTodaySelected = form.date === todayStr;
  const dateError = form.date && form.date < todayStr ? "You cannot book a past date" : "";
  const startPastTimeError =
    isTodaySelected && form.startTime && Number.isFinite(toMinutes(form.startTime)) && toMinutes(form.startTime) <= nowMinutes
      ? "Start time must be in the future for today"
      : "";
  const endPastTimeError =
    isTodaySelected && form.endTime && Number.isFinite(toMinutes(form.endTime)) && toMinutes(form.endTime) <= nowMinutes
      ? "End time must be in the future for today"
      : "";
  const timeOrderError =
    form.startTime && form.endTime && form.startTime >= form.endTime
      ? "End time must be after start time"
      : "";
  const overlapError =
    form.startTime &&
    form.endTime &&
    bookedSlots.some((slot) =>
      hasOverlap(
        toMinutes(form.startTime),
        toMinutes(form.endTime),
        toMinutes(slot.startTime),
        toMinutes(slot.endTime)
      )
    )
      ? "Selected time slot is already booked. Please choose another time."
      : "";

  const bookedRanges = useMemo(() => mergeBookedRanges(bookedSlots), [bookedSlots]);
  const availableRanges = useMemo(() => calculateAvailableRanges(bookedRanges), [bookedRanges]);
  const timeBreakdown = useMemo(
    () => buildTimeBreakdown(bookedRanges, availableRanges),
    [bookedRanges, availableRanges]
  );

  const floorOptions = FLOORS;

  const resourceLookupByAlias = useMemo(() => {
    const lookup = new Map();
    for (const resource of resourceCatalog) {
      for (const alias of buildRoomAliases(resource.roomNumber)) {
        lookup.set(alias, resource);
      }
    }
    return lookup;
  }, [resourceCatalog]);

  const hasRequiredValues =
    Boolean(form.floor) &&
    Boolean(form.roomType) &&
    Boolean(form.roomNumber) &&
    Boolean(form.department) &&
    Boolean(form.course) &&
    Boolean(form.date) &&
    Boolean(form.startTime) &&
    Boolean(form.endTime) &&
    Boolean(form.purpose.trim());

  const isFormValid =
    hasRequiredValues &&
    !dateError &&
    !startPastTimeError &&
    !endPastTimeError &&
    !timeOrderError &&
    !overlapError;

  const roomTypeOptions = useMemo(() => getRoomTypesByFloor(form.floor), [form.floor]);

  const selectedResource = useMemo(
    () => resourceLookupByAlias.get(normalizeRoomCode(form.roomNumber)) || null,
    [resourceLookupByAlias, form.roomNumber]
  );
  const courseOptions = useMemo(() => DEPARTMENT_COURSES[form.department] || [], [form.department]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "All") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const weekDates = useMemo(() => getWeekDates(form.date), [form.date]);

  const weeklyBookings = useMemo(
    () =>
      scheduleBookings
        .filter((booking) => weekDates.some((day) => day.key === booking.date))
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [scheduleBookings, weekDates]
  );

  async function loadData() {
    setLoading(true);
    try {
      const [bookingRows, scheduleRows] = await Promise.all([
        getBookings(),
        getBookingSchedule(),
      ]);

      setBookings(bookingRows);
      setScheduleBookings(scheduleRows);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadResourceCatalog() {
      setResourceCatalogLoading(true);
      try {
        const resourcesResponse = await fetchResources();
        const resources = normalizeResourceRows(resourcesResponse)
          .filter((resource) => resource && resource.id != null)
          .map((resource) => ({
            id: resource.id,
            roomNumber: resource.code || `Resource-${resource.id}`,
            floor: deriveFloorLabel(resource),
            roomType: deriveRoomTypeLabel(resource),
          }));

        if (!cancelled) {
          setResourceCatalog(resources);
        }
      } catch {
        if (!cancelled) {
          setResourceCatalog([]);
        }
      } finally {
        if (!cancelled) {
          setResourceCatalogLoading(false);
        }
      }
    }

    loadResourceCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.floor && floorOptions.length > 0) {
      setForm((prev) => ({ ...prev, floor: floorOptions[0] }));
    }
  }, [form.floor, floorOptions]);

  useEffect(() => {
    if (form.floor && !form.roomType) {
      const types = roomTypeOptions;
      if (types.length > 0) {
        setForm((prev) => ({ ...prev, roomType: types[0] }));
      }
    }
  }, [form.floor, form.roomType, roomTypeOptions]);

  useEffect(() => {
    if (form.floor && form.roomType) {
      const generatedRoom = generateAutoRoomNumber(form.floor, form.roomType);
      if (generatedRoom !== form.roomNumber) {
        setForm((prev) => ({ ...prev, roomNumber: generatedRoom }));
      }
    }
  }, [form.floor, form.roomType, form.roomNumber]);

  useEffect(() => {
    if (form.department && !form.course) {
      const list = DEPARTMENT_COURSES[form.department] || [];
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, course: list[0] }));
      }
    }
  }, [form.department, form.course]);

  async function fetchAvailability(showToastOnEmpty = false) {
    if (!form.floor || !form.roomType || !form.roomNumber || !form.date || dateError) {
      setBookedSlots([]);
      return;
    }

    setAvailabilityLoading(true);
    try {
      const data = await getAvailableSlots({
        floor: form.floor,
        roomType: form.roomType,
        roomNumber: form.roomNumber,
        date: form.date,
      });

      setBookedSlots(data.bookedSlots || []);

      if (showToastOnEmpty && (data.availableSlots || []).length === 0) {
        toast.info("No free slots for selected date.");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  useEffect(() => {
    setAvailabilityChecked(false);
    setBookedSlots([]);
    setSelectedCriteriaLabel("");
  }, [form.floor, form.roomType, form.roomNumber, form.date]);

  async function onFindAvailableSlots() {
    if (!form.floor || !form.roomType || !form.roomNumber || !form.date) {
      toast.info("Please select floor, room type, room and date first.");
      return;
    }

    if (dateError) {
      toast.error("You cannot book a past date");
      return;
    }

    await fetchAvailability(true);
    setAvailabilityChecked(true);
    setSelectedCriteriaLabel(`${form.floor} • ${form.roomNumber} • ${form.date}`);
  }

  async function onSubmitBooking(event) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (
      !form.floor ||
      !form.roomType ||
      !form.roomNumber ||
      !form.department ||
      !form.course ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.purpose.trim()
    ) {
      toast.error("Please complete all required booking fields.");
      return;
    }

    if (dateError) {
      toast.error("You cannot book a past date");
      return;
    }

    if (startPastTimeError || endPastTimeError) {
      toast.error("Past time booking is not allowed for today.");
      return;
    }

    if (timeOrderError) {
      toast.error("End time must be after start time.");
      return;
    }

    if (overlapError) {
      toast.error("Selected time slot is already booked. Please choose another time.");
      return;
    }

    const fallbackResourceId = selectedResource?.id || resourceCatalog[0]?.id;
    if (!fallbackResourceId) {
      toast.error("No resources are available for booking right now.");
      return;
    }

    setSubmitting(true);
    try {
      const bookingPayload = {
        ...form,
        resourceId: fallbackResourceId,
      };

      console.debug("Lecturer booking payload", bookingPayload);
      await createLecturerBooking(bookingPayload);
      toast.success("Booking request submitted successfully.");
      setForm((prev) => ({
        ...initialForm,
        floor: prev.floor,
        roomType: prev.roomType,
        roomNumber: prev.roomNumber,
        department: prev.department,
        course: prev.course,
      }));
      setSubmitAttempted(false);
      setBookedSlots([]);
      setAvailabilityChecked(false);
      setSelectedCriteriaLabel("");
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Lecture Hall Bookings</h2>
            <p className="mt-1 text-sm text-slate-500">Create and track your classroom reservations by course and schedule.</p>
          </div>

          <div className="flex items-center gap-2">
            <select className="input-field w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {[
                "All",
                "Pending",
                "Approved",
                "Rejected",
                "Ready",
                "In Progress",
                "Completed",
              ].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(13,148,136,0.24)] transition hover:scale-[1.01]"
              onClick={() => setShowModal(true)}
            >
              New Booking
            </button>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">My Booking Requests</h3>
        {loading ? <p className="mt-3 text-sm text-slate-500">Loading bookings...</p> : null}
        {!loading && filteredBookings.length === 0 ? <p className="mt-3 text-sm text-slate-500">No bookings yet.</p> : null}
        <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
          <table className="min-w-full text-sm">
            <thead className="bg-emerald-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Hall</th>
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Date & Time</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id || booking.id} className="border-t border-emerald-100">
                  <td className="px-3 py-2 text-slate-700">{booking.floor} • {booking.roomNumber} ({booking.roomType})</td>
                  <td className="px-3 py-2 text-slate-700">{booking.department} • {booking.course}</td>
                  <td className="px-3 py-2 text-slate-700">{booking.date} • {booking.startTime}-{booking.endTime}</td>
                  <td className="px-3 py-2 text-slate-700">{booking.purpose || booking.notes || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-base font-semibold text-slate-800">Weekly Schedule (All Booked Halls)</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-7">
          {weekDates.map((day) => {
            const dayRows = weeklyBookings.filter((booking) => booking.date === day.key);

            return (
              <article key={day.key} className="rounded-xl border border-emerald-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-campus-700">{day.label}</p>
                <div className="mt-2 space-y-2">
                  {dayRows.length === 0 ? <p className="text-xs text-slate-400">No bookings</p> : null}
                  {dayRows.map((booking) => (
                    <div key={booking._id || booking.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-xs font-semibold text-slate-700">{booking.startTime}-{booking.endTime}</p>
                      <p className="text-xs text-slate-600">{booking.roomNumber || "Room"}</p>
                      <p className="text-[11px] text-slate-500">{booking.department} • {booking.course}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showModal ? (
          <motion.div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="booking-modal-panel mx-auto mt-16 w-[92%] max-w-2xl rounded-2xl border border-emerald-100 bg-white p-5 shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-slate-900">Create Lecture Hall Booking</h3>
                <button type="button" className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100" onClick={() => setShowModal(false)}>Close</button>
              </div>

              <form className="booking-form-modal mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmitBooking}>
                <div className="booking-field grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lecturer-booking-floor">Floor</label>
                  <select
                    id="lecturer-booking-floor"
                    className="input-field"
                    value={form.floor}
                    onChange={(e) => setForm((prev) => ({ ...prev, floor: e.target.value, roomType: "", roomNumber: "" }))}
                    required
                  >
                    {floorOptions.map((floor) => (
                      <option key={floor} value={floor}>
                        {floor}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="booking-field grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lecturer-booking-room-type">Room Type</label>
                  <select
                    id="lecturer-booking-room-type"
                    className="input-field"
                    value={form.roomType}
                    onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value, roomNumber: "" }))}
                    required
                  >
                    {roomTypeOptions.map((roomType) => (
                      <option key={roomType} value={roomType}>
                        {roomType}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Building2 size={13} /> Lecture Hall</span>
                    <span className="inline-flex items-center gap-1"><MonitorSpeaker size={13} /> Smart Classroom</span>
                    <span className="inline-flex items-center gap-1"><DoorOpen size={13} /> Classroom</span>
                    <span className="inline-flex items-center gap-1"><FlaskConical size={13} /> Lab</span>
                  </div>
                </div>

                <input type="hidden" value={form.roomNumber} readOnly />

                <div className="booking-field grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lecturer-booking-department">Department</label>
                  <select
                    id="lecturer-booking-department"
                    className="input-field"
                    value={form.department}
                    onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value, course: "" }))}
                    required
                  >
                    {Object.keys(DEPARTMENT_COURSES).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="booking-field grid gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lecturer-booking-course">Course</label>
                  <select
                    id="lecturer-booking-course"
                    className="input-field"
                    value={form.course}
                    onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))}
                    required
                  >
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="booking-field grid gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lecturer-booking-date">Date</label>
                  <input
                    id="lecturer-booking-date"
                    className={`input-field ${dateError ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
                    type="date"
                    value={form.date}
                    min={todayStr}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, startTime: prev.startTime || "08:00", endTime: prev.endTime || "10:00" }))}
                    required
                  />
                  {dateError ? <p className="text-xs font-medium text-rose-600">You cannot book a past date</p> : null}
                </div>

                <div className="booking-field grid gap-2">
                  <label className="text-sm font-medium text-slate-700">Time Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={`input-field ${((submitAttempted && !form.startTime) || startPastTimeError || timeOrderError || overlapError) ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
                      type="time"
                      value={form.startTime}
                      min={isTodaySelected ? nowTimeStr : undefined}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                    <input
                      className={`input-field ${((submitAttempted && !form.endTime) || endPastTimeError || timeOrderError || overlapError) ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
                      type="time"
                      value={form.endTime}
                      min={isTodaySelected ? (form.startTime || nowTimeStr) : (form.startTime || undefined)}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                  {startPastTimeError ? <p className="text-xs font-medium text-rose-600">{startPastTimeError}</p> : null}
                  {!startPastTimeError && endPastTimeError ? <p className="text-xs font-medium text-rose-600">{endPastTimeError}</p> : null}
                  {!startPastTimeError && !endPastTimeError && timeOrderError ? <p className="text-xs font-medium text-rose-600">{timeOrderError}</p> : null}
                  {!startPastTimeError && !endPastTimeError && !timeOrderError && overlapError ? <p className="text-xs font-medium text-rose-600">{overlapError}</p> : null}
                </div>

                <div className="booking-field grid gap-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lecturer-booking-purpose">Purpose / Topic</label>
                  <textarea
                    id="lecturer-booking-purpose"
                    className="input-field min-h-24"
                    value={form.purpose}
                    onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                    required
                  />
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-secondary booking-action-button" onClick={onFindAvailableSlots}>Check Available Slots</button>
                </div>

                <div className="md:col-span-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Already Booked Slots</p>
                    {availabilityLoading ? <span className="text-xs text-slate-500">Loading...</span> : null}
                  </div>

                  {!availabilityChecked ? (
                    <p className="text-sm text-slate-500">Choose Floor, Room, and Date, then click Check Available Slots to see booking breakdown.</p>
                  ) : null}

                  {availabilityChecked && selectedCriteriaLabel ? (
                    <p className="text-xs text-slate-600">Showing availability for <span className="font-semibold text-slate-700">{selectedCriteriaLabel}</span></p>
                  ) : null}

                  {availabilityChecked && bookedRanges.length === 0 ? (
                    <p className="text-sm text-emerald-700">Fully Available (8:00 AM - 8:00 PM)</p>
                  ) : null}

                  {availabilityChecked && bookedRanges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {bookedRanges.map((slot) => (
                        <span
                          key={slot.id}
                          className="inline-flex rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Available Slots</p>

                  {availabilityChecked && availableRanges.length === 0 ? (
                    <p className="text-sm text-slate-500">No free slots available for this hall and date.</p>
                  ) : null}

                  {availabilityChecked && availableRanges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableRanges.map((slot) => {
                        const slotKey = `${slot.startTime}-${slot.endTime}`;
                        const isSelected = form.startTime === slot.startTime && form.endTime === slot.endTime;

                        return (
                          <button
                            key={slotKey}
                            type="button"
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${isSelected ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                            onClick={() => setForm((prev) => ({ ...prev, startTime: slot.startTime, endTime: slot.endTime }))}
                          >
                            {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {availabilityChecked ? (
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Time Breakdown</p>
                      {timeBreakdown.length === 0 ? (
                        <p className="text-sm text-slate-500">No availability data for selected criteria.</p>
                      ) : (
                        <div className="space-y-1">
                          {timeBreakdown.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                              <span className="font-medium text-slate-700">
                                {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${slot.kind === "booked" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {slot.kind === "booked" ? "Booked" : "Available"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="md:col-span-2 mt-1 flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary booking-submit-button"
                    disabled={submitting || !isFormValid}
                  >
                    {submitting ? "Submitting..." : "Submit Booking Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
