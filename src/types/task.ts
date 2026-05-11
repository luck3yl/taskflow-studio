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

export type ReviewStatus = `${ReviewStatusEnum}`;

export type AssigneeStatus = `${AssigneeStatusEnum}`;

export type MeetingMaterialUserAssignmentStatus =
  `${MeetingMaterialUserAssignmentStatusEnum}`;

export type MeetingMaterialDeptAssignmentStatus =
  `${MeetingMaterialDeptAssignmentStatusEnum}`;

export type MeetingMaterialStage = `${MeetingMaterialStageEnum}`;

export type TaskType = `${TaskTypeEnum}`;

export type TaskFormKey = `${TaskFormKeyEnum}` | (string & {});

export type TaskStatus = `${TaskStatusEnum}`;

export type TaskSource = `${TaskSourceEnum}`;

export interface MeetingMaterialPageSubmission {
  id: string;
  submittedBy: string;
  submittedById: string;
  department: string;
  submittedAt: string;
  fileId?: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  note?: string;
  version: number;
  baseVersion: number;
  status: ReviewStatus;
  feedback?: string;
  feedbackAt?: string;
  hasConflict: boolean;
  conflictDescription?: string;
}

export interface MeetingMaterialUserAssignment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  department: string;
  pages: number[];
  taskDescription?: string;
  status: MeetingMaterialUserAssignmentStatus;
  submissions: MeetingMaterialPageSubmission[];
}

export interface MeetingMaterialDeptAssignment {
  id: string;
  department: string;
  pages: number[];
  requirement?: string;
  headUserId?: string;
  headUserName?: string;
  status: MeetingMaterialDeptAssignmentStatus;
  userAssignments: MeetingMaterialUserAssignment[];
}

export interface MeetingMaterialWorkflow {
  stage: MeetingMaterialStage;
  totalPages: number;
  templateFileId?: string;
  deptAssignments: MeetingMaterialDeptAssignment[];
  pageVersions: Record<number, number>;
  reviewerId?: string;
  reviewerName?: string;
  approverId?: string;
  approverName?: string;
  mergedFileId?: string;
  mergedFileName?: string;
  mergedFileUrl?: string;
  mergedAt?: string;
  finalApprovedAt?: string;
  finalFeedback?: string;
}

export interface Submission {
  id: string;
  fileId?: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  submittedAt: string;
  note?: string;
  status: ReviewStatus;
  feedback?: string;
  feedbackAt?: string;
}

export interface Assignee {
  id: string;
  memberId: string;
  name: string;
  avatar: string;
  department: string;
  taskDescription: string;
  pageRange?: string;
  status: AssigneeStatus;
  submissions: Submission[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  formKey?: TaskFormKey;
  department: string;
  createdAt: string;
  deadline: string;
  createdBy: string;
  createdByAvatar: string;
  templateFileId?: string;
  templateFileName?: string;
  templateFileSize?: number;
  templatePageCount?: number;
  templateFileUrl?: string;
  totalAssignees: number;
  completedCount: number;
  status: TaskStatus;
  assignees: Assignee[];
  meetingMaterialWorkflow?: MeetingMaterialWorkflow;
  allowedActions?: string[];
  source?: TaskSource;
}
