import { http } from "@/services/http/axios";
import type { FormDataField } from "@/services/apis/processes";

const { baseURL } = window.__requestConfig;
const formsURL = `${baseURL}/api/v1/forms`;

// ─── 表单 API 响应结构 ─────────────────────────────────────

export interface FormResponse {
  formKey: string | null;
  formData: FormDataField[];
  processDefinitionId: string | null;
  taskId: string | null;
}

// ─── 表单 API ───────────────────────────────────────────────

/**
 * 获取流程定义的启动表单字段
 * GET /api/v1/forms/process-definition/{processDefinitionId}
 */
export const getProcessDefinitionFormApi = (processDefinitionId: string) => {
  return http.get<FormResponse>(`${formsURL}/process-definition/${processDefinitionId}`);
};

/**
 * 获取任务的表单字段
 * GET /api/v1/forms/task/{taskId}
 */
export const getTaskFormApi = (taskId: string) => {
  return http.get<FormResponse>(`${formsURL}/task/${taskId}`);
};
