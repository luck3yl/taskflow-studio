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

    config.headers.set("Accept", "application/json");
    return config;
  },
  error => Promise.reject(error)
);

service.interceptors.response.use(
  response => unpack(response),
  (
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
    const payload = error.response?.data;
    const message =
      payload?.error?.message ||
      payload?.errorMessage ||
      payload?.message ||
      (payload?.detail && typeof payload.detail === "string" ? payload.detail : null) ||
      error.message ||
      "网络连接故障";

    // 401 时清除 token 并跳转登录页（排除登录/注册接口本身）
    if (status === 401) {
      const url = error.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
      if (!isAuthEndpoint) {
        clearTokens();
        // 使用 location.replace 避免循环
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(
      new ApiRequestError(message, {
        status,
        code: payload?.error?.code || payload?.code,
        detail: payload?.error?.detail || payload?.detail,
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
