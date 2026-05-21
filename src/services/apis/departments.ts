import { http } from "@/services/http/axios";
import type {
  DepartmentDto,
  DepartmentMemberDto,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  GroupDto,
} from "@/types/user";

const { baseURL } = window.__requestConfig;
const departmentsURL = `${baseURL}/api/v1/departments`;

/** GET /departments/tree */
export const getDepartmentTreeApi = () => {
  return http.get<DepartmentDto[]>(`${departmentsURL}/tree`);
};

/** GET /departments */
export const getDepartmentsApi = (params?: {
  parentId?: string;
  level?: number;
}) => {
  return http.get<DepartmentDto[]>(departmentsURL, { params });
};

/** POST /departments — 需要 dept:manage 权限 */
export const createDepartmentApi = (data: CreateDepartmentRequest) => {
  return http.post<DepartmentDto>(departmentsURL, data);
};

/** PUT /departments/{deptId} — 需要 dept:manage 权限 */
export const updateDepartmentApi = (deptId: string, data: UpdateDepartmentRequest) => {
  return http.put<DepartmentDto>(`${departmentsURL}/${deptId}`, data);
};

/** DELETE /departments/{deptId} — 需要 dept:manage 权限 */
export const deleteDepartmentApi = (deptId: string) => {
  return http.delete(`${departmentsURL}/${deptId}`);
};

/** GET /departments/{deptId}/members */
export const getDepartmentMembersApi = (deptId: string) => {
  return http.get<DepartmentMemberDto[]>(`${departmentsURL}/${deptId}/members`);
};

/** POST /departments/{deptId}/members — 需要 dept:manage 权限 */
export const addDepartmentMemberApi = (deptId: string, userId: string) => {
  return http.post(`${departmentsURL}/${deptId}/members`, { userId });
};

/** DELETE /departments/{deptId}/members/{userId} — 需要 dept:manage 权限 */
export const removeDepartmentMemberApi = (deptId: string, userId: string) => {
  return http.delete(`${departmentsURL}/${deptId}/members/${userId}`);
};

/** GET /departments/{deptId}/groups */
export const getDepartmentGroupsApi = (deptId: string) => {
  return http.get<GroupDto[]>(`${departmentsURL}/${deptId}/groups`);
};
