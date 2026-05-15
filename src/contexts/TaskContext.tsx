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
  executeTaskActionApi,
  getMyTodosApi,
  getTaskDetailApi,
  getTasksApi,
} from "@/services/apis/tasks";
import { startProcessInstanceApi } from "@/services/apis/processes";
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
  tasks: Task[];
  loading: boolean;
  refreshTasks: () => Promise<void>;
  addTask: (task: TaskDraft) => Promise<string>;
  getTaskById: (taskId: string) => Task | undefined;
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
  executePptCollabAction: (
    taskId: string,
    data: {
      action: "dept_assign" | "assign_pages" | "submit" | "review" | "final_approve" | "mark_merged" | "reject_all";
      payload: Record<string, unknown>;
    }
  ) => Promise<Task>;
  fetchMyTodos: () => Promise<TodoItem[]>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

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

function buildPptWorkflowConfig(task: TaskDraft) {
  const workflow = task.meetingMaterialWorkflow;

  if (!workflow) {
    throw new Error("PPT 任务缺少工作流配置");
  }

  return {
    totalPages: workflow.totalPages,
    templateFileId: task.templateFileId || workflow.templateFileId,
    deptAssignments: workflow.deptAssignments.map(dept => ({
      department: dept.department,
      pages: dept.pages,
      headUserId: dept.headUserId,
      requirement: dept.requirement,
    })),
  };
}

async function fetchRemoteTasks(userId: string, processKey?: string) {
  const taskList = await getTasksApi({
    processKey,
  });

  // 列表接口已返回完整数据（含 workflowState），直接适配即可
  const items = Array.isArray(taskList) ? taskList : [];
  return items.map((item: Record<string, any>) => adaptBackendTask(item));
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUserContext();
  const [remoteTasks, setRemoteTasks] = useState<Task[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const tasks = useMemo(() => [...remoteTasks, ...localTasks], [remoteTasks, localTasks]);

  const refreshTasks = async () => {
    setLoading(true);

    try {
      const nextRemoteTasks = await fetchRemoteTasks(currentUser.id, "ppt_collab");
      setRemoteTasks(nextRemoteTasks);
    } catch (error) {
      console.error("Failed to load PPT tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshTasks();
  }, [currentUser.id]);

  const refreshTaskById = async (taskId: string) => {
    const detail = await getTaskDetailApi(taskId, currentUser.id);
    const nextTask = adaptBackendTask(detail);

    setRemoteTasks(previous => {
      const exists = previous.some(task => task.id === taskId);
      if (!exists) {
        return [nextTask, ...previous];
      }

      return previous.map(task => (task.id === taskId ? nextTask : task));
    });
  };

  const addTask = async (taskData: TaskDraft) => {
    if (taskData.type === TaskTypeEnum.MeetingMaterial) {
      // 按照 PPT_COLLAB_DEMO 文档，创建任务走 POST /api/v1/processes/instances
      const variables: Record<string, unknown> = {
        title: taskData.title,
        category: "月报与材料编制",
        department: taskData.department,
      };
      if (taskData.description) {
        variables.description = taskData.description;
      }
      if (taskData.deadline) {
        variables.deadline = taskData.deadline;
      }

      const createdTask = await startProcessInstanceApi({
        process_key: "ppt_collab",
        variables,
      });

      const createdTaskId = String(createdTask.id || "");
      if (createdTaskId) {
        await refreshTaskById(createdTaskId);
      } else {
        await refreshTasks();
      }

      return createdTaskId;
    }

    const localTask = createLocalTask(taskData);
    setLocalTasks(previous => [localTask, ...previous]);
    return localTask.id;
  };

  const getTaskById = (taskId: string) => tasks.find(task => task.id === taskId);

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
              {
                ...submission,
                id: `local-sub-${Date.now()}`,
                status: ReviewStatusEnum.Pending,
              },
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
          if (approved && assignee.status !== AssigneeStatusEnum.Approved) {
            completedCount += 1;
          }

          return {
            ...assignee,
            status: approved ? AssigneeStatusEnum.Approved : AssigneeStatusEnum.Rejected,
            submissions: assignee.submissions.map(submission =>
              submission.id === submissionId
                ? {
                    ...submission,
                    status: approved ? ReviewStatusEnum.Approved : ReviewStatusEnum.Rejected,
                    feedback,
                    feedbackAt: new Date().toISOString(),
                  }
                : submission
            ),
          };
        });

        return {
          ...nextTask,
          completedCount,
        };
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
    deptId: string,
    userAssignmentId: string,
    data: PptSubmissionDraft
  ) => {
    try {
      const uploadedFile = await uploadFileApi({
        file: data.file,
        category: "submission",
        metadata: {
          task_id: taskId,
          uaId: userAssignmentId,
        },
      });

      const actionResponse = await executeTaskActionApi(taskId, {
        action: "submit",
        payload: {
          deptId,
          uaId: userAssignmentId,
          fileId: uploadedFile.fileId,
          baseVersion: data.baseVersion,
          note: data.note,
        },
      });

      await refreshTaskById(taskId);

      return {
        hasConflict: Boolean(actionResponse.result?.hasConflict),
        conflictDescription:
          typeof actionResponse.result?.conflictDescription === "string"
            ? actionResponse.result.conflictDescription
            : undefined,
      };
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === "VERSION_CONFLICT"
      ) {
        return {
          hasConflict: true,
          conflictDescription: error.message,
        };
      }

      throw error;
    }
  };

  const reviewMeetingMaterialWork = async (
    taskId: string,
    deptId: string,
    userAssignmentId: string,
    submissionId: string,
    approved: boolean,
    feedback?: string
  ) => {
    await executeTaskActionApi(taskId, {
      action: "review",
      payload: {
        deptId,
        uaId: userAssignmentId,
        submissionId,
        approved,
        feedback,
      },
    });

    await refreshTaskById(taskId);
  };

  const assignMeetingMaterialPagesToUser = async (
    taskId: string,
    deptId: string,
    assignments: UserAssignmentDraft | UserAssignmentDraft[]
  ) => {
    const normalizedAssignments = Array.isArray(assignments) ? assignments : [assignments];

    await executeTaskActionApi(taskId, {
      action: "assign_pages",
      payload: {
        deptId,
        assignments: normalizedAssignments.map(assignment => ({
          userId: assignment.userId,
          pages: assignment.pages,
          taskDescription: assignment.taskDescription,
        })),
      },
    });

    await refreshTaskById(taskId);
  };

  const markMeetingMaterialMerged = async (taskId: string) => {
    await executeTaskActionApi(taskId, {
      action: "mark_merged",
      payload: {},
    });

    await refreshTaskById(taskId);
  };

  const advanceMeetingMaterialStage = async (
    taskId: string,
    toStage: MeetingMaterialStage
  ) => {
    if (toStage === "merged") {
      await markMeetingMaterialMerged(taskId);
    }
  };

  const executePptCollabAction = async (
    taskId: string,
    data: {
      action: "dept_assign" | "assign_pages" | "submit" | "review" | "final_approve" | "mark_merged" | "reject_all";
      payload: Record<string, unknown>;
    }
  ): Promise<Task> => {
    const response = await executeTaskActionApi(taskId, data);

    // Merge action response with existing task data, then adapt
    const existingTask = remoteTasks.find(t => t.id === taskId);
    const mergedData = {
      ...(existingTask ? {
        id: existingTask.id,
        title: existingTask.title,
        type: existingTask.type,
        department: existingTask.department,
        createdAt: existingTask.createdAt,
        deadline: existingTask.deadline,
        createdBy: existingTask.createdBy,
        formKey: existingTask.formKey,
      } : {}),
      ...response,
    };
    const updatedTask = adaptBackendTask(mergedData);

    setRemoteTasks(previous =>
      previous.map(task => (task.id === taskId ? updatedTask : task))
    );

    return updatedTask;
  };

  const fetchMyTodos = async (): Promise<TodoItem[]> => {
    const response = await getMyTodosApi({ userId: currentUser.id });
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
        tasks,
        loading,
        refreshTasks,
        addTask,
        getTaskById,
        getTasksForEmployee,
        submitWork,
        reviewSubmission,
        deleteTask,
        submitMeetingMaterialWork,
        reviewMeetingMaterialWork,
        assignMeetingMaterialPagesToUser,
        markMeetingMaterialMerged,
        advanceMeetingMaterialStage,
        executePptCollabAction,
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
