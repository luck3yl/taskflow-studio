import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  deleteTaskApi,
  completeTaskApi,
  getMyTodosApi,
  getTaskDetailApi,
  getTasksApi,
  type FlowableTaskDto,
  type TaskDetailDto,
  type FlowableVariable,
  type CompleteTaskRequest,
  type TodoItemDto,
} from "@/services/apis/tasks";
import {
  startProcessInstanceApi,
  getProcessInstancesApi,
  getProcessInstanceVariablesApi,
  deleteProcessInstanceApi,
  type ProcessInstanceDto,
  type ProcessVariable,
} from "@/services/apis/processes";
import { uploadFileApi } from "@/services/apis/files";
import { ApiRequestError } from "@/services/http/axios";
import { adaptBackendTask } from "@/services/task-adapters";
import { useUserContext } from "@/contexts/UserContext";
import {
  AssigneeStatusEnum,
  MeetingMaterialDeptAssignmentStatusEnum,
  MeetingMaterialStageEnum,
  MeetingMaterialUserAssignmentStatusEnum,
  ReviewStatusEnum,
  TASK_TYPE_TO_FORM_KEY,
  TaskFormKeyEnum,
  TaskSourceEnum,
  TaskStatusEnum,
  TaskTypeEnum,
} from "@/enums/task";
import type {
  Assignee,
  MeetingMaterialStage,
  MeetingMaterialUserAssignment,
  Submission,
  Task,
  TodoItem,
} from "@/types/task";

export {
  AssigneeStatusEnum,
  MeetingMaterialDeptAssignmentStatusEnum,
  MeetingMaterialStageEnum,
  MeetingMaterialUserAssignmentStatusEnum,
  ReviewStatusEnum,
  TaskFormKeyEnum,
  TaskSourceEnum,
  TaskStatusEnum,
  TaskTypeEnum,
} from "@/enums/task";
export type {
  Assignee,
  MeetingMaterialDeptAssignment,
  MeetingMaterialPageSubmission,
  MeetingMaterialStage,
  MeetingMaterialUserAssignment,
  MeetingMaterialWorkflow,
  Submission,
  Task,
  TaskType,
  TodoItem,
  TodoType,
} from "@/types/task";

// Re-export Flowable types for pages that need them
export type { FlowableTaskDto, TaskDetailDto, ProcessInstanceDto, ProcessVariable };

type TaskDraft = Omit<Task, "id" | "createdAt" | "completedCount" | "status">;
type LocalSubmissionDraft = Omit<Submission, "id" | "status">;
type PptSubmissionDraft = {
  file: File;
  note?: string;
  baseVersion: number;
};
type UserAssignmentDraft = Omit<
  MeetingMaterialUserAssignment,
  "id" | "status" | "submissions"
>;

interface TaskContextType {
  // ─── 流程实例（第一层） ─────────────────────────────────
  /** 流程实例列表 */
  processInstances: ProcessInstanceDto[];
  /** 加载流程实例列表 */
  refreshProcessInstances: (params?: { processDefinitionKey?: string; categoryCode?: string; keyword?: string }) => Promise<void>;
  /** 启动流程实例 */
  startProcess: (processKey: string, variables?: Record<string, unknown>) => Promise<ProcessInstanceDto | undefined>;
  /** 终止流程实例 */
  deleteProcessInstance: (instanceId: string) => Promise<void>;
  /** 获取流程实例变量 */
  getProcessVariables: (instanceId: string) => Promise<ProcessVariable[]>;

  // ─── Flowable 任务（第二层） ────────────────────────────
  /** 获取某个流程实例下的任务列表 */
  getTasksByProcessInstance: (processInstanceId: string) => Promise<FlowableTaskDto[]>;
  /** 获取任务详情（含 formKey / formData） */
  getTaskDetail: (taskId: string) => Promise<TaskDetailDto | undefined>;
  /** 完成任务（标准 Flowable 完成 + PPT 业务操作） */
  completeTask: (taskId: string, request: CompleteTaskRequest) => Promise<void>;
  /** PPT 业务操作便捷方法（兼容旧 payload 格式） */
  completePptAction: (taskId: string, data: { action: string; payload?: Record<string, unknown> }) => Promise<Task>;

  // ─── 兼容旧接口（逐步迁移） ────────────────────────────
  tasks: Task[];
  loading: boolean;
  refreshTasks: () => Promise<void>;
  addTask: (task: TaskDraft & { category?: string; extraVariables?: Record<string, unknown> }) => Promise<string>;
  getTaskById: (taskId: string) => Task | undefined;
  fetchTaskDetail: (taskId: string) => Promise<TaskDetailDto | undefined>;
  getTasksForEmployee: (employeeName: string) => { task: Task; assignee: Assignee }[];
  submitWork: (taskId: string, assigneeId: string, submission: LocalSubmissionDraft) => Promise<void>;
  reviewSubmission: (
    taskId: string,
    assigneeId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  submitMeetingMaterialWork: (
    taskId: string,
    deptId: string,
    userAssignmentId: string,
    data: PptSubmissionDraft
  ) => Promise<{ hasConflict: boolean; conflictDescription?: string }>;
  reviewMeetingMaterialWork: (
    taskId: string,
    deptId: string,
    userAssignmentId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => Promise<void>;
  assignMeetingMaterialPagesToUser: (
    taskId: string,
    deptId: string,
    assignments: UserAssignmentDraft | UserAssignmentDraft[]
  ) => Promise<void>;
  markMeetingMaterialMerged: (taskId: string) => Promise<void>;
  advanceMeetingMaterialStage: (
    taskId: string,
    toStage: MeetingMaterialStage
  ) => Promise<void>;
  fetchMyTodos: () => Promise<TodoItem[]>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ─── Helper: 构造 Flowable variables 数组 ────────────────────

function toFlowableVariables(obj: Record<string, unknown>): FlowableVariable[] {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

// ─── Helper: 本地任务创建（兼容旧逻辑） ─────────────────────

function createLocalTask(taskData: TaskDraft): Task {
  const createdAt = new Date().toISOString();
  const totalAssignees = taskData.assignees.length;

  return {
    ...taskData,
    id: `local-task-${Date.now()}`,
    createdAt,
    completedCount: 0,
    status: TaskStatusEnum.InProgress,
    formKey:
      taskData.formKey ||
      TASK_TYPE_TO_FORM_KEY[taskData.type] ||
      TaskFormKeyEnum.SimpleSubmit,
    source: TaskSourceEnum.Local,
    totalAssignees,
  };
}

function updateLocalTaskAssignee(
  task: Task,
  assigneeId: string,
  updater: (assignee: Assignee) => Assignee
) {
  return {
    ...task,
    assignees: task.assignees.map(assignee =>
      assignee.id === assigneeId ? updater(assignee) : assignee
    ),
  };
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUserContext();

  // ─── 流程实例状态 ──────────────────────────────────────
  const [processInstances, setProcessInstances] = useState<ProcessInstanceDto[]>([]);

  // ─── 兼容旧逻辑的状态 ──────────────────────────────────
  const [remoteTasks, setRemoteTasks] = useState<Task[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const tasks = useMemo(() => [...remoteTasks, ...localTasks], [remoteTasks, localTasks]);

  // ─── 流程实例操作 ──────────────────────────────────────

  const refreshProcessInstances = async (params?: { processDefinitionKey?: string; categoryCode?: string; keyword?: string }) => {
    try {
      const response = await getProcessInstancesApi({
        processDefinitionKey: params?.processDefinitionKey,
        categoryCode: params?.categoryCode,
        keyword: params?.keyword,
        size: 100,
      });
      const list = Array.isArray(response) ? response : (response as any)?.data ?? [];
      setProcessInstances(list);
    } catch (error) {
      console.error("Failed to load process instances", error);
    }
  };

  const startProcess = async (processKey: string, variables?: Record<string, unknown>): Promise<ProcessInstanceDto | undefined> => {
    try {
      const instance = await startProcessInstanceApi({
        process_key: processKey,
        variables,
      });
      // 刷新流程实例列表
      await refreshProcessInstances({ processDefinitionKey: processKey });
      return instance;
    } catch (error) {
      console.error("Failed to start process", error);
      throw error;
    }
  };

  const deleteProcessInstance = async (instanceId: string) => {
    await deleteProcessInstanceApi(instanceId);
    setProcessInstances(prev => prev.filter(i => i.id !== instanceId));
  };

  const getProcessVariables = async (instanceId: string): Promise<ProcessVariable[]> => {
    try {
      const vars = await getProcessInstanceVariablesApi(instanceId);
      return Array.isArray(vars) ? vars : [];
    } catch (error) {
      console.error("Failed to get process variables", error);
      return [];
    }
  };

  // ─── Flowable 任务操作 ─────────────────────────────────

  const getTasksByProcessInstance = async (processInstanceId: string): Promise<FlowableTaskDto[]> => {
    try {
      const response = await getTasksApi({ processInstanceId });
      const list = Array.isArray(response) ? response : (response as any)?.data ?? [];
      return list;
    } catch (error) {
      console.error("Failed to get tasks for process instance", error);
      return [];
    }
  };

  const getTaskDetail = async (taskId: string): Promise<TaskDetailDto | undefined> => {
    try {
      return await getTaskDetailApi(taskId);
    } catch (error) {
      console.error("Failed to get task detail", error);
      return undefined;
    }
  };

  const completeTask = async (taskId: string, request: CompleteTaskRequest): Promise<void> => {
    await completeTaskApi(taskId, request);
  };

  /**
   * PPT 业务操作的便捷方法
   * 将 payload 对象转换为 Flowable variables 数组格式
   * 完成后直接返回（任务已推进，原 taskId 不再有效）
   */
  const completePptAction = async (
    taskId: string,
    data: { action: string; payload?: Record<string, unknown> }
  ): Promise<Task> => {
    const variables = data.payload ? toFlowableVariables(data.payload) : [];
    await completeTaskApi(taskId, { action: data.action, variables });

    // 任务完成后 Flowable 节点已推进，原 taskId 对应的任务可能已不存在
    // 不再尝试刷新该任务，由调用方决定后续操作（如跳转回列表）
    const existing = remoteTasks.find(t => t.id === taskId);
    return existing || { id: taskId, title: "", type: "例会资料" as any } as Task;
  };

  // ─── 兼容旧逻辑 ───────────────────────────────────────

  const refreshTasks = async () => {
    setLoading(true);
    try {
      // 拉取所有 ppt_collab 的任务（用于兼容旧的 task 列表展示）
      const response = await getTasksApi({ processDefinitionKey: "ppt_collab", size: 100 });
      const taskList = Array.isArray(response) ? response : (response as any)?.data ?? [];

      // 将 Flowable 任务适配为旧的 Task 格式（用于兼容现有组件）
      const adapted = taskList.map((item: Record<string, any>) => adaptBackendTask(item));
      setRemoteTasks(adapted);
    } catch (error) {
      console.error("Failed to load tasks", error);
    } finally {
      setLoading(false);
    }
  };

  // 不再自动拉取任务列表，由各页面按需调用
  // useEffect(() => { void refreshTasks(); }, [currentUser.id]);

  const refreshTaskById = async (taskId: string) => {
    try {
      const detail = await getTaskDetailApi(taskId);
      const nextTask = adaptBackendTask(detail);

      setRemoteTasks(previous => {
        const exists = previous.some(task => task.id === taskId);
        if (!exists) {
          return [nextTask, ...previous];
        }
        return previous.map(task => (task.id === taskId ? nextTask : task));
      });
    } catch (error) {
      console.error("Failed to refresh task", error);
    }
  };

  const addTask = async (taskData: TaskDraft & { category?: string; extraVariables?: Record<string, unknown> }) => {
    if (taskData.type === TaskTypeEnum.MeetingMaterial) {
      const variables: Record<string, unknown> = {
        title: taskData.title,
        department: taskData.department,
      };
      if (taskData.description) variables.description = taskData.description;
      if (taskData.deadline) variables.deadline = taskData.deadline;
      // 合并动态表单字段值
      if (taskData.extraVariables) {
        Object.assign(variables, taskData.extraVariables);
      }

      const instance = await startProcess("ppt_collab", variables);
      // 启动后刷新任务列表
      await refreshTasks();
      return instance?.id || "";
    }

    const localTask = createLocalTask(taskData);
    setLocalTasks(previous => [localTask, ...previous]);
    return localTask.id;
  };

  const getTaskById = (taskId: string) => tasks.find(task => task.id === taskId);

  const fetchTaskDetail = async (taskId: string): Promise<TaskDetailDto | undefined> => {
    return getTaskDetail(taskId);
  };

  const getTasksForEmployee = (employeeName: string) => {
    const matched: { task: Task; assignee: Assignee }[] = [];
    tasks.forEach(task => {
      task.assignees.forEach(assignee => {
        if (assignee.name === employeeName) {
          matched.push({ task, assignee });
        }
      });
    });
    return matched;
  };

  const submitWork = async (
    taskId: string,
    assigneeId: string,
    submission: LocalSubmissionDraft
  ) => {
    setLocalTasks(previous =>
      previous.map(task => {
        if (task.id !== taskId) return task;
        return updateLocalTaskAssignee(task, assigneeId, assignee => ({
          ...assignee,
          status: AssigneeStatusEnum.Submitted,
          submissions: [
            ...assignee.submissions,
            { ...submission, id: `local-sub-${Date.now()}`, status: ReviewStatusEnum.Pending },
          ],
        }));
      })
    );
  };

  const reviewSubmission = async (
    taskId: string,
    assigneeId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => {
    setLocalTasks(previous =>
      previous.map(task => {
        if (task.id !== taskId) return task;
        let completedCount = task.completedCount;
        const nextTask = updateLocalTaskAssignee(task, assigneeId, assignee => {
          if (approved && assignee.status !== AssigneeStatusEnum.Approved) completedCount += 1;
          return {
            ...assignee,
            status: approved ? AssigneeStatusEnum.Approved : AssigneeStatusEnum.Rejected,
            submissions: assignee.submissions.map(s =>
              s.id === submissionId
                ? { ...s, status: approved ? ReviewStatusEnum.Approved : ReviewStatusEnum.Rejected, feedback, feedbackAt: new Date().toISOString() }
                : s
            ),
          };
        });
        return { ...nextTask, completedCount };
      })
    );
  };

  const deleteTask = async (taskId: string) => {
    const remoteTask = remoteTasks.find(task => task.id === taskId);
    if (remoteTask?.source === TaskSourceEnum.Remote) {
      await deleteTaskApi(taskId);
      setRemoteTasks(previous => previous.filter(task => task.id !== taskId));
      return;
    }
    setLocalTasks(previous => previous.filter(task => task.id !== taskId));
  };

  const submitMeetingMaterialWork = async (
    taskId: string,
    _deptId: string,
    userAssignmentId: string,
    data: PptSubmissionDraft
  ) => {
    try {
      const uploadedFile = await uploadFileApi({ file: data.file, category: "submission" });

      await completeTaskApi(taskId, {
        action: "submit",
        variables: toFlowableVariables({
          uaId: userAssignmentId,
          fileId: uploadedFile.fileId,
          baseVersion: data.baseVersion,
          note: data.note,
        }),
      });

      await refreshTaskById(taskId);
      return { hasConflict: false };
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "VERSION_CONFLICT") {
        return { hasConflict: true, conflictDescription: error.message };
      }
      throw error;
    }
  };

  const reviewMeetingMaterialWork = async (
    taskId: string,
    _deptId: string,
    userAssignmentId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => {
    await completeTaskApi(taskId, {
      action: "review",
      variables: toFlowableVariables({
        uaId: userAssignmentId,
        submissionId,
        approved,
        feedback,
      }),
    });
    await refreshTaskById(taskId);
  };

  const assignMeetingMaterialPagesToUser = async (
    taskId: string,
    deptId: string,
    assignments: UserAssignmentDraft | UserAssignmentDraft[]
  ) => {
    const normalizedAssignments = Array.isArray(assignments) ? assignments : [assignments];
    await completeTaskApi(taskId, {
      action: "assign_pages",
      variables: toFlowableVariables({
        deptId,
        assignments: normalizedAssignments.map(a => ({
          userId: a.userId,
          pages: a.pages,
          taskDescription: a.taskDescription,
        })),
      }),
    });
    await refreshTaskById(taskId);
  };

  const markMeetingMaterialMerged = async (taskId: string) => {
    await completeTaskApi(taskId, {
      action: "mark_merged",
      variables: [],
    });
    await refreshTaskById(taskId);
  };

  const advanceMeetingMaterialStage = async (taskId: string, toStage: MeetingMaterialStage) => {
    if (toStage === "merged") await markMeetingMaterialMerged(taskId);
  };

  const fetchMyTodos = async (): Promise<TodoItem[]> => {
    const response = await getMyTodosApi({ user_id: currentUser.id });
    const items = Array.isArray(response) ? response : (response as any)?.data ?? [];
    return items.map((item: Record<string, any>): TodoItem => ({
      task: {
        id: String(item.task?.id ?? ""),
        title: String(item.task?.title ?? ""),
        processKey: String(item.task?.processKey ?? item.task?.process_key ?? ""),
        deadline: item.task?.deadline,
        type: item.task?.type,
        createdBy: item.task?.createdBy ?? item.task?.created_by,
        templateFileId: item.task?.templateFileId ?? item.task?.template_file_id,
        templateFileName: item.task?.templateFileName ?? item.task?.template_file_name,
      },
      todoType: item.todoType ?? item.todo_type,
      todoLabel: item.todoLabel ?? item.todo_label ?? "",
      userAssignment: item.userAssignment ?? item.user_assignment
        ? {
            id: String((item.userAssignment ?? item.user_assignment)?.id ?? ""),
            pages: Array.isArray((item.userAssignment ?? item.user_assignment)?.pages)
              ? (item.userAssignment ?? item.user_assignment).pages.map(Number)
              : [],
            taskDescription: (item.userAssignment ?? item.user_assignment)?.taskDescription
              ?? (item.userAssignment ?? item.user_assignment)?.task_description,
            status: String((item.userAssignment ?? item.user_assignment)?.status ?? ""),
          }
        : undefined,
      deptAssignment: item.deptAssignment ?? item.dept_assignment
        ? {
            id: String((item.deptAssignment ?? item.dept_assignment)?.id ?? ""),
            department: String((item.deptAssignment ?? item.dept_assignment)?.department ?? ""),
          }
        : undefined,
      assignedBy: item.assignedBy ?? item.assigned_by
        ? {
            id: String((item.assignedBy ?? item.assigned_by)?.id ?? ""),
            name: String((item.assignedBy ?? item.assigned_by)?.name ?? ""),
            avatar: String((item.assignedBy ?? item.assigned_by)?.avatar ?? ""),
          }
        : undefined,
    }));
  };

  return (
    <TaskContext.Provider
      value={{
        // 新接口
        processInstances,
        refreshProcessInstances,
        startProcess,
        deleteProcessInstance,
        getProcessVariables,
        getTasksByProcessInstance,
        getTaskDetail,
        completeTask,
        completePptAction,
        // 兼容旧接口
        tasks,
        loading,
        refreshTasks,
        addTask,
        getTaskById,
        fetchTaskDetail,
        getTasksForEmployee,
        submitWork,
        reviewSubmission,
        deleteTask,
        submitMeetingMaterialWork,
        reviewMeetingMaterialWork,
        assignMeetingMaterialPagesToUser,
        markMeetingMaterialMerged,
        advanceMeetingMaterialStage,
        fetchMyTodos,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
