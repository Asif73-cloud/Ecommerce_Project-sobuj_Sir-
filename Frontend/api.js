// Save as FRONTEND/api.js
const API_BASE = "http://localhost:5000/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("kenova-token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(API_BASE + path, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.message || "API request failed");
  return data;
}
