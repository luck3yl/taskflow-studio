import type { FlowableTaskDto } from "@/services/apis/tasks";

/**
 * 判断当前用户是否可操作该任务
 *
 * 规则：
 * - 只有 assignee === currentUserId 的用户才能执行操作
 * - 没有 assignee 的任务，任何人都不能在任务列表中直接操作
 *   （这类任务通过 my-todos 接口判断归属）
 */
export function canOperateTask(
  task: Pick<FlowableTaskDto, "assignee" | "formKey">,
  currentUserId: string
): boolean {
  if (!task.assignee) return false;
  return task.assignee === currentUserId;
}

/**
 * formKey → action 映射表
 */
export const FORM_KEY_ACTION_MAP: Record<string, string> = {
  ppt_collab_dept_assign: "dept_assign",
  ppt_collab_assign: "assign_pages",
  ppt_collab_submit: "submit",
  ppt_collab_review: "review",
  ppt_collab_merge: "mark_merged", // 或 reject_all
};
