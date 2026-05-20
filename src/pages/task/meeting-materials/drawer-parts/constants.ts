import { MEETING_MATERIAL_STAGE_CONFIG } from "@/enums/task";
import type { MeetingMaterialStage } from "@/contexts/TaskContext";

export const stageLabel = Object.fromEntries(
  Object.entries(MEETING_MATERIAL_STAGE_CONFIG).map(([k, v]) => [k, v.text])
) as Record<MeetingMaterialStage, string>;

export const stageColor = Object.fromEntries(
  Object.entries(MEETING_MATERIAL_STAGE_CONFIG).map(([k, v]) => [k, v.className])
) as Record<MeetingMaterialStage, string>;

export const approveQuickFeedbacks = [
  "准允通过",
  "数据有误，请核实",
  "格式需要调整",
  "内容不够完整",
  "请补充更多细节",
];

export const rejectQuickFeedbacks = [
  "数据有误，请核实",
  "格式需要调整",
  "内容不够完整",
  "请补充更多细节",
];

export interface AssignDraft {
  userId: string;
  userName: string;
  userAvatar: string;
  department: string;
  pages: number[];
  taskDescription?: string;
}
