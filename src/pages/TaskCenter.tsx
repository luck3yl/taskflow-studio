import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Users,
  LayoutGrid,
  Trello,
  Calendar as CalendarIcon,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useNavigate, useParams } from "react-router-dom";
import { ReviewDrawer } from "@/pages/task/components/drawers/ReviewDrawer";
import { useTaskContext, Task, Assignee, TaskType } from "@/contexts/TaskContext";
import { hasCapability, isManagementUser, useUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { TaskKanbanView } from "@/pages/task/components/TaskKanbanView";
import { TaskCalendarView } from "@/pages/task/components/TaskCalendarView";
import { TaskProgressList } from "@/pages/task/components/TaskProgressList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingMaterialTaskDetail } from "@/pages/task/meeting-materials/MeetingMaterialTaskDetail";
import { MeetingMaterialTaskDrawer } from "@/pages/task/meeting-materials/MeetingMaterialTaskDrawer";
import { TaskSpecialTableView } from "@/pages/task/TaskSpecialTableView";
import { isSpecialTaskType } from "@/pages/task/specialTaskTypes";

const statusStyles = {
  pending: { bg: "bg-muted", dot: "bg-muted-foreground" },
  submitted: { bg: "bg-warning/20", dot: "bg-warning" },
  approved: { bg: "bg-success/20", dot: "bg-success" },
  rejected: { bg: "bg-destructive/20", dot: "bg-destructive" },
};

// 按管理能力返回权限过滤后的任务
function applyPermissionFilter(
  tasks: Task[],
  currentUser: ReturnType<typeof useUserContext>["currentUser"]
): Task[] {
  const canViewAll = hasCapability(currentUser, "task.view.all");
  const canMinisterReview = hasCapability(currentUser, "task.review.minister");
  const canDirectorReview = hasCapability(currentUser, "task.review.director");
  const canAssignMembers = hasCapability(currentUser, "task.assign.member");
  const canMergeTask = hasCapability(currentUser, "task.merge");
  const canCoordinateMeetingMaterialTask = (task: Task) =>
    task.type === "例会资料" &&
    (task.meetingMaterialWorkflow?.reviewerId === currentUser.id ||
      (task.allowedActions?.includes("mark_merged") ?? false));

  if (canViewAll) return tasks;
  if (canMinisterReview) {
    return tasks.filter(t =>
      t.department === currentUser.department ||
      // t.department === "全公司" ||
      t.createdBy === currentUser.name ||
      canCoordinateMeetingMaterialTask(t)
    );
  }
  if (canDirectorReview || canAssignMembers) return tasks.filter(t =>
    t.department === currentUser.department ||
    // t.department === "全公司" ||
    t.assignees.some(a => a.name === currentUser.name) ||
    t.createdBy === currentUser.name ||
    canCoordinateMeetingMaterialTask(t) ||
    (t.type === "例会资料" && t.meetingMaterialWorkflow?.deptAssignments.some(da =>
      da.headUserId === currentUser.id || da.userAssignments.some(ua => ua.userId === currentUser.id)
    ))
  );

  if (canMergeTask) {
    return tasks.filter(task => canCoordinateMeetingMaterialTask(task) || task.createdBy === currentUser.name);
  }

  return [];
}

// 用户状态标签
function userStatusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-muted/50 text-muted-foreground">待提交</Badge>;
    case "in_progress": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">编辑中</Badge>;
    case "submitted": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-amber-100/90 text-amber-700 border-amber-300">待审核</Badge>;
    case "dept_approved": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-success/10 text-success border-success/20">已通过</Badge>;
    case "final_approved": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-success/10 text-success border-success/20">已通过</Badge>;
    case "rejected": return <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-destructive/10 text-destructive border-destructive/20">已驳回</Badge>;
    default: return null;
  }
}
export default function TaskCenter() {
  const { taskType: taskTypeParam } = useParams<{ taskType?: string }>();
  const activeTaskType: TaskType | "all" = taskTypeParam ? decodeURIComponent(taskTypeParam) as TaskType : "all";

  const [viewMode, setViewMode] = useState<"list" | "kanban" | "calendar">("list");
  const [progressListOpen, setProgressListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [meetingMaterialTaskDrawerOpen, setMeetingMaterialTaskDrawerOpen] = useState(false);
  const [meetingMaterialTaskId, setMeetingMaterialTaskId] = useState<string>("");
  const [meetingMaterialTaskInitialDeptId, setMeetingMaterialTaskInitialDeptId] = useState<
    string | undefined
  >(undefined);
  const [selectedReview, setSelectedReview] = useState<{
    task: Task;
    assignee: Assignee;
  } | null>(null);

  const navigate = useNavigate();
  const { tasks, reviewSubmission, deleteTask } = useTaskContext();
  const { currentUser, departments } = useUserContext();
  const canManageTasks = isManagementUser(currentUser);
  const canCreateTask = hasCapability(currentUser, "task.create");
  const canMinisterReview = hasCapability(currentUser, "task.review.minister");
  const canMergeTask = hasCapability(currentUser, "task.merge");
  const canViewMergedFile = canMinisterReview || canMergeTask || hasCapability(currentUser, "task.view.all");
  const departmentFilters = useMemo(
    () => [
      { value: "all", label: "全部部门" },
      ...departments.map((department) => ({
        value: department.name,
        label: department.name,
      })),
    ],
    [departments]
  );

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleReview = (task: Task, assignee: Assignee) => {
    setSelectedReview({ task, assignee });
    setReviewDrawerOpen(true);
  };

  const openMeetingMaterialDrawer = (taskId: string, initialDeptId?: string) => {
    setMeetingMaterialTaskId(taskId);
    setMeetingMaterialTaskInitialDeptId(initialDeptId);
    setMeetingMaterialTaskDrawerOpen(true);
  };

  const handleApprove = () => {
    if (!selectedReview) return;
    const latestSubmission = selectedReview.assignee.submissions[selectedReview.assignee.submissions.length - 1];
    if (latestSubmission) {
      reviewSubmission(
        selectedReview.task.id,
        selectedReview.assignee.id,
        latestSubmission.id,
        true,
        "准予通过"
      );
    }
    setReviewDrawerOpen(false);
  };

  const handleReject = (feedback: string) => {
    if (!selectedReview) return;
    const latestSubmission = selectedReview.assignee.submissions[selectedReview.assignee.submissions.length - 1];
    if (latestSubmission) {
      reviewSubmission(
        selectedReview.task.id,
        selectedReview.assignee.id,
        latestSubmission.id,
        false,
        feedback
      );
    }
    setReviewDrawerOpen(false);
  };

  const permissionFilteredTasks = useMemo(() => applyPermissionFilter(tasks, currentUser), [tasks, currentUser]);

  const filteredTasks = useMemo(() => permissionFilteredTasks.filter((task) => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(normalizedSearch) ||
      task.description?.toLowerCase().includes(normalizedSearch);
    const matchesType = activeTaskType === "all" || task.type === activeTaskType;
    const matchesDepartment = departmentFilter === "all" || task.department === departmentFilter;
    return matchesSearch && matchesType && matchesDepartment;
  }), [permissionFilteredTasks, searchQuery, activeTaskType, departmentFilter]);
  const specialTaskType = isSpecialTaskType(activeTaskType) ? activeTaskType : null;

  const createUrl = activeTaskType === "all"
    ? "/tasks/create"
    : `/tasks/create/${encodeURIComponent(activeTaskType)}`;

  return (
    <AppLayout title={activeTaskType === "all" ? "任务中心" : `任务中心 · ${activeTaskType}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            {canCreateTask && (
              <Button
                className="gradient-primary"
                onClick={() => navigate(createUrl)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {activeTaskType === "all" ? "创建任务" : `新建${activeTaskType}`}
              </Button>
            )}

          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "kanban" | "calendar")} className="mr-2">
              <TabsList className="bg-secondary/50 border border-border/50">
                <TabsTrigger value="list" className="data-[state=active]:bg-background">
                  <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                  列表
                </TabsTrigger>
                <TabsTrigger value="kanban" className="data-[state=active]:bg-background">
                  <Trello className="h-3.5 w-3.5 mr-1" />
                  看板
                </TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-background">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  日历
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-32">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departmentFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!canManageTasks ? (
          <Card className="shadow-card border-amber-200 bg-amber-50/60">
            <CardContent className="p-8 text-center space-y-3">
              <h3 className="text-lg font-semibold text-foreground">当前没有可处理的管理任务</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                任务中心主要展示分配、审核、审批相关任务。当前账号没有对应任务时，可以直接前往待办中心处理执行事项。
              </p>
              <Button variant="outline" onClick={() => navigate("/todos")}>
                前往待办中心
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                当前筛选结果共 <span className="font-semibold text-foreground">{filteredTasks.length}</span> 个任务
              </span>
              {viewMode === "list" && (
                <span>展开任务可查看分配、审核和审批详情</span>
              )}
            </div>

            {/* Dynamic Views */}
            {viewMode === "list" && specialTaskType !== null && (
              <div className="space-y-4">
                <TaskSpecialTableView type={specialTaskType} />
              </div>
            )}

            {viewMode === "list" && specialTaskType === null && (
              <div className="space-y-4">
                {filteredTasks.map((task, index) => {
                  const isExpanded = expandedTasks.includes(task.id);
                  const canViewMergedMeetingMaterial = canViewMergedFile && (task.assignees.some(a => a.status === "approved" || a.status === "submitted") ||
                    !!task.meetingMaterialWorkflow?.deptAssignments.some(d =>
                      d.status === "final_approved" ||
                      d.userAssignments.some(ua =>
                        ua.status === "submitted" || ua.status === "dept_approved" || ua.status === "final_approved"
                      )
                    ));

                  return (
                    <Collapsible
                      key={task.id}
                      open={isExpanded}
                      onOpenChange={() => toggleExpand(task.id)}
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
                                      {task.department}
                                    </Badge>
                                    {task.templatePageCount && (
                                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                                        {task.templatePageCount}页
                                      </Badge>
                                    )}
                                    {canViewMergedMeetingMaterial && task.type === "例会资料" && (
                                      <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50">
                                        可查看合并稿
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      截止：{task.deadline}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                {/* Assignee Avatars */}
                                <div className="hidden md:flex -space-x-2">
                                  {task.assignees.slice(0, 4).map((assignee) => (
                                    <Avatar
                                      key={assignee.id}
                                      className="h-8 w-8 border-2 border-card"
                                    >
                                      <AvatarFallback className={`text-xs ${statusStyles[assignee.status].bg}`}>
                                        {assignee.avatar}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {task.assignees.length > 4 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                                      <span className="text-xs text-muted-foreground">
                                        +{task.assignees.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>


                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {task.type === "例会资料" && (
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        openMeetingMaterialDrawer(task.id);
                                      }}>
                                        进入例会资料工作台
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>编辑任务</DropdownMenuItem>
                                    <DropdownMenuItem>催办提醒</DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTask(task.id);
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
                              {/* Sub-task List Section */}
                              <div className="space-y-3">
                                {task.type !== "例会资料" && (
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                      <Users className="h-4 w-4 text-primary" />
                                      子任务列表
                                    </h4>
                                  </div>
                                )}

                                {task.type === "例会资料" && task.meetingMaterialWorkflow ? (
                                  <div className="w-full">
                                    <MeetingMaterialTaskDetail
                                      task={task}
                                      currentUser={currentUser}
                                      onAssignDepartment={(deptId) => {
                                        openMeetingMaterialDrawer(task.id, deptId);
                                      }}
                                      onOpenMeetingMaterialDrawer={() => {
                                        openMeetingMaterialDrawer(task.id);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {task.assignees.map((assignee) => (
                                      <div
                                        key={assignee.id}
                                        className="flex flex-col p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <div className="relative">
                                              <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                  {assignee.avatar}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusStyles[assignee.status]?.dot ?? "bg-muted-foreground"}`} />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">{assignee.name}</p>
                                              <Badge
                                                variant="outline"
                                                className={cn(
                                                  "text-xs px-2 py-0 h-5 mt-1 border shadow-none font-bold rounded",
                                                  assignee.status === "pending" && "bg-muted/50 text-muted-foreground border-muted-foreground/10",
                                                  assignee.status === "submitted" && "bg-amber-100/90 text-amber-700 border-amber-300 shadow-sm",
                                                  assignee.status === "approved" && "bg-success/10 text-success border-success/20",
                                                  assignee.status === "rejected" && "bg-destructive/10 text-destructive border-destructive/20"
                                                )}
                                              >
                                                {assignee.status === "pending" && "待提交"}
                                                {assignee.status === "submitted" && "待审核"}
                                                {assignee.status === "approved" && "已通过"}
                                                {assignee.status === "rejected" && "已驳回"}
                                              </Badge>
                                            </div>
                                          </div>
                                          {(assignee.status === "submitted" || assignee.status === "approved" || assignee.status === "rejected") && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2"
                                              onClick={() => handleReview(task, assignee)}
                                            >
                                              <Eye className="h-3.5 w-3.5 mr-1" />
                                              查看
                                            </Button>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1.5 mt-auto">
                                          <FileText className="inline h-3 w-3 mr-1" />
                                          {assignee.taskDescription}
                                        </div>
                                        {assignee.pageRange && (
                                          <Badge variant="outline" className="text-xs mt-2 w-fit">
                                            第 {assignee.pageRange} 页
                                          </Badge>
                                        )}
                                      </div>
                                    ))
                                    }
                                  </div>
                                )}
                              </div>

                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground">暂无管理任务</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {canCreateTask
                        ? (activeTaskType === "all" ? '点击"创建任务"开始分派工作' : `点击"新建${activeTaskType}"创建此类任务`)
                        : "当前岗位暂无需要处理的分配或审核动作"}
                    </p>
                    {canCreateTask && (
                      <Button className="mt-4 gradient-primary" onClick={() => navigate(createUrl)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {activeTaskType === "all" ? "创建任务" : `新建${activeTaskType}`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {viewMode === "kanban" && (
              <TaskKanbanView tasks={filteredTasks} />
            )}

            {viewMode === "calendar" && (
              <TaskCalendarView tasks={filteredTasks} />
            )}
          </>
        )}
      </div>

      {/* Review Drawer */}
      <ReviewDrawer
        open={reviewDrawerOpen}
        onOpenChange={setReviewDrawerOpen}
        task={selectedReview?.task}
        assignee={selectedReview?.assignee}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Progress List Drawer/Dialog */}
      <TaskProgressList
        open={progressListOpen}
        onOpenChange={setProgressListOpen}
        tasks={tasks}
      />

      <MeetingMaterialTaskDrawer
        open={meetingMaterialTaskDrawerOpen}
        onOpenChange={(open) => {
          setMeetingMaterialTaskDrawerOpen(open);
          if (!open) {
            setMeetingMaterialTaskInitialDeptId(undefined);
          }
        }}
        initialAssignDeptId={meetingMaterialTaskInitialDeptId}
        taskId={meetingMaterialTaskId}
      />
    </AppLayout>
  );
}
