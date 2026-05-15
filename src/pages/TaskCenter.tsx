import { useState, useMemo, useEffect } from "react";
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
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ReviewDrawer } from "@/pages/task/components/drawers/ReviewDrawer";
import { useTaskContext, Task, Assignee, TaskType } from "@/contexts/TaskContext";
import { hasCapability, isManagementUser, useUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { TaskKanbanView } from "@/pages/task/components/TaskKanbanView";
import { TaskCalendarView } from "@/pages/task/components/TaskCalendarView";
import { TaskProgressList } from "@/pages/task/components/TaskProgressList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingMaterialTaskListItem } from "@/pages/task/meeting-materials/components/MeetingMaterialTaskListItem";
import { TaskSpecialTableView } from "@/pages/task/TaskSpecialTableView";
import { isSpecialTaskType } from "@/pages/task/specialTaskTypes";
import { StatusBadge } from "@/pages/task/meeting-materials/components/StatusBadge";
import { ASSIGNEE_STATUS_CONFIG } from "@/enums/task";

const statusStyles: Record<string, { bg: string; dot: string }> = Object.fromEntries(
  Object.entries(ASSIGNEE_STATUS_CONFIG).map(([k, v]) => [
    k,
    { bg: v.className.split(" ")[0] || "bg-muted", dot: v.dotColor || "bg-muted-foreground" },
  ])
);

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

  // 兜底：显示用户参与的 PPT 协同任务（在 deptAssignments 中有角色）以及有 formKey 的任务
  return tasks.filter(t =>
    t.createdBy === currentUser.name ||
    t.assignees.some(a => a.name === currentUser.name) ||
    (t.type === "例会资料" && t.meetingMaterialWorkflow?.deptAssignments.some(da =>
      da.headUserId === currentUser.id || da.userAssignments.some(ua => ua.userId === currentUser.id)
    )) ||
    (t.formKey && t.formKey !== "null")
  );
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
  const [selectedReview, setSelectedReview] = useState<{
    task: Task;
    assignee: Assignee;
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { tasks, refreshTasks, reviewSubmission, deleteTask } = useTaskContext();
  const { currentUser, departments } = useUserContext();
  const canManageTasks = isManagementUser(currentUser);
  const canCreateTask = hasCapability(currentUser, "task.create");

  // 从分配页面返回时刷新任务列表
  useEffect(() => {
    if ((location.state as any)?.refresh) {
      refreshTasks();
      // 清除 state 避免重复刷新
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
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

  const permissionFilteredTasks = tasks;

  const filteredTasks = useMemo(() => permissionFilteredTasks.filter((task) => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(normalizedSearch) ||
      task.description?.toLowerCase().includes(normalizedSearch);
    const matchesDepartment = departmentFilter === "all" || task.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  }), [permissionFilteredTasks, searchQuery, departmentFilter]);
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

        {filteredTasks.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center space-y-3">
              <h3 className="text-lg font-semibold text-foreground">暂无任务</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                {canCreateTask
                  ? (activeTaskType === "all" ? '点击"创建任务"开始' : `点击"新建${activeTaskType}"创建此类任务`)
                  : "当前没有需要处理的任务"}
              </p>
              {canCreateTask && (
                <Button className="mt-2 gradient-primary" onClick={() => navigate(createUrl)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {activeTaskType === "all" ? "创建任务" : `新建${activeTaskType}`}
                </Button>
              )}
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
                  // 例会资料任务使用独立组件
                  if (task.type === "例会资料" && task.meetingMaterialWorkflow) {
                    return (
                      <MeetingMaterialTaskListItem
                        key={task.id}
                        task={task}
                        index={index}
                        currentUser={currentUser}
                        onDeleteTask={deleteTask}
                      />
                    );
                  }

                  // 通用任务卡片
                  const isExpanded = expandedTasks.includes(task.id);

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
                                {/* Assignee Avatars */}
                                <div className="hidden md:flex -space-x-2">
                                  {task.assignees.slice(0, 4).map((assignee) => (
                                    <Avatar
                                      key={assignee.id}
                                      className="h-8 w-8 border-2 border-card"
                                    >
                                      <AvatarFallback className={`text-xs ${statusStyles[assignee.status]?.bg ?? "bg-muted"}`}>
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
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    子任务列表
                                  </h4>
                                </div>

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
                                            <StatusBadge status={assignee.status} type="assignee" className="mt-1" />
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
                                  ))}
                                </div>
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

    </AppLayout>
  );
}
