const API_URL = import.meta.env.PROD ? "/api" : import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
let token: string | null = localStorage.getItem("token");

export function setToken(next: string | null) {
  token = next;
}

export async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "API hatasi");
  }

  return data;
}
