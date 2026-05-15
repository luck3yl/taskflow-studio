import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const processesURL = `${baseURL}/api/v1/processes`;

/**
 * 启动流程实例（创建任务）
 * POST /api/v1/processes/instances
 */
export const startProcessInstanceApi = (params: {
  process_key: string;
  variables?: Record<string, unknown>;
  business_key?: string;
}) => {
  return http.post<Record<string, any>>(`${processesURL}/instances`, params);
};
