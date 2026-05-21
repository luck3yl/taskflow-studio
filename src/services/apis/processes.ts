import { http } from "@/services/http/axios";

const { baseURL } = window.__requestConfig;
const processesURL = `${baseURL}/api/v1/processes`;

// ─── Flowable 原生类型 ──────────────────────────────────────

/** Flowable 分页响应格式 */
export interface FlowablePaginatedResponse<T> {
  data: T[];
  total: number;
  start: number;
  sort: string;
  order: string;
  size: number;
}

/** Flowable 流程定义（原生字段） */
export interface ProcessDefinitionDto {
  id: string;
  url: string;
  key: string;
  version: number;
  name: string;
  description: string | null;
  tenantId: string;
  deploymentId: string;
  deploymentUrl: string;
  resource: string;
  diagramResource: string | null;
  category: string;
  graphicalNotationDefined: boolean;
  suspended: boolean;
  startFormDefined: boolean;
}

/** formData 字段定义（来自 Flowable form-data API 的 formProperties） */
export interface FormDataField {
  id: string;
  name: string;
  type: string;
  value: string | null;
  readable: boolean;
  writable: boolean;
  required: boolean;
  datePattern: string | null;
  enumValues: { id: string; name: string }[];
}

/** 流程定义详情（原生 + ⭐扩展字段） */
export interface ProcessDefinitionDetailDto extends ProcessDefinitionDto {
  /** ⭐ 扩展：启动表单的 formKey */
  formKey: string | null;
  /** ⭐ 扩展：启动表单字段列表 */
  formData: FormDataField[];
}

/** Flowable 流程实例（原生字段） */
export interface ProcessInstanceDto {
  id: string;
  url: string;
  name: string | null;
  businessKey: string | null;
  businessStatus: string | null;
  suspended: boolean;
  ended: boolean;
  processDefinitionId: string;
  processDefinitionUrl: string;
  processDefinitionName: string;
  processDefinitionDescription: string | null;
  activityId: string | null;
  startUserId: string;
  startTime: string;
  variables: { name: string; type: string; value: unknown; scope: string }[];
  callbackId: string | null;
  callbackType: string | null;
  referenceId: string | null;
  referenceType: string | null;
  propagatedStageInstanceId: string | null;
  tenantId: string;
  completed: boolean;
}

/** Flowable 流程变量 */
export interface ProcessVariable {
  name: string;
  type: string;
  value: unknown;
  scope: string;
}

// ─── 流程定义 API ───────────────────────────────────────────

/**
 * 获取流程定义列表
 * GET /api/v1/processes/definitions
 */
export const getProcessDefinitionsApi = () => {
  return http.get<FlowablePaginatedResponse<ProcessDefinitionDto>>(`${processesURL}/definitions`);
};

/**
 * 查询流程定义详情（含 ⭐formKey / ⭐formData）
 * GET /api/v1/processes/definitions/{processDefinitionId}
 */
export const getProcessDefinitionDetailApi = (processDefinitionId: string) => {
  return http.get<ProcessDefinitionDetailDto>(
    `${processesURL}/definitions/${processDefinitionId}`
  );
};

/**
 * 上传并部署自定义流程
 * POST /api/v1/processes/definitions/deploy/upload
 */
export const uploadDeployProcessApi = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.post(`${processesURL}/definitions/deploy/upload`, formData);
};

/**
 * 一键部署内置流程
 * POST /api/v1/processes/definitions/deploy
 */
export const deployBuiltinProcessesApi = () => {
  return http.post(`${processesURL}/definitions/deploy`);
};

/**
 * 获取流程定义的 BPMN XML（用于预览）
 * GET /api/v1/processes/definitions/{id}/xml
 */
export const getProcessDefinitionXmlApi = (definitionId: string) => {
  return http.get<{ id: string; bpmn20Xml: string }>(
    `${processesURL}/definitions/${definitionId}/xml`
  );
};

// ─── 流程实例 API ───────────────────────────────────────────

/**
 * 启动流程实例
 * POST /api/v1/processes/instances
 *
 * 响应为 Flowable 原生流程实例对象
 */
export const startProcessInstanceApi = (params: {
  process_key?: string;
  category_code?: string;
  variables?: Record<string, unknown>;
  business_key?: string;
}) => {
  return http.post<ProcessInstanceDto>(`${processesURL}/instances`, params);
};

/**
 * 查看运行中的流程实例
 * GET /api/v1/processes/instances
 *
 * 支持过滤参数：
 * - category: 按流程类别精确匹配
 * - keyword: 按流程名称模糊匹配（不区分大小写）
 */
export const getProcessInstancesApi = (params?: {
  processDefinitionKey?: string;
  categoryCode?: string;
  keyword?: string;
  size?: number;
  start?: number;
  sort?: string;
  order?: string;
}) => {
  return http.get<FlowablePaginatedResponse<ProcessInstanceDto>>(`${processesURL}/instances`, {
    params,
  });
};

/**
 * 查询流程实例变量
 * GET /api/v1/processes/instances/{processInstanceId}/variables
 *
 * 返回 Flowable 原生变量数组
 */
export const getProcessInstanceVariablesApi = (processInstanceId: string) => {
  return http.get<ProcessVariable[]>(
    `${processesURL}/instances/${processInstanceId}/variables`
  );
};

/**
 * 终止流程实例
 * DELETE /api/v1/processes/instances/{instance_id}
 */
export const deleteProcessInstanceApi = (instanceId: string) => {
  return http.delete<void>(`${processesURL}/instances/${instanceId}`);
};
