import { http } from "@/services/http/axios";
import type { TaskFormKey } from "@/types/task";

const { baseURL } = window.__requestConfig;
const tasksURL = `${baseURL}/api/v1/tasks`;

export const getTasksApi = (params: {
  type?: string;
  formKey?: TaskFormKey;
  department?: string;
  status?: string;
  search?: string;
  userId?: string;
}) => {
  return http.get<any[]>(tasksURL, {
    params: {
      type: params.type,
      form_key: params.formKey,
      department: params.department,
      status: params.status,
      search: params.search,
      user_id: params.userId,
    },
  });
};

export const getTaskDetailApi = (taskId: string, userId?: string) => {
  return http.get<Record<string, any>>(`${tasksURL}/${taskId}`, {
    params: userId ? { user_id: userId } : undefined,
  });
};

export const getMyTodosApi = (params?: { userId?: string }) => {
  return http.get<any[]>(`${tasksURL}/my-todos`, {
    params: params?.userId ? { user_id: params.userId } : undefined,
  });
};

export const createTaskApi = (formData: FormData) => {
  return http.post<Record<string, any>>(tasksURL, formData);
};

export const executeTaskActionApi = (
  taskId: string,
  data: {
    action: string;
    payload?: Record<string, unknown>;
  }
) => {
  return http.post<{
    success: boolean;
    result?: Record<string, any>;
    workflowState?: Record<string, any>;
  }>(`${tasksURL}/${taskId}/action`, data);
};

export const deleteTaskApi = (taskId: string) => {
  return http.delete<{ success: boolean }>(`${tasksURL}/${taskId}`);
};
