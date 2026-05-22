import axios from "axios";
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

const CURRENT_USER_STORAGE_KEY = "taskflow.current-user";
const ACCESS_TOKEN_KEY = "taskflow.access-token";
const REFRESH_TOKEN_KEY = "taskflow.refresh-token";

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  detail?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; detail?: unknown }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

// --- Token 管理 ---

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// --- 当前用户信息（仅用于本地缓存，不再注入请求头） ---

export const setApiCurrentUser = (user?: {
  id?: string;
  name?: string;
  department?: string;
}) => {
  if (!user?.id) {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
};

const getStoredCurrentUser = () => {
  const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as {
      id?: string;
      name?: string;
      department?: string;
    };
  } catch {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return null;
  }
};

const service = axios.create({});

function unpack<T>(response: AxiosResponse<T>) {
  const payload = response.data as T & { data?: unknown };
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? payload;
  }

  return payload;
}

service.interceptors.request.use(
  config => {
    // Bearer Token 鉴权
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }

    // blob 请求不设置 Accept: application/json
    if (config.responseType !== "blob") {
      config.headers.set("Accept", "application/json");
    }

    return config;
  },
  error => Promise.reject(error)
);

// Token 刷新锁，防止并发刷新
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

service.interceptors.response.use(
  response => unpack(response),
  async (
    error: AxiosError<{
      reason?: string;
      errorMessage?: string;
      error?: { code?: string; message?: string; detail?: unknown };
      message?: string;
      path?: string;
      status?: number;
      timestamp?: string;
      code?: string;
      detail?: unknown;
    }>
  ) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

    // 401 时尝试刷新 token
    if (status === 401 && !isAuthEndpoint && originalRequest) {
      const refreshToken = getRefreshToken();

      if (refreshToken && !(originalRequest as any)._retry) {
        (originalRequest as any)._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            // 调用刷新接口
            const response = await axios.post(
              `${originalRequest.baseURL || ""}${url.split("/api/v1/")[0]}/api/v1/auth/refresh`,
              null,
              { headers: { Authorization: `Bearer ${refreshToken}` } }
            );
            const { access_token, refresh_token } = response.data;
            setTokens(access_token, refresh_token);
            isRefreshing = false;
            onTokenRefreshed(access_token);

            // 重试原始请求
            originalRequest.headers.set("Authorization", `Bearer ${access_token}`);
            return service(originalRequest);
          } catch {
            isRefreshing = false;
            refreshSubscribers = [];
            clearTokens();
            if (window.location.pathname !== "/login") {
              window.location.replace("/login");
            }
            return Promise.reject(error);
          }
        } else {
          // 正在刷新中，排队等待
          return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
              resolve(service(originalRequest));
            });
          });
        }
      }

      // 没有 refresh token，直接跳登录
      clearTokens();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    // 解析错误信息（blob 响应需要特殊处理）
    let payload = error.response?.data;
    if (payload instanceof Blob) {
      try {
        const text = await payload.text();
        payload = JSON.parse(text);
      } catch {
        payload = undefined;
      }
    }

    const message =
      (payload as any)?.error?.message ||
      (payload as any)?.errorMessage ||
      (payload as any)?.message ||
      ((payload as any)?.detail && typeof (payload as any).detail === "string" ? (payload as any).detail : null) ||
      error.message ||
      "网络连接故障";

    return Promise.reject(
      new ApiRequestError(message, {
        status,
        code: (payload as any)?.error?.code || (payload as any)?.code,
        detail: (payload as any)?.error?.detail || (payload as any)?.detail,
      })
    );
  }
);

export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config);
  },
  post<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config);
  },
  put<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config);
  },
};
