import { API_BASE, clearAuthStorage, persistTokens } from "./api";

export async function login(username: string, password: string) {
  const trimmedUser = username.trim();
  const res = await fetch(`${API_BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: trimmedUser, password }),
  });

  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const payload = await res.json();
      detail = payload?.detail || "Credenciales inválidas";
    } catch {
      // ignore JSON parse errors and keep generic detail
    }
    throw new Error(detail);
  }

  const data = await res.json(); // { access, refresh }

  if (typeof window !== "undefined") {
    if (typeof data?.access !== "string") {
      throw new Error("Respuesta de autenticación inválida");
    }
    persistTokens(data.access, typeof data.refresh === "string" ? data.refresh : undefined);
    window.localStorage.setItem("username", trimmedUser);
  }

  return data;
}

export function logout() {
  if (typeof window !== "undefined") {
    clearAuthStorage();
    window.localStorage.removeItem("username");
  }
}
