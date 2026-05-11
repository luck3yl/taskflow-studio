import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const usersURL = `${baseURL}/api/v1/users`;

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

export const getUsersApi = (params?: {
  department?: string;
  search?: string;
}) => {
  return http.get<BackendUser[]>(usersURL, {
    params,
  });
};
