import { http } from "@/services/http/axios";
import { clearTokens } from "@/services/http/axios";
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  MeResponse,
} from "@/types/user";

const { baseURL } = window.__requestConfig;
const authURL = `${baseURL}/api/v1/auth`;

/** POST /auth/register */
export const registerApi = (data: RegisterRequest) => {
  return http.post<MeResponse>(`${authURL}/register`, data);
};

/** POST /auth/login */
export const loginApi = (data: LoginRequest) => {
  return http.post<TokenResponse>(`${authURL}/login`, data);
};

/** POST /auth/refresh */
export const refreshTokenApi = (refreshToken: string) => {
  return http.post<TokenResponse>(`${authURL}/refresh`, null, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
};

/** POST /auth/logout */
export const logoutApi = async () => {
  try {
    await http.post<{ detail: string }>(`${authURL}/logout`);
  } catch {
    // 即使后端登出失败，前端也清理 token
  }
  clearTokens();
};

/** GET /auth/me */
export const getAuthMeApi = () => {
  return http.get<MeResponse>(`${authURL}/me`);
};
