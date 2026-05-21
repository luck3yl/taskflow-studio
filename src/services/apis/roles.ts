import { http } from "@/services/http/axios";
import type {
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleUserDto,
  Permission,
} from "@/types/user";

const { baseURL } = window.__requestConfig;
const rolesURL = `${baseURL}/api/v1/roles`;

/** GET /roles */
export const getRolesApi = () => {
  return http.get<RoleDto[]>(rolesURL);
};

/** GET /roles/permissions/all — 系统全部权限标识 */
export const getAllPermissionsApi = () => {
  return http.get<Permission[]>(`${rolesURL}/permissions/all`);
};

/** POST /roles — 需要 role:manage 权限 */
export const createRoleApi = (data: CreateRoleRequest) => {
  return http.post<RoleDto>(rolesURL, data);
};

/** PUT /roles/{roleId} — 需要 role:manage 权限 */
export const updateRoleApi = (roleId: string, data: UpdateRoleRequest) => {
  return http.put<RoleDto>(`${rolesURL}/${roleId}`, data);
};

/** DELETE /roles/{roleId} — 需要 role:manage 权限 */
export const deleteRoleApi = (roleId: string) => {
  return http.delete(`${rolesURL}/${roleId}`);
};

/** GET /roles/{roleId}/permissions */
export const getRolePermissionsApi = (roleId: string) => {
  return http.get<Permission[]>(`${rolesURL}/${roleId}/permissions`);
};

/** PUT /roles/{roleId}/permissions — 需要 role:manage 权限（全量替换） */
export const updateRolePermissionsApi = (roleId: string, permissions: Permission[]) => {
  return http.put(`${rolesURL}/${roleId}/permissions`, { permissions });
};

/** GET /roles/{roleId}/users */
export const getRoleUsersApi = (roleId: string) => {
  return http.get<RoleUserDto[]>(`${rolesURL}/${roleId}/users`);
};

/** POST /roles/{roleId}/users — 需要 role:manage 权限 */
export const addRoleUserApi = (roleId: string, userId: string) => {
  return http.post(`${rolesURL}/${roleId}/users`, { userId });
};

/** DELETE /roles/{roleId}/users/{userId} — 需要 role:manage 权限 */
export const removeRoleUserApi = (roleId: string, userId: string) => {
  return http.delete(`${rolesURL}/${roleId}/users/${userId}`);
};
