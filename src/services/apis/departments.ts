import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const departmentsURL = `${baseURL}/api/v1/departments`;

export interface BackendDepartment {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  parentId?: string | null;
}

export const getDepartmentsApi = () => {
  return http.get<BackendDepartment[]>(departmentsURL);
};
