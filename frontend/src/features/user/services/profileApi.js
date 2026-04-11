import { apiFetch } from "../../../core/api/httpClient";

export function getMyProfile() {
  return apiFetch("/auth/me")
    .then((profile) => ({
      id: profile?.id,
      name: profile?.fullName || "Campus User",
      email: profile?.email || "",
      role: Array.isArray(profile?.roles)
        ? String(profile.roles[0] || "student").toLowerCase()
        : "student",
      status: "active",
      phone: "",
      address: "",
      bio: "",
      profileImageUrl: "",
      settings: {
        account: { twoFactorEnabled: false },
        ui: { darkMode: false, themeColor: "emerald" },
        notifications: { emailNotifications: true, systemAlerts: true },
        admin: { modules: { bookings: true, tickets: true, resources: true, reports: true } },
      },
    }))
    .catch(() => apiFetch("/user/profile"));
}

export function updateMyProfile(payload) {
  return apiFetch("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateMySettings(payload) {
  return apiFetch("/user/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
