import { getToken } from "../auth/tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();

    const extractMessage = (rawText) => {
      if (!rawText) {
        return null;
      }

      try {
        const parsed = JSON.parse(rawText);
        return parsed?.message || parsed?.error || null;
      } catch {
        const messageMatch = rawText.match(/"message"\s*:\s*"([^"]+)"/i);
        if (messageMatch?.[1]) {
          return messageMatch[1];
        }
        return null;
      }
    };

    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || parsed.error || `Request failed with ${response.status}`);
    } catch {
      throw new Error(extractMessage(text) || `Request failed with ${response.status}`);
    }
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "success")) {
    if (payload.success) {
      return payload.data;
    }
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}
