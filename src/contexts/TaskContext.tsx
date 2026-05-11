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
  getTaskDetailApi,
  getTasksApi,
  createTaskApi,
} from "@/services/apis/tasks";
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

async function fetchRemotePptTasks(userId: string) {
  const taskList = await getTasksApi({
    formKey: TaskFormKeyEnum.PptCollab,
    // userId,
  });

  const taskIds = [...new Set(taskList.map((item: Record<string, unknown>) => String(item.id || "")))].filter(
    Boolean
  );

  const detailResults = await Promise.allSettled(
    taskIds.map(taskId => getTaskDetailApi(taskId, userId))
  );

  return detailResults
    .filter(
      (result): result is PromiseFulfilledResult<Record<string, unknown>> =>
        result.status === "fulfilled"
    )
    .map(result => adaptBackendTask(result.value));
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
      const nextRemoteTasks = await fetchRemotePptTasks(currentUser.id);
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
      const formData = new FormData();
      formData.append("title", taskData.title);
      formData.append("description", taskData.description || "");
      formData.append("type", taskData.type);
      formData.append("department", taskData.department);
      formData.append("deadline", taskData.deadline);
      formData.append("formKey", TaskFormKeyEnum.PptCollab);
      formData.append("workflowConfig", JSON.stringify(buildPptWorkflowConfig(taskData)));

      const createdTask = await createTaskApi(formData);

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
