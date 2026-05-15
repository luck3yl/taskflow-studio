import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Users } from "lucide-react";
import { cn, formatPageRange } from "@/lib/utils";
import type {
  MeetingMaterialUserAssignment,
  Task,
} from "@/contexts/TaskContext";
import type { User } from "@/contexts/UserContext";
import { StatusBadge } from "./components/StatusBadge";

interface MeetingMaterialTaskDetailProps {
  task: Task;
  currentUser: User;
  onOpenMeetingMaterialDrawer: () => void;
  onAssignDepartment?: (deptId: string) => void;
}

export function MeetingMaterialTaskDetail({
  task,
  currentUser,
  onOpenMeetingMaterialDrawer,
}: MeetingMaterialTaskDetailProps) {
  if (!task.meetingMaterialWorkflow) return null;

  const { deptAssignments } = task.meetingMaterialWorkflow;

  // 判断当前用户是否是某个部门的负责人（室主任）
  const myDept = deptAssignments.find((d) => d.headUserId === currentUser.id);
  const isRoomHead = !!myDept && !isCreatorOrAdmin();

  function isCreatorOrAdmin() {
    // 发起人或有全局查看权限的用户看全局视图
    return currentUser.name === task.createdBy ||
      currentUser.roles.some((r) => ["设备部长", "分管副部长", "设备厂长"].includes(r));
  }

  // 室主任视图：只看自己部门的员工
  if (isRoomHead && myDept) {
    const userAssignments = myDept.userAssignments;
    const submittedCount = userAssignments.filter((ua) => ua.status === "submitted").length;
    const completedCount = userAssignments.filter(
      (ua) => ua.status === "dept_approved" || ua.status === "final_approved"
    ).length;
    const rejectedCount = userAssignments.filter((ua) => ua.status === "rejected").length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            {myDept.department} · 员工任务
            <span className="ml-1 rounded-md bg-secondary/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              已分配 {userAssignments.length} 人
            </span>
          </h4>
          <div className="flex items-center gap-3">
            {userAssignments.length > 0 && (
              <div className="flex gap-2.5 rounded-lg bg-secondary/40 px-2.5 py-1 text-xs font-medium">
                <span className="text-amber-600">待审核: {submittedCount}</span>
                <span className="px-0.5 text-muted-foreground/30">|</span>
                <span className="text-green-600">已通过: {completedCount}</span>
                <span className="px-0.5 text-muted-foreground/30">|</span>
                <span className="text-destructive">已驳回: {rejectedCount}</span>
              </div>
            )}
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
        </div>

        {userAssignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {userAssignments.map((ua) => (
              <div
                key={ua.id}
                className="group flex items-start gap-3 rounded-lg border border-border/50 bg-card px-3 py-3 transition-colors hover:border-primary/20"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                    {ua.userAvatar || ua.userName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground/90">{ua.userName || ua.userId}</p>
                      <StatusBadge status={ua.status} type="user" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="h-5 shrink-0 bg-secondary/50 px-1.5 text-[10px] font-medium text-muted-foreground"
                    >
                      第 {formatPageRange(ua.pages)} 页
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {ua.taskDescription || "暂无任务描述"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-secondary/10 px-4 py-8 text-center text-sm text-muted-foreground">
            尚未分配员工
          </div>
        )}
      </div>
    );
  }

  // 部长/发起人视图：看所有部门
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          各部门分配情况
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

      {deptAssignments.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deptAssignments.map((dept) => {
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
                    <span className="line-clamp-2 break-words leading-relaxed">
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
      ) : (
        <div className="rounded-xl border border-dashed border-border/50 bg-secondary/10 px-4 py-8 text-center text-sm text-muted-foreground">
          尚未分配部门
        </div>
      )}
    </div>
  );
}
