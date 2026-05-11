import axios from "axios";
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

const CURRENT_USER_STORAGE_KEY = "taskflow.current-user";

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
    const currentUser = getStoredCurrentUser();

    if (currentUser?.id) {
      config.headers.set("X-User-Id", currentUser.id);
    }

    if (currentUser?.name) {
      config.headers.set("X-User-Name", encodeURIComponent(currentUser.name));
    }

    if (currentUser?.department) {
      config.headers.set("X-User-Department", encodeURIComponent(currentUser.department));
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
      error.message ||
      "网络连接故障";

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
