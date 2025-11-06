export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const ACCESS_KEY = "token";
const REFRESH_KEY = "refresh";
const ACCESS_COOKIE = "access_token";
const EXPIRY_SKEW_SECONDS = 60;

type BufferLike = {
  from(input: string, encoding?: string): { toString(encoding?: string): string };
};

type JwtPayload = { exp?: number };

const getGlobalBuffer = (): BufferLike | undefined => {
  const globalObj = globalThis as unknown as { Buffer?: BufferLike };
  return globalObj.Buffer;
};

function base64UrlDecode(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, "=");
    if (typeof atob === "function") {
      return atob(padded);
    }
    const buffer = getGlobalBuffer();
    if (buffer) {
      return buffer.from(padded, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function persistTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, access);
  document.cookie = `${ACCESS_COOKIE}=${access}; Path=/; SameSite=Lax`;
  if (typeof refresh === "string") {
    window.localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  document.cookie = `${ACCESS_COOKIE}=; Path=/; Max-Age=0`;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  const payload = decodeJwt(refreshToken);
  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    clearAuthStorage();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (!res.ok) {
          clearAuthStorage();
          return null;
        }
        const data = await res.json();
        if (typeof data?.access !== "string") {
          clearAuthStorage();
          return null;
        }
        const maybeRefresh = typeof data.refresh === "string" ? data.refresh : undefined;
        persistTokens(data.access, maybeRefresh);
        return data.access as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function ensureAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(ACCESS_KEY);
  if (stored) {
    const payload = decodeJwt(stored);
    if (!payload?.exp) {
      return stored;
    }
    const expiresAt = payload.exp * 1000;
    if (Date.now() + EXPIRY_SKEW_SECONDS * 1000 < expiresAt) {
      return stored;
    }
  }
  const refreshed = await refreshAccessToken();
  if (refreshed) return refreshed;
  return stored;
}

async function fetchWithAuth(path: string, init: RequestInit = {}, retryOn401 = true): Promise<Response> {
  const headers = new Headers(init.headers ?? undefined);
  const hasAuth = headers.has("Authorization");
  if (!hasAuth) {
    const token = await ensureAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 401) {
    if (retryOn401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers.set("Authorization", `Bearer ${refreshed}`);
        return fetchWithAuth(path, { ...init, headers }, false);
      }
    }
    clearAuthStorage();
  }

  return response;
}

export async function safeErr(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      return data.detail || data.error || data.message || JSON.stringify(data);
    } catch {
      return `Error ${res.status}`;
    }
  } else {
    const txt = await res.text();
    if (txt.startsWith("<!DOCTYPE html>")) return "Error interno del servidor";
    return txt.slice(0, 200) || `Error ${res.status}`;
  }
}

export async function apiGET<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(
    path,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(await safeErr(res));
  return res.json();
}

export async function apiPOST<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithAuth(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await safeErr(res));
  return res.json();
}

export async function apiPATCH<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithAuth(
    path,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await safeErr(res));
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiDELETE(path: string): Promise<void> {
  const res = await fetchWithAuth(
    path,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error(await safeErr(res));
}
