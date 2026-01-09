import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Users,
  Calendar,
  MoreHorizontal,
  Trash2,
  Layers
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
import { useNavigate } from "react-router-dom";
import { ReviewDrawer } from "@/components/drawers/ReviewDrawer";
import { MergedPPTDrawer } from "@/components/drawers/MergedPPTDrawer";
import { useTaskContext, Task, Assignee } from "@/contexts/TaskContext";

const statusStyles = {
  pending: { bg: "bg-muted", dot: "bg-muted-foreground" },
  submitted: { bg: "bg-warning/20", dot: "bg-warning" },
  approved: { bg: "bg-success/20", dot: "bg-success" },
  rejected: { bg: "bg-destructive/20", dot: "bg-destructive" },
};

const typeFilters = [
  { value: "all", label: "全部类型" },
  { value: "周报", label: "周报" },
  { value: "月报", label: "月报" },
  { value: "年报", label: "年报" },
  { value: "专项报告", label: "专项报告" },
];

const departmentFilters = [
  { value: "all", label: "全部部门" },
  { value: "技术部", label: "技术部" },
  { value: "产品部", label: "产品部" },
  { value: "销售部", label: "销售部" },
  { value: "市场部", label: "市场部" },
  { value: "运营部", label: "运营部" },
  { value: "全公司", label: "全公司" },
];

export default function TaskCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [mergedDrawerOpen, setMergedDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedReview, setSelectedReview] = useState<{
    task: Task;
    assignee: Assignee;
  } | null>(null);
  const navigate = useNavigate();
  const { tasks, reviewSubmission, deleteTask } = useTaskContext();

  const handleViewMerged = (task: Task) => {
    setSelectedTask(task);
    setMergedDrawerOpen(true);
  };

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

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || task.type === typeFilter;
    const matchesDepartment = departmentFilter === "all" || task.department === departmentFilter;
    return matchesSearch && matchesType && matchesDepartment;
  });

  // Calculate stats
  const totalParticipants = tasks.reduce((sum, t) => sum + t.totalAssignees, 0);
  const totalCompleted = tasks.reduce((sum, t) => sum + t.completedCount, 0);
  const totalTotal = tasks.reduce((sum, t) => sum + t.totalAssignees, 0);
  const overallProgress = totalTotal > 0 ? Math.round((totalCompleted / totalTotal) * 100) : 0;

  return (
    <AppLayout title="任务中心">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            <Button 
              className="gradient-primary"
              onClick={() => navigate("/tasks/create")}
            >
              <Plus className="h-4 w-4 mr-2" />
              创建任务
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">进行中任务</p>
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
          <Card className="shadow-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallProgress}%</p>
                <p className="text-sm text-muted-foreground">整体完成率</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.map((task, index) => {
            const isExpanded = expandedTasks.includes(task.id);
            const progress = task.totalAssignees > 0 
              ? (task.completedCount / task.totalAssignees) * 100 
              : 0;

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

                          {/* Progress */}
                          <div className="hidden sm:flex items-center gap-3 min-w-[140px]">
                            <Progress value={progress} className="h-2" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {task.completedCount}/{task.totalAssignees}
                            </span>
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
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            子任务列表
                          </h4>
                          {/* View Merged PPT Button */}
                          {task.assignees.some(a => a.status === "approved" || a.status === "submitted") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewMerged(task);
                              }}
                              className="h-7"
                            >
                              <Layers className="h-3.5 w-3.5 mr-1.5" />
                              查看合并PPT
                              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                                {task.completedCount}/{task.totalAssignees}
                              </Badge>
                            </Button>
                          )}
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
                                    <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusStyles[assignee.status].dot}`} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{assignee.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {assignee.status === "pending" && "待提交"}
                                      {assignee.status === "submitted" && "待审核"}
                                      {assignee.status === "approved" && "已通过"}
                                      {assignee.status === "rejected" && "已驳回"}
                                    </p>
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
              <p className="text-sm text-muted-foreground mt-1">点击"创建任务"开始分派工作</p>
            </div>
          )}
        </div>
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

      {/* Merged PPT Drawer */}
      <MergedPPTDrawer
        open={mergedDrawerOpen}
        onOpenChange={setMergedDrawerOpen}
        task={selectedTask || undefined}
      />
    </AppLayout>
  );
}
