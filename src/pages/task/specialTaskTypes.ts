import type { TaskType } from "@/contexts/TaskContext";

export type SpecialTaskType =
  | "标杆机组评价"
  | "培训交流"
  | "例会反馈"
  | "调研反馈"
  | "对标找差"
  | "体系能力评价";

export const SPECIAL_TASK_TYPES: readonly SpecialTaskType[] = [
  "标杆机组评价",
  "培训交流",
  "例会反馈",
  "调研反馈",
  "对标找差",
  "体系能力评价",
] as const;

export function isSpecialTaskType(taskType: TaskType | "all"): taskType is SpecialTaskType {
  return SPECIAL_TASK_TYPES.includes(taskType as SpecialTaskType);
}
