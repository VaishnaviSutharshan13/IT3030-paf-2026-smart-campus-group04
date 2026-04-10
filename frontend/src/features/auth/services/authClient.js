const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

async function post(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with ${response.status}`);
  }

  return data;
}

export async function loginWithEmail({ email, password }) {
  return post("/auth/login", { email, password });
}

export async function registerUser({ name, fullName, email, password, confirmPassword, role }) {
  return post("/auth/register", {
    fullName: fullName || name,
    email,
    password,
    confirmPassword: confirmPassword || password,
    role: role || "student",
  });
}

export async function sendResetLink({ email }) {
  return post("/auth/forgot-password", { email });
}
