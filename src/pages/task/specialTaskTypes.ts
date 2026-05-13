import { TaskTypeEnum } from "@/enums/task";
import type { TaskType } from "@/contexts/TaskContext";

export type SpecialTaskType =
  | TaskTypeEnum.BenchmarkEvaluation
  | TaskTypeEnum.TrainingExchange
  | TaskTypeEnum.MeetingFeedback
  | TaskTypeEnum.ResearchFeedback
  | TaskTypeEnum.SystemCapabilityEvaluation;

export const SPECIAL_TASK_TYPES: readonly SpecialTaskType[] = [
  TaskTypeEnum.BenchmarkEvaluation,
  TaskTypeEnum.TrainingExchange,
  TaskTypeEnum.MeetingFeedback,
  TaskTypeEnum.ResearchFeedback,
  TaskTypeEnum.SystemCapabilityEvaluation,
] as const;

export function isSpecialTaskType(taskType: TaskType | "all"): taskType is SpecialTaskType {
  return SPECIAL_TASK_TYPES.includes(taskType as SpecialTaskType);
}
