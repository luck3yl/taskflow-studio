import { http } from "@/services/http/axios";
import type {
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/user";

const { baseURL } = window.__requestConfig;
const usersURL = `${baseURL}/api/v1/users`;

/** GET /users */
export const getUsersApi = (params?: {
  departmentId?: string;
  groupId?: string;
  roleId?: string;
  search?: string;
}) => {
  return http.get<UserDto[]>(usersURL, { params });
};

/** GET /users/{userId} */
export const getUserApi = (userId: string) => {
  return http.get<UserDto>(`${usersURL}/${userId}`);
};

/** POST /users — 需要 user:manage 权限 */
export const createUserApi = (data: CreateUserRequest) => {
  return http.post<UserDto>(usersURL, data);
};

/** PUT /users/{userId} — 需要 user:manage 权限 */
export const updateUserApi = (userId: string, data: UpdateUserRequest) => {
  return http.put<UserDto>(`${usersURL}/${userId}`, data);
};

/** DELETE /users/{userId} — 需要 user:manage 权限（软删除） */
export const deleteUserApi = (userId: string) => {
  return http.delete(`${usersURL}/${userId}`);
};
