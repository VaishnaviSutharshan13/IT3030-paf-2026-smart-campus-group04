import { apiFetch } from "../../../core/api/httpClient";

export function fetchDashboardSummary() {
  return apiFetch("/dashboard/summary", { method: "GET" });
}
