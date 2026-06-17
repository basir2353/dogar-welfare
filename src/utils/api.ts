import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Resolve API base URL:
 * - `VITE_API_BASE_URL` wins when set (production or custom dev).
 * - In Vite dev, default to the API server directly (port 4000) so donations/public
 *   endpoints work even if the dev proxy is bypassed or misconfigured.
 * - Otherwise use same-origin `/api/v1` (typical reverse-proxy production setup).
 */
const resolveApiBaseUrl = (): string => {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:4000/api/v1";
  }
  if (typeof window !== "undefined") {
    // Split deploy (Vercel + Railway): set VITE_API_BASE_URL at build time.
    console.error(
      "[dogar] VITE_API_BASE_URL is not set. Add it in Vercel → Settings → Environment Variables."
    );
    return `${window.location.origin}/api/v1`;
  }
  return "/api/v1";
};

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Origin for `/uploads/...` URLs.
 * In Vite dev, use the page origin so requests are same-origin and the dev proxy can forward `/uploads` to the API
 * (avoids Helmet CORP / cross-port image issues when the API is on another port).
 */
export const getApiMediaOrigin = (): string => {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (base.endsWith("/api/v1")) {
    return base.slice(0, -"/api/v1".length) || base;
  }
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return window.location.origin;
  }
  return base;
};

export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${getApiMediaOrigin()}${path}`;
  }
  return path;
}

/**
 * WebSocket (Socket.IO) must hit the same HTTP server as the API, not the Vite dev
 * origin. In dev, that is `http://localhost:4000`; `getApiMediaOrigin()` is the
 * *page* origin and would connect to the wrong process (no socket server).
 */
export const getSocketBaseUrl = (): string => {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (base.endsWith("/api/v1")) {
    return base.slice(0, -"/api/v1".length) || base;
  }
  if (/^https?:\/\/[^/]+$/i.test(base)) {
    return base;
  }
  return getApiMediaOrigin();
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** If access token expires but refresh is still valid, renew and retry once (no static import of auth-store — avoids circular deps). */
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetryConfig | undefined;
    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    const path = String(original.url ?? "");
    if (path.includes("/auth/refresh") || path.includes("/auth/login") || path.includes("/auth/register")) {
      return Promise.reject(error);
    }
    if (!original.headers?.Authorization) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const { useAuthStore } = await import("@/store/auth-store");
      const refresh = useAuthStore.getState().refreshToken;
      if (!refresh) {
        return Promise.reject(error);
      }
      const res = await publicApi.post("/auth/refresh", { refreshToken: refresh });
      const body = res.data as { success: boolean; data?: { accessToken: string; refreshToken: string } };
      if (!body.success || !body.data?.accessToken) {
        throw new Error("refresh failed");
      }
      useAuthStore.getState().setTokens(body.data);
      original.headers.Authorization = `Bearer ${body.data.accessToken}`;
      return api(original);
    } catch {
      try {
        const { useAuthStore } = await import("@/store/auth-store");
        useAuthStore.getState().clearSession();
      } catch {
        // ignore
      }
      return Promise.reject(error);
    }
  }
);
