import { formatPageRange } from "@/lib/utils";
import { getFileDownloadUrl } from "@/services/apis/files";
import {
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
import type {
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

const TASK_TYPE_BY_FORM_KEY: Record<string, TaskType> = {
  [TaskFormKeyEnum.PptCollab]: TaskTypeEnum.MeetingMaterial,
  [TaskFormKeyEnum.SimpleSubmit]: TaskTypeEnum.ResearchFeedback,
};

function toTaskType(rawType?: string, formKey?: string): TaskType {
  if (rawType) {
    return rawType as TaskType;
  }

  return TASK_TYPE_BY_FORM_KEY[formKey || ""] || TaskTypeEnum.ResearchFeedback;
}

function toAvatar(name?: string, avatar?: string) {
  return avatar || name?.trim().charAt(0) || "?";
}

function toSubmissionStatus(status?: string): Submission["status"] {
  if (status === ReviewStatusEnum.Approved || status === ReviewStatusEnum.Rejected) {
    return status;
  }

  return ReviewStatusEnum.Pending;
}

function toAssigneeStatus(status?: string): Assignee["status"] {
  if (
    status === AssigneeStatusEnum.Pending ||
    status === AssigneeStatusEnum.InProgress ||
    status === AssigneeStatusEnum.Submitted ||
    status === AssigneeStatusEnum.Approved ||
    status === AssigneeStatusEnum.Rejected
  ) {
    return status;
  }

  if (
    status === MeetingMaterialUserAssignmentStatusEnum.FinalApproved ||
    status === MeetingMaterialUserAssignmentStatusEnum.DeptApproved
  ) {
    return AssigneeStatusEnum.Approved;
  }

  return AssigneeStatusEnum.Pending;
}

function toMeetingUserStatus(status?: string): MeetingMaterialUserAssignment["status"] {
  if (
    status === MeetingMaterialUserAssignmentStatusEnum.Pending ||
    status === MeetingMaterialUserAssignmentStatusEnum.InProgress ||
    status === MeetingMaterialUserAssignmentStatusEnum.Submitted ||
    status === MeetingMaterialUserAssignmentStatusEnum.DeptApproved ||
    status === MeetingMaterialUserAssignmentStatusEnum.FinalApproved ||
    status === MeetingMaterialUserAssignmentStatusEnum.Rejected
  ) {
    return status;
  }

  return MeetingMaterialUserAssignmentStatusEnum.Pending;
}

function toMeetingDeptStatus(status?: string): MeetingMaterialDeptAssignment["status"] {
  if (
    status === MeetingMaterialDeptAssignmentStatusEnum.Pending ||
    status === MeetingMaterialDeptAssignmentStatusEnum.InProgress ||
    status === MeetingMaterialDeptAssignmentStatusEnum.DeptApproved ||
    status === MeetingMaterialDeptAssignmentStatusEnum.FinalApproved
  ) {
    return status;
  }

  return MeetingMaterialDeptAssignmentStatusEnum.Pending;
}

function toMeetingStage(stage?: string): MeetingMaterialStage {
  if (
    stage === MeetingMaterialStageEnum.DeptAssignment ||
    stage === MeetingMaterialStageEnum.UserAssignment ||
    stage === MeetingMaterialStageEnum.InProgress ||
    stage === MeetingMaterialStageEnum.DeptReviewing ||
    stage === MeetingMaterialStageEnum.FinalReviewing ||
    stage === MeetingMaterialStageEnum.Approved ||
    stage === MeetingMaterialStageEnum.Merged
  ) {
    return stage;
  }

  return MeetingMaterialStageEnum.DeptAssignment;
}

function toSubmission(item: Record<string, any>): Submission {
  const fileId = item.fileId || item.file_id;

  return {
    id: item.id || "",
    fileId,
    fileName: item.fileName || item.file_name || "\u672a\u547d\u540d\u6587\u4ef6",
    fileSize: Number(item.fileSize ?? item.file_size ?? 0),
    fileUrl: item.fileUrl || getFileDownloadUrl(fileId),
    submittedAt:
      item.submittedAt ||
      item.uploadedAt ||
      item.createdAt ||
      item.submitted_at ||
      "",
    note: item.note,
    status: toSubmissionStatus(item.status),
    feedback: item.feedback,
    feedbackAt: item.feedbackAt || item.reviewedAt || item.feedback_at || item.reviewed_at,
  };
}

function toMeetingSubmission(
  item: Record<string, any>,
  assignment: Record<string, any>,
  department: Record<string, any>
): MeetingMaterialPageSubmission {
  const fileId = item.fileId || item.file_id;

  return {
    id: item.id || "",
    submittedBy: item.submittedBy || assignment.userName || assignment.user_name || "",
    submittedById: item.submittedById || assignment.userId || assignment.user_id || "",
    department: item.department || department.department || "",
    submittedAt: item.submittedAt || item.submitted_at || "",
    fileId,
    fileName: item.fileName || item.file_name || "\u672a\u547d\u540d\u6587\u4ef6",
    fileSize: Number(item.fileSize ?? item.file_size ?? 0),
    fileUrl: item.fileUrl || getFileDownloadUrl(fileId),
    note: item.note,
    version: Number(item.version ?? 0),
    baseVersion: Number(item.baseVersion ?? item.base_version ?? 0),
    status: toSubmissionStatus(item.status),
    feedback: item.feedback,
    feedbackAt: item.feedbackAt || item.reviewedAt || item.feedback_at || item.reviewed_at,
    hasConflict: Boolean(item.hasConflict ?? item.has_conflict),
    conflictDescription: item.conflictDescription || item.conflict_description,
  };
}

function toMeetingUserAssignment(
  item: Record<string, any>,
  department: Record<string, any>
): MeetingMaterialUserAssignment {
  const pages = Array.isArray(item.pages) ? item.pages.map((page: unknown) => Number(page)) : [];

  return {
    id: item.id || "",
    userId: item.userId || item.user_id || "",
    userName: item.userName || item.user_name || "",
    userAvatar: toAvatar(item.userName || item.user_name, item.userAvatar || item.user_avatar),
    department: item.department || department.department || "",
    pages,
    taskDescription: item.taskDescription || item.task_description,
    status: toMeetingUserStatus(item.status),
    submissions: Array.isArray(item.submissions)
      ? item.submissions.map((submission: Record<string, any>) =>
          toMeetingSubmission(submission, item, department)
        )
      : [],
  };
}

function toMeetingDeptAssignment(item: Record<string, any>): MeetingMaterialDeptAssignment {
  return {
    id: item.id || "",
    department: item.department || "",
    pages: Array.isArray(item.pages) ? item.pages.map((page: unknown) => Number(page)) : [],
    requirement: item.requirement,
    headUserId: item.headUserId || item.head_user_id,
    headUserName: item.headUserName || item.head_user_name,
    status: toMeetingDeptStatus(item.status),
    userAssignments: Array.isArray(item.userAssignments)
      ? item.userAssignments.map((assignment: Record<string, any>) =>
          toMeetingUserAssignment(assignment, item)
        )
      : [],
  };
}

function flattenMeetingAssignees(workflow: MeetingMaterialWorkflow): Assignee[] {
  return workflow.deptAssignments.flatMap(department =>
    department.userAssignments.map(userAssignment => ({
      id: userAssignment.id,
      memberId: userAssignment.userId,
      name: userAssignment.userName,
      avatar: userAssignment.userAvatar,
      department: userAssignment.department || department.department,
      taskDescription: userAssignment.taskDescription || department.requirement || "",
      pageRange: formatPageRange(userAssignment.pages),
      status:
        userAssignment.status === MeetingMaterialUserAssignmentStatusEnum.FinalApproved ||
        userAssignment.status === MeetingMaterialUserAssignmentStatusEnum.DeptApproved
          ? AssigneeStatusEnum.Approved
          : userAssignment.status === MeetingMaterialUserAssignmentStatusEnum.Submitted
            ? AssigneeStatusEnum.Submitted
            : userAssignment.status === MeetingMaterialUserAssignmentStatusEnum.Rejected
              ? AssigneeStatusEnum.Rejected
              : userAssignment.status === MeetingMaterialUserAssignmentStatusEnum.InProgress
                ? AssigneeStatusEnum.InProgress
                : AssigneeStatusEnum.Pending,
      submissions: userAssignment.submissions.map(submission => ({
        id: submission.id,
        fileId: submission.fileId,
        fileName: submission.fileName,
        fileSize: submission.fileSize,
        fileUrl: submission.fileUrl,
        submittedAt: submission.submittedAt,
        note: submission.note,
        status: submission.status,
        feedback: submission.feedback,
        feedbackAt: submission.feedbackAt,
      })),
    }))
  );
}

function toMeetingMaterialWorkflow(
  workflowState: Record<string, any>,
  fallbackTemplateFileId?: string
): MeetingMaterialWorkflow {
  const deptAssignments = Array.isArray(workflowState.deptAssignments)
    ? workflowState.deptAssignments.map((item: Record<string, any>) => toMeetingDeptAssignment(item))
    : [];

  const pageVersions: Record<number, number> = {};
  const rawPageVersions = workflowState.pageVersions || workflowState.page_versions || {};

  Object.entries(rawPageVersions).forEach(([page, version]) => {
    pageVersions[Number(page)] = Number(version);
  });

  const mergedFileId = workflowState.mergedFileId || workflowState.merged_file_id;

  return {
    stage: toMeetingStage(workflowState.stage),
    totalPages: Number(workflowState.totalPages ?? workflowState.total_pages ?? 0),
    templateFileId:
      workflowState.templateFileId ||
      workflowState.template_file_id ||
      fallbackTemplateFileId,
    deptAssignments,
    pageVersions,
    reviewerId: workflowState.reviewerId || workflowState.reviewer_id,
    reviewerName: workflowState.reviewerName || workflowState.reviewer_name,
    approverId: workflowState.approverId || workflowState.approver_id,
    approverName: workflowState.approverName || workflowState.approver_name,
    mergedFileId,
    mergedFileName: workflowState.mergedFileName || workflowState.merged_file_name,
    mergedFileUrl: workflowState.mergedFileUrl || getFileDownloadUrl(mergedFileId),
    mergedAt: workflowState.mergedAt || workflowState.merged_at,
    finalApprovedAt: workflowState.finalApprovedAt || workflowState.final_approved_at,
    finalFeedback: workflowState.finalFeedback || workflowState.final_feedback,
  };
}

function toSimpleAssignees(workflowState: Record<string, any>): Assignee[] {
  const rawAssignees = workflowState.assignees || workflowState.userAssignments || [];

  if (!Array.isArray(rawAssignees)) {
    return [];
  }

  return rawAssignees.map((item: Record<string, any>) => ({
    id: item.id || "",
    memberId: item.userId || item.user_id || "",
    name: item.userName || item.user_name || item.name || "",
    avatar: toAvatar(item.userName || item.user_name || item.name, item.userAvatar || item.avatar),
    department: item.department || "",
    taskDescription: item.taskDescription || item.task_description || "",
    pageRange: item.pageRange || item.page_range,
    status: toAssigneeStatus(item.status),
    submissions: Array.isArray(item.submissions)
      ? item.submissions.map((submission: Record<string, any>) => toSubmission(submission))
      : [],
  }));
}

export function adaptBackendTask(taskDetail: Record<string, any>): Task {
  const formKey = taskDetail.formKey || taskDetail.form_key || "";
  const workflowState = (taskDetail.workflowState || taskDetail.workflow_state || {}) as Record<
    string,
    any
  >;
  const type = toTaskType(taskDetail.type, formKey);
  const templateFileId =
    taskDetail.templateFileId ||
    taskDetail.template_file_id ||
    workflowState.templateFileId ||
    workflowState.template_file_id;

  const meetingMaterialWorkflow =
    formKey === TaskFormKeyEnum.PptCollab
      ? toMeetingMaterialWorkflow(workflowState, templateFileId)
      : undefined;
  const assignees =
    formKey === TaskFormKeyEnum.PptCollab && meetingMaterialWorkflow
      ? flattenMeetingAssignees(meetingMaterialWorkflow)
      : toSimpleAssignees(workflowState);
  const completedCount = assignees.filter(
    assignee => assignee.status === AssigneeStatusEnum.Approved
  ).length;
  const totalAssignees = assignees.length;
  const stage = meetingMaterialWorkflow?.stage;

  return {
    id: taskDetail.id || "",
    title: taskDetail.title || taskDetail.name || "\u672a\u547d\u540d\u4efb\u52a1",
    description: taskDetail.description || "",
    type,
    formKey,
    department: taskDetail.department || "",
    createdAt: taskDetail.createdAt || taskDetail.created || "",
    deadline: taskDetail.deadline || taskDetail.due || "",
    createdBy:
      taskDetail.createdBy ||
      taskDetail.createdByName ||
      taskDetail.creatorName ||
      taskDetail.initiatorName ||
      "\u7cfb\u7edf",
    createdByAvatar: toAvatar(
      taskDetail.createdBy ||
        taskDetail.createdByName ||
        taskDetail.creatorName ||
        taskDetail.initiatorName,
      taskDetail.createdByAvatar || taskDetail.creatorAvatar
    ),
    templateFileId,
    templateFileName:
      taskDetail.templateFileName ||
      taskDetail.template_file_name ||
      workflowState.templateFileName ||
      workflowState.template_file_name,
    templateFileSize: Number(
      taskDetail.templateFileSize ??
        taskDetail.template_file_size ??
        workflowState.templateFileSize ??
        workflowState.template_file_size ??
        0
    ) || undefined,
    templatePageCount:
      Number(
        taskDetail.templatePageCount ??
          taskDetail.template_page_count ??
          workflowState.totalPages ??
          workflowState.total_pages ??
          0
      ) || undefined,
    templateFileUrl: getFileDownloadUrl(templateFileId || meetingMaterialWorkflow?.templateFileId),
    totalAssignees,
    completedCount,
    status:
      stage === MeetingMaterialStageEnum.Merged
        ? TaskStatusEnum.Completed
        : TaskStatusEnum.InProgress,
    assignees,
    meetingMaterialWorkflow,
    allowedActions: taskDetail.allowedActions || taskDetail.allowed_actions || [],
    source: TaskSourceEnum.Remote,
  };
}
