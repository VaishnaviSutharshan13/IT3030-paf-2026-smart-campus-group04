import { apiFetch } from "../../../core/api/httpClient";

let resourceIndexPromise;

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

function normalizeResourceRows(resourcesResponse) {
  if (Array.isArray(resourcesResponse)) {
    return resourcesResponse;
  }

  if (Array.isArray(resourcesResponse?.items)) {
    return resourcesResponse.items;
  }

  if (Array.isArray(resourcesResponse?.content)) {
    return resourcesResponse.content;
  }

  return [];
}

async function getResourceIndex() {
  if (!resourceIndexPromise) {
    resourceIndexPromise = apiFetch("/resources")
      .then((resourcesResponse) => {
        const resources = normalizeResourceRows(resourcesResponse);
        const byId = new Map();
        const byCode = new Map();
        const byAlias = new Map();

        for (const resource of resources || []) {
          byId.set(resource.id, resource);
          if (resource.code) {
            byCode.set(String(resource.code).toLowerCase(), resource);
            for (const alias of buildRoomAliases(resource.code)) {
              byAlias.set(alias, resource);
            }
          }
        }

        return { byId, byCode, byAlias, all: resources || [] };
      })
      .catch(() => ({ byId: new Map(), byCode: new Map(), byAlias: new Map(), all: [] }));
  }

  return resourceIndexPromise;
}

function toTime(value) {
  if (!value) return "";
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    return `${String(asDate.getHours()).padStart(2, "0")}:${String(asDate.getMinutes()).padStart(2, "0")}`;
  }
  return String(value).slice(11, 16);
}

function toDate(value) {
  if (!value) return "";
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime())) {
    return `${asDate.getFullYear()}-${String(asDate.getMonth() + 1).padStart(2, "0")}-${String(asDate.getDate()).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
}

function normalizeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (!value) return "PENDING";
  return value;
}

function inferRoomType(resource) {
  const code = String(resource?.code || "").toUpperCase();
  if (code.startsWith("LAB")) return "Lab";
  if (code.startsWith("ROOM")) return "Room";
  if (code.startsWith("EQUIP")) return "Equipment";
  return "Room";
}

function inferFloor(resource) {
  const code = String(resource?.code || "");
  const segments = code.split("-");
  return segments.length > 1 ? segments[1] : resource?.location || "Campus";
}

async function normalizeBookingRows(rows) {
  const index = await getResourceIndex();
  return (rows || []).map((row) => {
    const resource = index.byId.get(row.resourceId) || null;
    return {
      ...row,
      id: row.id,
      _id: row.id,
      status: normalizeStatus(row.status),
      date: toDate(row.startAt),
      startTime: toTime(row.startAt),
      endTime: toTime(row.endAt),
      roomNumber: resource?.code || `Resource-${row.resourceId}`,
      roomType: inferRoomType(resource),
      floor: inferFloor(resource),
      department: "N/A",
      course: "N/A",
      notes: row.rejectionReason || "",
      purpose: row.purpose || "",
    };
  });
}

function toMinutes(time) {
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN;
  return h * 60 + m;
}

function hasOverlap(startA, endA, startB, endB) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function minutesToSlot(min) {
  const hh = String(Math.floor(min / 60)).padStart(2, "0");
  const mm = String(min % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getBookings(all = false, options = {}) {
  const query = new URLSearchParams();
  if (all) query.set("all", "true");
  if (options.scope) query.set("scope", options.scope);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/bookings${suffix}`).then(normalizeBookingRows);
}

export function getBookingSchedule() {
  return getBookings(false, { scope: "schedule" });
}

export function createBooking(payload) {
  return apiFetch("/bookings", { method: "POST", body: JSON.stringify(payload) });
}

export function createLecturerBooking(payload) {
  const purposeSegments = [payload.purpose, payload.department && `Dept: ${payload.department}`, payload.course && `Course: ${payload.course}`]
    .filter(Boolean);

  if (payload.resourceId) {
    return createBooking({
      resourceId: payload.resourceId,
      startAt: `${payload.date}T${payload.startTime}:00`,
      endAt: `${payload.date}T${payload.endTime}:00`,
      purpose: purposeSegments.join(" | "),
    });
  }

  return getResourceIndex().then((index) => {
    const roomNumber = String(payload.roomNumber || "").trim().toLowerCase();
    const roomAlias = normalizeRoomCode(payload.roomNumber);
    const resource = index.byCode.get(roomNumber)
      || index.byAlias.get(roomAlias)
      || index.all.find((item) => String(item.code || "").toLowerCase() === roomNumber)
      || index.all.find((item) => String(item.name || "").toLowerCase().includes(roomNumber));

    if (!resource?.id) {
      throw new Error("Selected room is not available in the resource catalog.");
    }

    return createBooking({
      resourceId: resource.id,
      startAt: `${payload.date}T${payload.startTime}:00`,
      endAt: `${payload.date}T${payload.endTime}:00`,
      purpose: purposeSegments.join(" | "),
    });
  });
}

export function updateBooking(id, payload) {
  return apiFetch(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteBooking(id) {
  return apiFetch(`/bookings/${id}`, { method: "DELETE" });
}

export function getAvailableSlots(first, date) {
  const params = new URLSearchParams();

  if (typeof first === "object" && first !== null) {
    if (first.floor) params.set("floor", first.floor);
    if (first.roomType) params.set("roomType", first.roomType);
    if (first.roomNumber) params.set("roomNumber", first.roomNumber);
    if (first.date) params.set("date", first.date);
  } else {
    if (first) params.set("roomNumber", first);
    if (date) params.set("date", date);
  }

  const roomNumber = params.get("roomNumber");
  const selectedDate = params.get("date");

  return Promise.all([getResourceIndex(), getBookings(true)])
    .then(([index, bookings]) => {
      const roomAlias = normalizeRoomCode(roomNumber);
      const targetResource = roomNumber
        ? index.byCode.get(String(roomNumber).toLowerCase())
          || index.byAlias.get(roomAlias)
          || index.all.find((item) => String(item.code || "").toLowerCase().includes(String(roomNumber).toLowerCase()))
        : null;

      if (!targetResource?.id || !selectedDate) {
        return { bookedSlots: [], availableSlots: [], suggestedSlot: null };
      }

      const bookedSlots = (bookings || [])
        .filter((row) => row.resourceId === targetResource.id)
        .filter((row) => row.date === selectedDate)
        .filter((row) => ["PENDING", "APPROVED"].includes(String(row.status || "").toUpperCase()))
        .map((row) => ({
          startTime: row.startTime,
          endTime: row.endTime,
          status: row.status,
        }));

      const availableSlots = [];
      for (let start = 8 * 60; start < 20 * 60; start += 30) {
        const end = start + 30;
        const blocked = bookedSlots.some((slot) =>
          hasOverlap(start, end, toMinutes(slot.startTime), toMinutes(slot.endTime))
        );

        if (!blocked) {
          availableSlots.push({ startTime: minutesToSlot(start), endTime: minutesToSlot(end) });
        }
      }

      return {
        bookedSlots,
        availableSlots,
        suggestedSlot: availableSlots[0] || null,
      };
    });
}

export function approveBooking(id) {
  return apiFetch(`/bookings/${id}/approve`, { method: "PUT" });
}

export function rejectBooking(id, reason = "Rejected by admin") {
  return apiFetch(`/bookings/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}
