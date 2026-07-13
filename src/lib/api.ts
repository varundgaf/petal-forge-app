import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL =
  (typeof window !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "https://api.adprofitly.com";

const ACCESS_KEY = "adp_access_token";
const REFRESH_KEY = "adp_refresh_token";

export const tokens = {
  get access() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = tokens.access;
  if (t && config.headers) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = tokens.refresh;
  if (!rt) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: rt });
    const access = data?.accessToken ?? data?.access_token;
    const refresh = data?.refreshToken ?? data?.refresh_token;
    if (access) {
      tokens.set(access, refresh);
      return access;
    }
    return null;
  } catch {
    tokens.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as any;
    return data?.message || data?.error || e.message || "Request failed";
  }
  return e instanceof Error ? e.message : "Unknown error";
}
