import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task } from "@/contexts/TaskContext";
import type { User } from "@/contexts/UserContext";
import { hasCapability } from "@/contexts/UserContext";
import { MeetingMaterialTaskDetail } from "../MeetingMaterialTaskDetail";
import { MeetingMaterialTaskDrawer } from "../MeetingMaterialTaskDrawer";
import {
  ASSIGNEE_STATUS_CONFIG,
  MEETING_MATERIAL_USER_STATUS_CONFIG,
} from "@/enums/task";

const statusStyles: Record<string, { bg: string; dot: string }> = Object.fromEntries(
  Object.entries(ASSIGNEE_STATUS_CONFIG).map(([k, v]) => [
    k,
    { bg: v.className.split(" ")[0] || "bg-muted", dot: v.dotColor || "bg-muted-foreground" },
  ])
);

const userAssignmentStatusStyles: Record<string, { bg: string; dot: string }> = Object.fromEntries(
  Object.entries(MEETING_MATERIAL_USER_STATUS_CONFIG).map(([k, v]) => [
    k,
    { bg: v.className.split(" ")[0] || "bg-muted", dot: v.dotColor || "bg-muted-foreground" },
  ])
);

interface MeetingMaterialTaskListItemProps {
  task: Task;
  index: number;
  currentUser: User;
  onDeleteTask: (taskId: string) => void;
}

export function MeetingMaterialTaskListItem({
  task,
  index,
  currentUser,
  onDeleteTask,
}: MeetingMaterialTaskListItemProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [initialDeptId, setInitialDeptId] = useState<string | undefined>(undefined);

  const openDrawer = (deptId?: string) => {
    setInitialDeptId(deptId);
    setDrawerOpen(true);
  };

  // 根据当前用户角色，决定头像区域展示哪些人
  const visibleAvatars = useMemo(() => {
    const workflow = task.meetingMaterialWorkflow;
    if (!workflow) return [];

    const canViewAll = hasCapability(currentUser, "task.view.all");
    const isCreator = currentUser.name === task.createdBy;
    const canMinisterReview = hasCapability(currentUser, "task.review.minister");

    // 部长/发起人/厂长：展示各部门负责人
    if (canViewAll || canMinisterReview || isCreator) {
      return workflow.deptAssignments
        .filter((d) => d.headUserName)
        .map((d) => ({
          id: d.id,
          name: d.headUserName!,
          avatar: d.headUserName!.charAt(0),
          status: d.status,
          label: d.department,
        }));
    }

    // 室主任：展示自己部门下的员工
    const myDept = workflow.deptAssignments.find(
      (d) => d.headUserId === currentUser.id
    );
    if (myDept) {
      return myDept.userAssignments.map((ua) => ({
        id: ua.id,
        name: ua.userName,
        avatar: ua.userAvatar || ua.userName.charAt(0),
        status: ua.status,
        label: undefined,
      }));
    }

    // 普通职员：展示自己（如果在分配中）
    for (const dept of workflow.deptAssignments) {
      const myAssignment = dept.userAssignments.find(
        (ua) => ua.userId === currentUser.id
      );
      if (myAssignment) {
        return [{
          id: myAssignment.id,
          name: myAssignment.userName,
          avatar: myAssignment.userAvatar || myAssignment.userName.charAt(0),
          status: myAssignment.status,
          label: undefined,
        }];
      }
    }

    return [];
  }, [task, currentUser]);

  return (
    <>
      <Collapsible
        open={isExpanded}
        onOpenChange={() => setIsExpanded((prev) => !prev)}
      >
        <Card
          className="shadow-card animate-slide-up overflow-hidden"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="space-y-2">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    {task.description && (
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {task.department || task.type}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        task.status === "active" && "text-blue-600 border-blue-300 bg-blue-50",
                        task.status === "final_approved" && "text-emerald-600 border-emerald-300 bg-emerald-50",
                        task.status === "merged" && "text-green-600 border-green-300 bg-green-50",
                        task.status === "rejected" && "text-red-600 border-red-300 bg-red-50",
                      )}>
                        {task.status === "active" && "进行中"}
                        {task.status === "final_approved" && "终审通过"}
                        {task.status === "merged" && "已完成"}
                        {task.status === "rejected" && "已驳回"}
                        {!["active", "final_approved", "merged", "rejected"].includes(task.status) && task.status}
                      </Badge>
                      {task.meetingMaterialWorkflow?.deptAssignments && task.meetingMaterialWorkflow.deptAssignments.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {task.meetingMaterialWorkflow.deptAssignments.map(d => d.department).join("、")}
                        </span>
                      )}
                      {task.templatePageCount && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          {task.templatePageCount}页
                        </Badge>
                      )}
                      {task.deadline && (
                        <span className="text-xs text-muted-foreground">
                          截止：{task.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* 根据角色展示相关人员头像 */}
                  <div className="hidden md:flex -space-x-2">
                    {visibleAvatars.slice(0, 4).map((person) => {
                      const styles = userAssignmentStatusStyles[person.status] ?? statusStyles[person.status];
                      return (
                        <Avatar
                          key={person.id}
                          className="h-8 w-8 border-2 border-card"
                          title={person.label ? `${person.name}（${person.label}）` : person.name}
                        >
                          <AvatarFallback className={`text-xs ${styles?.bg ?? "bg-muted"}`}>
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {visibleAvatars.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{visibleAvatars.length - 4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 节点操作按钮：跳转到统一动态任务详情页，按 formKey 渲染 */}
                  {task.formKey === "ppt_collab_dept_assign" && (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm gap-1.5 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/detail/${task.id}`);
                      }}
                    >
                      <Users className="h-3.5 w-3.5" />
                      分配部门
                    </Button>
                  )}

                  {task.formKey === "ppt_collab_assign" && (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm gap-1.5 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/detail/${task.id}`);
                      }}
                    >
                      <Users className="h-3.5 w-3.5" />
                      分配员工
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/detail/${task.id}`);
                      }}>
                        进入任务页
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        openDrawer();
                      }}>
                        旧版工作台
                      </DropdownMenuItem>
                      <DropdownMenuItem>编辑任务</DropdownMenuItem>
                      <DropdownMenuItem>催办提醒</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除任务
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="border-t border-border pt-4 space-y-6">
                <div className="space-y-3">
                  <div className="w-full">
                    <MeetingMaterialTaskDetail
                      task={task}
                      currentUser={currentUser}
                      onAssignDepartment={(deptId) => openDrawer(deptId)}
                      onOpenMeetingMaterialDrawer={() => openDrawer()}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <MeetingMaterialTaskDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setInitialDeptId(undefined);
        }}
        initialAssignDeptId={initialDeptId}
        taskId={task.id}
      />
    </>
  );
}
