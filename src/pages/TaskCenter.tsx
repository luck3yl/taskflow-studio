import { useState } from "react";
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
  Layers,
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
import { ReviewDrawer } from "@/components/drawers/ReviewDrawer";
import { PptTaskDrawer } from "@/components/drawers/PptTaskDrawer";
import { useTaskContext, Task, Assignee, TaskType } from "@/contexts/TaskContext";
import { useUserContext } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { TaskKanbanView } from "@/components/task/TaskKanbanView";
import { TaskCalendarView } from "@/components/task/TaskCalendarView";
import { TaskProgressList } from "@/components/task/TaskProgressList";
import { PptTaskDetail } from "@/components/task/PptTaskDetail";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusStyles = {
  pending: { bg: "bg-muted", dot: "bg-muted-foreground" },
  submitted: { bg: "bg-warning/20", dot: "bg-warning" },
  approved: { bg: "bg-success/20", dot: "bg-success" },
  rejected: { bg: "bg-destructive/20", dot: "bg-destructive" },
};

// 按职级返回权限过滤后的任务
function applyPermissionFilter(
  tasks: Task[],
  currentUser: ReturnType<typeof useUserContext>["currentUser"]
): Task[] {
  const roles = (currentUser as any).roles ?? [currentUser.role];
  const isAdmin = roles.includes("设备部长") || roles.includes("设备厂长");
  const isVice = !isAdmin && roles.includes("分管副部长");
  const isRoom = !isAdmin && !isVice && (roles.includes("室主任") || roles.includes("设备组长"));

  if (isAdmin) return tasks;
  if (isVice) return tasks.filter(t => t.department === currentUser.department || t.department === "全公司" || t.createdBy === currentUser.name);
  if (isRoom) return tasks.filter(t =>
    t.department === currentUser.department ||
    t.department === "全公司" ||
    t.assignees.some(a => a.name === currentUser.name) ||
    t.createdBy === currentUser.name ||
    (t.type === "例会资料" && t.pptWorkflow?.deptAssignments.some(da =>
      da.headUserId === currentUser.id || da.userAssignments.some(ua => ua.userId === currentUser.id)
    ))
  );
  // 普通员工：任务中心只看自己创建的，参与的去待办中心
  return tasks.filter(t => t.createdBy === currentUser.name);
}

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
const departmentFilters = [
  { value: "all", label: "全部部门" },
  { value: "设备部", label: "设备部" },
  { value: "技术部", label: "技术部" },
  { value: "产品部", label: "产品部" },
  { value: "运营部", label: "运营部" },
  { value: "全公司", label: "全公司" },
];

export default function TaskCenter() {
  const { taskType: taskTypeParam } = useParams<{ taskType?: string }>();
  const activeTaskType: TaskType | "all" = taskTypeParam ? decodeURIComponent(taskTypeParam) as TaskType : "all";

  const [viewMode, setViewMode] = useState<"list" | "kanban" | "calendar">("list");
  const [progressListOpen, setProgressListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [pptTaskDrawerOpen, setPptTaskDrawerOpen] = useState(false);
  const [pptTaskId, setPptTaskId] = useState<string>("");
  const [selectedReview, setSelectedReview] = useState<{
    task: Task;
    assignee: Assignee;
  } | null>(null);

  const navigate = useNavigate();
  const { tasks, reviewSubmission, deleteTask } = useTaskContext();
  const { currentUser } = useUserContext();
  const roles = (currentUser as any).roles ?? [currentUser.role];
  const isRoomHead = roles.includes("室主任") || roles.includes("设备组长");
  const canViewMergedFile = !isRoomHead;

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

  // 权限过滤后的可见任务
  const permissionFilteredTasks = applyPermissionFilter(tasks, currentUser);

  const filteredTasks = permissionFilteredTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeTaskType === "all" || task.type === activeTaskType;
    const matchesDepartment = departmentFilter === "all" || task.department === departmentFilter;
    return matchesSearch && matchesType && matchesDepartment;
  });

  const totalParticipants = permissionFilteredTasks.reduce((sum, t) => sum + t.totalAssignees, 0);

  const createUrl = activeTaskType === "all"
    ? "/tasks/create"
    : `/tasks/create/${encodeURIComponent(activeTaskType)}`;

  return (
    <AppLayout title={activeTaskType === "all" ? "任务中心" : `任务中心 · ${activeTaskType}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="gradient-primary"
              onClick={() => navigate(createUrl)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTaskType === "all" ? "创建任务" : `新建${activeTaskType}`}
            </Button>

          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mr-2">
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

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredTasks.length}</p>
                <p className="text-sm text-muted-foreground">{activeTaskType === "all" ? "进行中任务" : `${activeTaskType}任务`}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl gradient-success flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">参与人员</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Views */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredTasks.map((task, index) => {
              const isExpanded = expandedTasks.includes(task.id);
              const progress = task.totalAssignees > 0
                ? (task.completedCount / task.totalAssignees) * 100
                : 0;
              const isMyPptDeptHead = task.type === "例会资料" && !!task.pptWorkflow?.deptAssignments.some(
                dept => dept.headUserId === currentUser.id
              );
              const canViewMergedPpt = canViewMergedFile && (task.assignees.some(a => a.status === "approved" || a.status === "submitted") ||
                !!task.pptWorkflow?.deptAssignments.some(d =>
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
                            <div>
                              <CardTitle className="text-base">{task.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {task.type}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {task.department}
                                </Badge>
                                {task.templatePageCount && (
                                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                                    {task.templatePageCount}页
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
                                    setPptTaskId(task.id);
                                    setPptTaskDrawerOpen(true);
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

                            {task.type === "例会资料" && task.pptWorkflow ? (
                              <div className="w-full">
                                <PptTaskDetail
                                  task={task}
                                  currentUser={currentUser}
                                  onOpenPptDrawer={() => {
                                    setPptTaskId(task.id);
                                    setPptTaskDrawerOpen(true);
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
                <h3 className="font-medium text-foreground">暂无任务</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {activeTaskType === "all" ? "点击\"创建任务\"开始分派工作" : `点击\"新建${activeTaskType}\"创建此类任务`}
                  </p>
                  <Button className="mt-4 gradient-primary" onClick={() => navigate(createUrl)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTaskType === "all" ? "创建任务" : `新建${activeTaskType}`}
                  </Button>
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

      <PptTaskDrawer
        open={pptTaskDrawerOpen}
        onOpenChange={setPptTaskDrawerOpen}
        taskId={pptTaskId}
      />
    </AppLayout>
  );
}
