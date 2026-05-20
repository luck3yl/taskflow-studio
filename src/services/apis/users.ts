import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const usersURL = `${baseURL}/api/v1/users`;
const authURL = `${baseURL}/api/v1/auth`;

export interface BackendUser {
  id: string;
  username?: string;
  name: string;
  avatar?: string;
  email?: string;
  department?: string;
  role?: string;
  roles?: string[];
  staffId?: string;
}

export interface AuthMeResponse {
  id: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
}

export const getUsersApi = (params?: {
  department?: string;
  search?: string;
}) => {
  return http.get<BackendUser[]>(usersURL, {
    params,
  });
};

/**
 * 获取当前用户信息
 * GET /api/v1/auth/me
 *
 * 响应包含 id、name、role，每个角色的操作都依赖 id 来过滤数据
 */
export const getAuthMeApi = () => {
  return http.get<AuthMeResponse>(`${authURL}/me`);
};
