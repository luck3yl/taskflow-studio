import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Users } from "lucide-react";
import { cn, formatPageRange } from "@/lib/utils";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialUserAssignment,
  Task,
} from "@/contexts/TaskContext";
import { hasCapability, type User } from "@/contexts/UserContext";

function userStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="h-5 bg-muted/50 px-2 py-0 text-xs text-muted-foreground">
          待提交
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className="h-5 border-blue-200 bg-blue-50 px-2 py-0 text-xs text-blue-700"
        >
          编辑中
        </Badge>
      );
    case "submitted":
      return (
        <Badge
          variant="outline"
          className="h-5 border-amber-300 bg-amber-100/90 px-2 py-0 text-xs text-amber-700"
        >
          待审核
        </Badge>
      );
    case "dept_approved":
    case "final_approved":
      return (
        <Badge
          variant="outline"
          className="h-5 border-green-200 bg-green-50 px-2 py-0 text-xs text-green-700"
        >
          已通过
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="h-5 border-destructive/20 bg-destructive/10 px-2 py-0 text-xs text-destructive"
        >
          已驳回
        </Badge>
      );
    default:
      return null;
  }
}

interface MeetingMaterialTaskDetailProps {
  task: Task;
  currentUser: User;
  onOpenMeetingMaterialDrawer: () => void;
  onAssignDepartment?: (deptId: string) => void;
  onReviewUser?: (dept: MeetingMaterialDeptAssignment, user: MeetingMaterialUserAssignment) => void;
}

export function MeetingMaterialTaskDetail({
  task,
  currentUser,
  onOpenMeetingMaterialDrawer,
  onAssignDepartment,
}: MeetingMaterialTaskDetailProps) {
  if (!task.meetingMaterialWorkflow) return null;

  const isCreator = currentUser.name === task.createdBy;
  const isTaskReviewer = task.meetingMaterialWorkflow.reviewerId === currentUser.id;
  const canViewAll = hasCapability(currentUser, "task.view.all");
  const canDirectorReview = hasCapability(currentUser, "task.review.director");
  const canCoordinateTask = isCreator || isTaskReviewer || canViewAll;

  const myDepts = task.meetingMaterialWorkflow.deptAssignments.filter(
    (dept) => canCoordinateTask || dept.headUserId === currentUser.id
  );
  const assignableDept = myDepts.find((dept) => dept.headUserId === currentUser.id);
  const canAssignMembers =
    Boolean(assignableDept) &&
    ((task.allowedActions?.includes("assign_pages") ?? false) ||
      hasCapability(currentUser, "task.assign.member"));
  const roomHeadAssignments = myDepts.flatMap((dept) =>
    dept.userAssignments.map((ua) => ({ dept, ua }))
  );

  if (!canCoordinateTask && canDirectorReview && myDepts.length > 0) {
    const submittedCount = roomHeadAssignments.filter(({ ua }) => ua.status === "submitted").length;
    const completedCount = roomHeadAssignments.filter(
      ({ ua }) => ua.status === "dept_approved" || ua.status === "final_approved"
    ).length;
    const rejectedCount = roomHeadAssignments.filter(({ ua }) => ua.status === "rejected").length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            本科室员工任务
            <span className="ml-1 rounded-md bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              已分派 {roomHeadAssignments.length} 人
            </span>
          </h4>
          <div className="flex items-center gap-3">
            <div className="mr-2 flex gap-2.5 rounded-lg bg-secondary/40 px-2.5 py-1 text-xs font-medium">
              <span className="text-amber-600">待审核: {submittedCount}</span>
              <span className="px-0.5 text-muted-foreground/30">|</span>
              <span className="text-green-600">已通过: {completedCount}</span>
              <span className="px-0.5 text-muted-foreground/30">|</span>
              <span className="text-destructive">已驳回: {rejectedCount}</span>
            </div>
            {canAssignMembers && assignableDept && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-border/80 bg-background text-xs shadow-sm hover:bg-secondary/40"
                onClick={(event) => {
                  event.stopPropagation();
                  onAssignDepartment?.(assignableDept.id);
                }}
              >
                <Users className="mr-1 h-3.5 w-3.5" />
                分配员工
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-border/80 bg-background text-xs shadow-sm hover:bg-secondary/40"
              onClick={(event) => {
                event.stopPropagation();
                onOpenMeetingMaterialDrawer();
              }}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              进入工作台
            </Button>
          </div>
        </div>

        {roomHeadAssignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {roomHeadAssignments.map(({ dept, ua }) => {
              const description = ua.taskDescription || dept.requirement || "暂无任务描述";

              return (
                <div
                  key={ua.id}
                  className="group flex items-start gap-3 rounded-lg border border-border/50 bg-card px-3 py-3 transition-colors hover:border-primary/20"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                      {ua.userAvatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground/90">{ua.userName}</p>
                        {userStatusBadge(ua.status)}
                      </div>
                      <Badge
                        variant="secondary"
                        className="h-5 shrink-0 bg-secondary/50 px-1.5 text-[10px] font-medium text-muted-foreground group-hover:bg-secondary/80"
                      >
                        第 {formatPageRange(ua.pages)} 页
                      </Badge>
                    </div>
                    <p
                      className="line-clamp-2 break-all text-xs leading-relaxed text-muted-foreground"
                      title={description}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-secondary/10 px-4 py-8 text-center text-sm text-muted-foreground">
            科室长尚未进行具体分配
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          各部门拆分情况
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs shadow-sm"
          onClick={(event) => {
            event.stopPropagation();
            onOpenMeetingMaterialDrawer();
          }}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          进入工作台
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {task.meetingMaterialWorkflow.deptAssignments.map((dept) => {
          const submittedCount = dept.userAssignments.filter((ua) => ua.status === "submitted").length;
          const completedCount = dept.userAssignments.filter(
            (ua) => ua.status === "dept_approved" || ua.status === "final_approved"
          ).length;
          const rejectedCount = dept.userAssignments.filter((ua) => ua.status === "rejected").length;

          return (
            <button
              key={dept.id}
              type="button"
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              onClick={(event) => {
                event.stopPropagation();
                onOpenMeetingMaterialDrawer();
              }}
            >
              <div className="border-b border-border/50 bg-gradient-to-r from-secondary/40 to-background px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                      <Users className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{dept.department}</span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "min-h-5 shrink-0 whitespace-nowrap border px-2 py-0.5 text-xs shadow-none",
                      dept.status === "pending"
                        ? "bg-muted/50 text-muted-foreground"
                        : dept.status === "dept_approved" || dept.status === "final_approved"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                    )}
                  >
                    {dept.status === "pending"
                      ? "待分配"
                      : dept.status === "dept_approved" || dept.status === "final_approved"
                        ? "已完成"
                        : "进行中"}
                  </Badge>
                </div>
                <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span
                    className="line-clamp-2 break-words leading-relaxed"
                    title={`负责第 ${formatPageRange(dept.pages)} 页`}
                  >
                    负责第 <strong className="font-medium text-foreground/80">{formatPageRange(dept.pages)}</strong> 页
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-b border-border/50 bg-background px-4 py-3">
                <div className="rounded-xl bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-700">待审核</p>
                  <p className="text-base font-semibold text-amber-800">{submittedCount}</p>
                </div>
                <div className="rounded-xl bg-green-50 px-3 py-2">
                  <p className="text-xs text-green-700">已完成</p>
                  <p className="text-base font-semibold text-green-800">{completedCount}</p>
                </div>
                <div className="rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-xs text-red-700">已驳回</p>
                  <p className="text-base font-semibold text-red-800">{rejectedCount}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col bg-secondary/10 px-4 py-3">
                <p className="mb-3 min-h-8 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {dept.requirement || "暂无具体要求"}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="opacity-80">负责人:</span>
                    <span className="font-medium text-foreground">{dept.headUserName || "待指定"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="opacity-80">已分配:</span>
                    <span className="font-medium text-foreground">{dept.userAssignments.length}人</span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
