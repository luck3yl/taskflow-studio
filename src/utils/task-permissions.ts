import type { FlowableTaskDto } from "@/services/apis/tasks";

/**
 * 判断当前用户是否可操作该任务
 *
 * 规则：
 * - 所有用户都能看到所有任务
 * - 只有 assignee === currentUserId 的用户才能执行操作
 * - submit 任务没有 assignee（Flowable 层面不指定），需要从 my-todos 判断
 */
export function canOperateTask(
  task: Pick<FlowableTaskDto, "assignee" | "formKey">,
  currentUserId: string
): boolean {
  // submit 任务没有 assignee，需要从 my-todos 判断
  if (task.formKey === "ppt_collab_submit") {
    return task.assignee === currentUserId || !task.assignee;
  }
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
