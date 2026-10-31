import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// TypeScript type augmentation for Axios request configuration
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== "string" || !envUrl.trim()) {
    return "/api/v1";
  }
  const clean = envUrl.trim().replace(/\/+$/, "");
  if (clean.endsWith("/api/v1")) {
    return clean;
  }
  return `${clean}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Primary Axios client configured with credentials for HttpOnly cookie authentication
 * and optional Bearer token fallback for cross-domain deployments.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Isolated Axios instance for refreshing tokens.
 * Crucial: Has NO response interceptors attached to guarantee zero possibility of recursive loops.
 */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach stored token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("brightloop_token");
  if (token && !config.headers.get("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Refresh queue management state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

let lastLogoutDispatch = 0;
const dispatchLogout = (reason = "session_expired") => {
  localStorage.removeItem("brightloop_token");
  delete api.defaults.headers.common["Authorization"];
  const now = Date.now();
  if (now - lastLogoutDispatch > 2000) {
    lastLogoutDispatch = now;
    window.dispatchEvent(
      new CustomEvent("auth:logout", {
        detail: { reason },
      })
    );
  }
};

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Response interceptor for token refresh handling and queueing
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = originalRequest.url || "";

    // Do not attempt refresh on authentication endpoints (login, register, logout, or refresh itself)
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/refresh");

    // Only process 401 Unauthorized errors on non-auth routes
    if (status === 401 && !isAuthRoute) {
      // If already retried, do not loop
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // If another request is currently refreshing the session, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // Mark request as retried and begin refresh cycle
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshClient.post<{
          success: boolean;
          data?: { token?: string };
        }>("/auth/refresh");

        // If backend returned a bearer token, update Authorization header default
        const newToken = refreshResponse.data?.data?.token;
        if (newToken) {
          localStorage.setItem("brightloop_token", newToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        }

        // Resolve all waiting requests in the queue
        processQueue(null);

        // Retry the original request with refreshed session credentials
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (session expired or invalid)
        processQueue(refreshError);
        dispatchLogout("session_expired");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
