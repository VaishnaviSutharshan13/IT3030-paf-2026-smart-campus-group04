import { apiFetch } from "../../../core/api/httpClient";

export function getMyProfile() {
  return apiFetch("/user/profile");
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
