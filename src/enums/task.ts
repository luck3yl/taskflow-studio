export enum ReviewStatusEnum {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

export enum AssigneeStatusEnum {
  Pending = "pending",
  InProgress = "in_progress",
  Submitted = "submitted",
  Approved = "approved",
  Rejected = "rejected",
}

export enum MeetingMaterialUserAssignmentStatusEnum {
  Pending = "pending",
  InProgress = "in_progress",
  Submitted = "submitted",
  DeptApproved = "dept_approved",
  FinalApproved = "final_approved",
  Rejected = "rejected",
}

export enum MeetingMaterialDeptAssignmentStatusEnum {
  Pending = "pending",
  InProgress = "in_progress",
  DeptApproved = "dept_approved",
  FinalApproved = "final_approved",
}

export enum MeetingMaterialStageEnum {
  DeptAssignment = "dept_assignment",
  UserAssignment = "user_assignment",
  InProgress = "in_progress",
  DeptReviewing = "dept_reviewing",
  FinalReviewing = "final_reviewing",
  Approved = "approved",
  Merged = "merged",
}

export enum TaskTypeEnum {
  ResearchFeedback = "调研反馈",
  MeetingFeedback = "例会反馈",
  BenchmarkEvaluation = "标杆机组评价",
  SystemCapabilityEvaluation = "体系能力评价",
  Benchmarking = "对标找差",
  TrainingExchange = "培训交流",
  MeetingMaterial = "例会资料",
}

export enum TaskFormKeyEnum {
  PptCollab = "ppt_collab",
  SimpleSubmit = "simple_submit",
  FormDynamic = "form_dynamic",
}

export enum TaskStatusEnum {
  InProgress = "in_progress",
  Completed = "completed",
}

export enum TaskSourceEnum {
  Local = "local",
  Remote = "remote",
}

export const TASK_TYPE_TO_FORM_KEY: Record<TaskTypeEnum, TaskFormKeyEnum> = {
  [TaskTypeEnum.ResearchFeedback]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.MeetingFeedback]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.BenchmarkEvaluation]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.SystemCapabilityEvaluation]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.Benchmarking]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.TrainingExchange]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.MeetingMaterial]: TaskFormKeyEnum.PptCollab,
};
