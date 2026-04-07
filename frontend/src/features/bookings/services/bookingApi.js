import { apiFetch } from "../../../core/api/httpClient";

export function getBookings(all = false, options = {}) {
  const query = new URLSearchParams();
  if (all) query.set("all", "true");
  if (options.scope) query.set("scope", options.scope);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/bookings${suffix}`);
}

export function getBookingSchedule() {
  return getBookings(false, { scope: "schedule" });
}

export function createBooking(payload) {
  return apiFetch("/bookings", { method: "POST", body: JSON.stringify(payload) });
}

export function createLecturerBooking(payload) {
  return apiFetch("/bookings/lecturer", { method: "POST", body: JSON.stringify(payload) });
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

  const query = `?${params.toString()}`;
  return apiFetch(`/bookings/available-slots${query}`).then((result) => {
    if (Array.isArray(result)) {
      return {
        bookedSlots: [],
        availableSlots: result,
        suggestedSlot: result[0] || null,
      };
    }

    return {
      bookedSlots: result?.bookedSlots || [],
      availableSlots: result?.availableSlots || [],
      suggestedSlot: result?.suggestedSlot || null,
    };
  });
}
