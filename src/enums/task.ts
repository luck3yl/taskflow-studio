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
  Created            = "created",              // 已创建，等待发起人分配部门
  DeptAssignment     = "dept_assignment",
  // UserAssignment = "user_assignment",       // 废弃：后端不再使用
  InProgress         = "in_progress",
  DeptReviewing      = "dept_reviewing",
  FinalReviewing     = "final_reviewing",
  FinalApproved      = "final_approved",       // 终审通过，等待发起人合并
  Approved           = "approved",
  Merged             = "merged",
}

export enum TaskTypeEnum {
  ResearchFeedback = "调研反馈",
  MeetingFeedback = "例会反馈",
  MeetingMaterial = "例会资料",
  SupervisionAffairs = "督办事务",
  ActionPlan = "行动计划",
  TrainingExchange = "培训交流",
  OtherMountainStone = "他山之石",
  BenchmarkEvaluation = "标杆机组评价",
  SystemCapabilityEvaluation = "体系能力评价",
}

export enum TaskFormKeyEnum {
  PptCollab = "ppt_collab",
  SimpleSubmit = "simple_submit",
  FormDynamic = "form_dynamic",
  // PPT 协同子 formKey（Flowable User Task 节点）
  PptCollabDeptAssign   = "ppt_collab_dept_assign",
  PptCollabAssign       = "ppt_collab_assign",
  PptCollabSubmit       = "ppt_collab_submit",
  PptCollabReview       = "ppt_collab_review",
  PptCollabFinalApprove = "ppt_collab_final_approve",
  PptCollabMerge        = "ppt_collab_merge",
}

export enum TaskStatusEnum {
  InProgress = "in_progress",
  Completed = "completed",
}

export enum TaskSourceEnum {
  Local = "local",
  Remote = "remote",
}

// ---- 状态显示配置 ----

export interface StatusDisplayConfig {
  text: string;
  description: string;
  className: string; // Badge 的 tailwind 样式
  dotColor?: string; // 状态圆点颜色
}

/** 例会资料 - 用户分配状态显示配置 */
export const MEETING_MATERIAL_USER_STATUS_CONFIG: Record<
  MeetingMaterialUserAssignmentStatusEnum,
  StatusDisplayConfig
> = {
  [MeetingMaterialUserAssignmentStatusEnum.Pending]: {
    text: "待提交",
    description: "等待用户提交内容",
    className: "bg-muted/50 text-muted-foreground border-muted-foreground/10",
    dotColor: "bg-muted-foreground",
  },
  [MeetingMaterialUserAssignmentStatusEnum.InProgress]: {
    text: "编辑中",
    description: "用户正在编辑内容",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  [MeetingMaterialUserAssignmentStatusEnum.Submitted]: {
    text: "待审核",
    description: "已提交，等待审核",
    className: "bg-amber-100/90 text-amber-700 border-amber-300",
    dotColor: "bg-warning",
  },
  [MeetingMaterialUserAssignmentStatusEnum.DeptApproved]: {
    text: "已通过",
    description: "部门审核通过",
    className: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-success",
  },
  [MeetingMaterialUserAssignmentStatusEnum.FinalApproved]: {
    text: "已通过",
    description: "终审通过",
    className: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-success",
  },
  [MeetingMaterialUserAssignmentStatusEnum.Rejected]: {
    text: "已驳回",
    description: "审核未通过",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
};

/** 例会资料 - 部门分配状态显示配置 */
export const MEETING_MATERIAL_DEPT_STATUS_CONFIG: Record<
  MeetingMaterialDeptAssignmentStatusEnum,
  StatusDisplayConfig
> = {
  [MeetingMaterialDeptAssignmentStatusEnum.Pending]: {
    text: "待分配",
    description: "等待分配员工",
    className: "bg-muted/50 text-muted-foreground",
    dotColor: "bg-muted-foreground",
  },
  [MeetingMaterialDeptAssignmentStatusEnum.InProgress]: {
    text: "进行中",
    description: "员工正在编辑中",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dotColor: "bg-amber-500",
  },
  [MeetingMaterialDeptAssignmentStatusEnum.DeptApproved]: {
    text: "已完成",
    description: "部门审核通过",
    className: "border-green-200 bg-green-50 text-green-700",
    dotColor: "bg-green-500",
  },
  [MeetingMaterialDeptAssignmentStatusEnum.FinalApproved]: {
    text: "已完成",
    description: "终审通过",
    className: "border-green-200 bg-green-50 text-green-700",
    dotColor: "bg-green-500",
  },
};

/** 通用任务 assignee 状态显示配置 */
export const ASSIGNEE_STATUS_CONFIG: Record<AssigneeStatusEnum, StatusDisplayConfig> = {
  [AssigneeStatusEnum.Pending]: {
    text: "待提交",
    description: "等待提交",
    className: "bg-muted/50 text-muted-foreground border-muted-foreground/10",
    dotColor: "bg-muted-foreground",
  },
  [AssigneeStatusEnum.InProgress]: {
    text: "编辑中",
    description: "正在编辑",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  [AssigneeStatusEnum.Submitted]: {
    text: "待审核",
    description: "已提交，等待审核",
    className: "bg-amber-100/90 text-amber-700 border-amber-300",
    dotColor: "bg-warning",
  },
  [AssigneeStatusEnum.Approved]: {
    text: "已通过",
    description: "审核通过",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  [AssigneeStatusEnum.Rejected]: {
    text: "已驳回",
    description: "审核未通过",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
};

/** 例会资料 - 阶段（stage）显示配置 */
export const MEETING_MATERIAL_STAGE_CONFIG: Record<MeetingMaterialStageEnum, StatusDisplayConfig> = {
  [MeetingMaterialStageEnum.Created]: {
    text: "待分配部门",
    description: "已创建，等待发起人分配部门",
    className: "bg-gray-200 text-gray-700",
  },
  [MeetingMaterialStageEnum.DeptAssignment]: {
    text: "待分配部门",
    description: "等待分配部门",
    className: "bg-gray-200 text-gray-700",
  },
  [MeetingMaterialStageEnum.InProgress]: {
    text: "编辑中",
    description: "员工正在编辑内容",
    className: "bg-amber-100 text-amber-700",
  },
  [MeetingMaterialStageEnum.DeptReviewing]: {
    text: "审核中",
    description: "部门负责人审核中",
    className: "bg-purple-100 text-purple-700",
  },
  [MeetingMaterialStageEnum.FinalReviewing]: {
    text: "终审中",
    description: "终审审核中",
    className: "bg-orange-100 text-orange-700",
  },
  [MeetingMaterialStageEnum.FinalApproved]: {
    text: "终审通过",
    description: "终审通过，等待发起人合并",
    className: "bg-blue-100 text-blue-700",
  },
  [MeetingMaterialStageEnum.Approved]: {
    text: "审核完成",
    description: "所有审核已完成",
    className: "bg-green-100 text-green-700",
  },
  [MeetingMaterialStageEnum.Merged]: {
    text: "已合并",
    description: "文件已合并完成",
    className: "bg-emerald-100 text-emerald-700",
  },
};

export const TASK_TYPE_TO_FORM_KEY: Record<TaskTypeEnum, TaskFormKeyEnum> = {
  [TaskTypeEnum.ResearchFeedback]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.MeetingFeedback]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.MeetingMaterial]: TaskFormKeyEnum.PptCollab,
  [TaskTypeEnum.SupervisionAffairs]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.ActionPlan]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.TrainingExchange]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.OtherMountainStone]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.BenchmarkEvaluation]: TaskFormKeyEnum.SimpleSubmit,
  [TaskTypeEnum.SystemCapabilityEvaluation]: TaskFormKeyEnum.SimpleSubmit,
};
