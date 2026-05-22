import { http } from "@/services/http/axios";
import type { FlowablePaginatedResponse, FormDataField } from "@/services/apis/processes";

const { baseURL } = window.__requestConfig;
const tasksURL = `${baseURL}/api/v1/tasks`;

// ─── Flowable 原生任务类型 ──────────────────────────────────

/** Flowable 任务（原生字段 + ⭐扩展字段） */
export interface FlowableTaskDto {
  id: string;
  url: string;
  owner: string | null;
  assignee: string | null;
  delegationState: string | null;
  name: string;
  description: string | null;
  createTime: string;
  dueDate: string | null;
  priority: number;
  suspended: boolean;
  claimTime: string | null;
  taskDefinitionKey: string;
  scopeDefinitionId: string | null;
  scopeId: string | null;
  subScopeId: string | null;
  scopeType: string | null;
  propagatedStageInstanceId: string | null;
  tenantId: string;
  category: string | null;
  formKey: string | null;
  parentTaskId: string | null;
  parentTaskUrl: string | null;
  executionId: string;
  executionUrl: string;
  processInstanceId: string;
  processInstanceUrl: string;
  processDefinitionId: string;
  processDefinitionUrl: string;
  variables: { name: string; type: string; value: unknown; scope: string }[];
  /** ⭐ 扩展：业务标题 */
  title?: string;
  /** ⭐ 扩展：业务类别 */
  // category already exists as Flowable native field
  /** ⭐ 扩展：截止日期（业务层） */
  deadline?: string;
  /** ⭐ 扩展：所属部门 */
  department?: string;
  /** ⭐ 扩展：负责人姓名（后端可能返回，或前端从 assignee userId 解析） */
  assigneeName?: string;
  /** ⭐ 扩展：是否已结束 */
  ended?: boolean;
  /** ⭐ 扩展：结束时间 */
  endTime?: string;
  /** ⭐ 扩展：终止原因 */
  deleteReason?: string;
  /** ⭐ 扩展：任务状态（cancelled 等） */
  status?: string;
}

/** 任务详情（原生 + ⭐扩展字段） */
export interface TaskDetailDto extends FlowableTaskDto {
  /** ⭐ 扩展：动态表单字段（与 formKey 互斥） */
  formData: FormDataField[];
}

// ─── 完成任务请求类型 ────────────────────────────────────────

/** Flowable 变量格式 */
export interface FlowableVariable {
  name: string;
  value: unknown;
}

/** 完成任务请求体 */
export interface CompleteTaskRequest {
  action: string;
  variables?: FlowableVariable[];
}

// ─── 待办类型 ────────────────────────────────────────────────

export interface TodoItemDto {
  task: {
    id: string;
    title: string;
    processKey: string;
    deadline?: string;
    createdBy?: string;
  };
  todoType: string;
  todoLabel: string;
  userAssignment?: {
    id: string;
    pages: number[];
    taskDescription?: string;
    status: string;
  };
  deptAssignment?: {
    id: string;
    department: string;
  };
  assignedBy?: {
    id: string;
    name: string;
    avatar: string;
  };
}

// ─── API 接口 ────────────────────────────────────────────────

/**
 * 查询任务列表
 * GET /api/v1/tasks
 *
 * 透传 Flowable GET /runtime/tasks，支持所有 Flowable 原生查询参数
 */
export const getTasksApi = (params?: {
  assignee?: string;
  candidateUser?: string;
  candidateGroup?: string;
  processInstanceId?: string;
  processDefinitionKey?: string;
  processDefinitionId?: string;
  name?: string;
  nameLike?: string;
  active?: boolean;
  size?: number;
  start?: number;
  sort?: string;
  order?: string;
}) => {
  return http.get<FlowablePaginatedResponse<FlowableTaskDto>>(tasksURL, { params });
};

/**
 * 查询任务详情（含 formKey / ⭐formData）
 * GET /api/v1/tasks/{taskId}
 */
export const getTaskDetailApi = (taskId: string) => {
  return http.get<TaskDetailDto>(`${tasksURL}/${taskId}`);
};

/**
 * 完成任务
 * POST /api/v1/tasks/{taskId}/complete
 *
 * 标准完成：action = "complete", variables = [{name, value}, ...]
 * PPT 业务：action = "dept_assign" | "assign_pages" | "submit" | "review" | "mark_merged" | "reject_all"
 */
export const completeTaskApi = (taskId: string, data: CompleteTaskRequest) => {
  return http.post<{ success: boolean }>(`${tasksURL}/${taskId}/complete`, data);
};

/**
 * 我的待办
 * GET /api/v1/tasks/my-todos
 */
export const getMyTodosApi = (params?: { user_id?: string }) => {
  return http.get<{ data: TodoItemDto[] }>(`${tasksURL}/my-todos`, { params });
};

/**
 * 查询任务业务变量
 * GET /api/v1/tasks/{taskId}/business-variables
 *
 * 返回工作流 handler 的 get_state() 生成的业务数据
 */
export const getTaskBusinessVariablesApi = (taskId: string) => {
  return http.get<Record<string, unknown>>(`${tasksURL}/${taskId}/business-variables`);
};

/**
 * 删除任务
 * DELETE /api/v1/tasks/{taskId}
 */
export const deleteTaskApi = (taskId: string) => {
  return http.delete<{ success: boolean }>(`${tasksURL}/${taskId}`);
};

/** 历史待办项 */
export interface HistoryTodoItem {
  id: string;
  name: string;
  category: string;
  categoryCode: string;
  processDefinitionKey: string;
  deadline: string;
  department: string;
  startUserId: string;
  startTime: string;
  status: string;
  ended: boolean;
}

/**
 * 我的历史待办
 * GET /api/v1/tasks/my-history
 */
export const getMyHistoryApi = () => {
  return http.get<{ data: HistoryTodoItem[]; total: number }>(`${tasksURL}/my-history`);
};
