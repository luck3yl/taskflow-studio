import { useMemo } from "react";
import { hasCapability, isManagementUser, type Department, type User } from "@/contexts/UserContext";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialUserAssignment,
  MeetingMaterialWorkflow,
} from "@/contexts/TaskContext";
import type { Task } from "@/types/task";

interface Args {
  task: Task | undefined;
  workflow: MeetingMaterialWorkflow | undefined;
  currentUser: User;
  users: User[];
  departments: Department[];
}

/**
 * 集中计算例会资料 Drawer 用到的派生数据 / 权限。
 * 把原本上千行 JSX 中散落的 const 计算和 for 循环聚拢到一个 hook，便于复用与单测。
 */
export function useMeetingMaterialDrawerData({
  task,
  workflow,
  currentUser,
  users,
  departments,
}: Args) {
  return useMemo(() => {
    if (!task || !workflow) {
      return null;
    }

    const myDeptHead = workflow.deptAssignments.find(
      dept => dept.headUserId === currentUser.id
    );

    const isCreator = currentUser.name === task.createdBy;
    const isTaskReviewer = workflow.reviewerId === currentUser.id;
    const canViewAllTasks = hasCapability(currentUser, "task.view.all");
    const canMergeByRole = hasCapability(currentUser, "task.merge");
    const canDirectorReviewByRole = hasCapability(currentUser, "task.review.director");

    const canCoordinateTask =
      isCreator ||
      isTaskReviewer ||
      canViewAllTasks ||
      canMergeByRole ||
      (task.allowedActions?.includes("mark_merged") ?? false);

    const canAssignPages =
      (task.allowedActions?.includes("assign_pages") ?? false) ||
      (!!myDeptHead && hasCapability(currentUser, "task.assign.member"));

    const isDeptHeadOnly = !!myDeptHead && !canCoordinateTask;
    const canReviewTask =
      (task.allowedActions?.includes("review") ?? false) || canDirectorReviewByRole;

    // 我的任务（员工视角）
    const myAssignments: {
      dept: MeetingMaterialDeptAssignment;
      ua: MeetingMaterialUserAssignment;
    }[] = [];
    for (const dept of workflow.deptAssignments) {
      for (const ua of dept.userAssignments) {
        if (ua.userId === currentUser.id) {
          myAssignments.push({ dept, ua });
        }
      }
    }

    // 当前用户可见的部门
    const visibleDepts = workflow.deptAssignments.filter(
      dept =>
        canCoordinateTask ||
        dept.headUserId === currentUser.id ||
        dept.department === currentUser.department
    );
    const visibleAssignments = visibleDepts.flatMap(d => d.userAssignments);
    const visibleConflictCount = [
      ...new Set(
        visibleDepts.flatMap(dept =>
          dept.userAssignments.flatMap(ua =>
            ua.submissions.flatMap(sub => {
              if (!sub.hasConflict) return [] as number[];
              return ua.pages.filter(
                page => (workflow.pageVersions[page] || 0) > sub.baseVersion
              );
            })
          )
        )
      ),
    ].length;

    const deptHeadSubmittedCount = visibleAssignments.filter(
      ua => ua.status === "submitted"
    ).length;
    const deptHeadCompletedCount = visibleAssignments.filter(
      ua => ua.status === "dept_approved" || ua.status === "final_approved"
    ).length;
    const deptHeadRejectedCount = visibleAssignments.filter(
      ua => ua.status === "rejected"
    ).length;
    const isSingleDeptHeadView = isDeptHeadOnly && visibleDepts.length === 1;

    // 全局统计
    const totalUserAssignments = workflow.deptAssignments.flatMap(d => d.userAssignments);
    const reviewedCount = totalUserAssignments.filter(
      ua => ua.status === "dept_approved" || ua.status === "final_approved"
    ).length;
    const totalCount = totalUserAssignments.length;

    // 冲突页
    const conflictPages: number[] = [];
    for (const dept of workflow.deptAssignments) {
      for (const ua of dept.userAssignments) {
        for (const sub of ua.submissions) {
          if (sub.hasConflict) {
            conflictPages.push(
              ...ua.pages.filter(p => {
                const ver = workflow.pageVersions[p] || 0;
                return ver > sub.baseVersion;
              })
            );
          }
        }
      }
    }
    const uniqueConflictPages = [...new Set(conflictPages)];

    const canMarkMerged =
      ((task.allowedActions?.includes("mark_merged") ?? false) ||
        isCreator ||
        isTaskReviewer ||
        canMergeByRole) &&
      totalCount > 0 &&
      reviewedCount === totalCount &&
      workflow.stage !== "merged";

    const canViewMergedFile =
      !isDeptHeadOnly &&
      (workflow.stage === "merged" ||
        !!workflow.mergedFileUrl ||
        (canCoordinateTask && totalCount > 0 && reviewedCount === totalCount));

    const mergedFileName = workflow.mergedFileName || `${task.title}_合并版.pptx`;

    // 分配候选用户解析（递归子部门）
    const collectDeptNames = (departmentName?: string): string[] => {
      if (!departmentName) return [];
      const currentDepartment = departments.find(d => d.name === departmentName);
      if (!currentDepartment) return [departmentName];
      const childDepartments = departments
        .filter(d => d.parentId === currentDepartment.id)
        .flatMap(d => collectDeptNames(d.name));
      return [departmentName, ...childDepartments];
    };

    const getAssignableUsers = (deptName?: string) =>
      deptName
        ? users.filter(
            u => collectDeptNames(deptName).includes(u.department) && !isManagementUser(u)
          )
        : [];

    const getDeptOccupiedPages = (deptId?: string, excludeUserId?: string): number[] => {
      if (!deptId) return [];
      const dept = workflow.deptAssignments.find(item => item.id === deptId);
      if (!dept) return [];
      return dept.userAssignments
        .filter(ua => ua.userId !== excludeUserId)
        .flatMap(ua => ua.pages);
    };

    return {
      myDeptHead,
      isCreator,
      isTaskReviewer,
      canCoordinateTask,
      canAssignPages,
      isDeptHeadOnly,
      canReviewTask,
      myAssignments,
      visibleDepts,
      visibleConflictCount,
      deptHeadSubmittedCount,
      deptHeadCompletedCount,
      deptHeadRejectedCount,
      isSingleDeptHeadView,
      reviewedCount,
      totalCount,
      uniqueConflictPages,
      canMarkMerged,
      canViewMergedFile,
      mergedFileName,
      getAssignableUsers,
      getDeptOccupiedPages,
    };
  }, [task, workflow, currentUser, users, departments]);
}
