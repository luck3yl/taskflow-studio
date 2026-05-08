import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Eye, FileText } from "lucide-react";
import { cn, formatPageRange } from "@/lib/utils";
import type {
  MeetingMaterialDeptAssignment,
  MeetingMaterialUserAssignment,
  Task,
} from "@/contexts/TaskContext";
import { hasCapability, type User } from "@/contexts/UserContext";

// 用户状态标签
function userStatusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-muted/50 text-muted-foreground">待提交</Badge>;
    case "in_progress": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">编辑中</Badge>;
    case "submitted": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-amber-100/90 text-amber-700 border-amber-300">待审核</Badge>;
    case "dept_approved": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">室主任已审核</Badge>;
    case "final_approved": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-success/10 text-success border-success/20">部长已审批</Badge>;
    case "rejected": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-destructive/10 text-destructive border-destructive/20">已驳回</Badge>;
    default: return null;
  }
}

interface MeetingMaterialTaskDetailProps {
  task: Task;
  currentUser: User;
  onOpenMeetingMaterialDrawer: () => void;
  onReviewUser?: (dept: MeetingMaterialDeptAssignment, user: MeetingMaterialUserAssignment) => void;
}

export function MeetingMaterialTaskDetail({
  task,
  currentUser,
  onOpenMeetingMaterialDrawer,
  onReviewUser,
}: MeetingMaterialTaskDetailProps) {
  if (!task.meetingMaterialWorkflow) return null;

  const canDirectorReview = hasCapability(currentUser, "task.review.director");
  const canMinisterReview = hasCapability(currentUser, "task.review.minister") || hasCapability(currentUser, "task.view.all");

  // 室主任：只看自己负责的部门的员工详情
  // 部长：看所有部门的员工详情
  const myDepts = task.meetingMaterialWorkflow.deptAssignments.filter(dept =>
    canMinisterReview || dept.headUserId === currentUser.id
  );
  const roomHeadAssignments = myDepts.flatMap(dept =>
    dept.userAssignments.map(ua => ({ dept, ua }))
  );

  if (!canMinisterReview && canDirectorReview && myDepts.length > 0) {
    const submittedCount = roomHeadAssignments.filter(({ ua }) => ua.status === "submitted").length;
    const waitingFinalCount = roomHeadAssignments.filter(({ ua }) => ua.status === "dept_approved").length;
    const finalApprovedCount = roomHeadAssignments.filter(({ ua }) => ua.status === "final_approved").length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            本科室员工任务
            <span className="text-xs font-normal text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded-md ml-1">已分派 {roomHeadAssignments.length} 人</span>
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex gap-2.5 mr-2 text-xs font-medium bg-secondary/40 px-2.5 py-1 rounded-lg">
              <span className="text-amber-600">待主任审批: {submittedCount}</span>
              <span className="text-muted-foreground/30 px-0.5">|</span>
              <span className="text-orange-600">待部长终审: {waitingFinalCount}</span>
              <span className="text-muted-foreground/30 px-0.5">|</span>
              <span className="text-green-600">已终审: {finalApprovedCount}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shadow-sm bg-background border-border/80 hover:bg-secondary/40"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMeetingMaterialDrawer();
              }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              进入工作台
            </Button>
          </div>
        </div>

        {roomHeadAssignments.length > 0 ? (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {roomHeadAssignments.map(({ dept, ua }) => {
              const description = ua.taskDescription || dept.requirement || "暂无任务描述";

              return (
                <div key={ua.id} className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-3 bg-card hover:border-primary/20 transition-colors group">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-medium">
                      {ua.userAvatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground/90">{ua.userName}</p>
                        {userStatusBadge(ua.status)}
                      </div>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium bg-secondary/50 text-muted-foreground group-hover:bg-secondary/80 shrink-0">
                        第 {formatPageRange(ua.pages)} 页
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-all" title={description}>
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground bg-secondary/10 border border-dashed border-border/50 rounded-xl">
            科室长尚未进行具体分配
          </div>
        )}
      </div>
    );
  }

  // 其他角色：展示部门卡片
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          各部门拆分情况
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMeetingMaterialDrawer();
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          进入工作台
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {task.meetingMaterialWorkflow.deptAssignments.map((dept) => {
        const submittedCount = dept.userAssignments.filter(ua => ua.status === "submitted").length;
        const waitingFinalCount = dept.userAssignments.filter(ua => ua.status === "dept_approved").length;
        const completedCount = dept.userAssignments.filter(ua => ua.status === "final_approved").length;

        return (
          <button
            key={dept.id}
            type="button"
            className="text-left flex flex-col h-full rounded-2xl border border-border/70 bg-card shadow-sm hover:border-primary/30 hover:shadow-md transition-all overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMeetingMaterialDrawer();
            }}
          >
            <div className="px-4 py-4 bg-gradient-to-r from-secondary/40 to-background border-b border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold flex items-center gap-2 text-foreground truncate">
                    <Users className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{dept.department}</span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-0.5 min-h-5 border shadow-none shrink-0 whitespace-nowrap",
                    dept.status === "pending"
                      ? "bg-muted/50 text-muted-foreground"
                      : dept.status === "final_approved"
                      ? "bg-success/10 text-success border-success/20"
                      : dept.status === "dept_approved"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-warning/10 text-warning border-warning/20"
                  )}
                >
                  {dept.status === "pending"
                    ? "待分配"
                    : dept.status === "final_approved"
                    ? "已完成"
                    : dept.status === "dept_approved"
                    ? "待终审"
                    : "进行中"}
                </Badge>
              </div>
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0 text-primary/60 mt-0.5" />
                <span className="leading-relaxed line-clamp-2 break-words" title={`负责第 ${formatPageRange(dept.pages)} 页`}>
                  负责第 <strong className="font-medium text-foreground/80">{formatPageRange(dept.pages)}</strong> 页
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-background border-b border-border/50">
              <div className="rounded-xl bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">待审核</p>
                <p className="text-base font-semibold text-amber-800">{submittedCount}</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-2">
                <p className="text-xs text-orange-700">待终审</p>
                <p className="text-base font-semibold text-orange-800">{waitingFinalCount}</p>
              </div>
              <div className="rounded-xl bg-green-50 px-3 py-2">
                <p className="text-xs text-green-700">已完成</p>
                <p className="text-base font-semibold text-green-800">{completedCount}</p>
              </div>
            </div>

            <div className="px-4 py-3 flex flex-col flex-1 bg-secondary/10">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-8 mb-3">
                {dept.requirement || "暂无具体要求"}
              </p>
              <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
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
