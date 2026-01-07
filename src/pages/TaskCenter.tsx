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
  MoreHorizontal
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

const tasks = [
  {
    id: "1",
    title: "Q4季度汇报PPT",
    type: "PPT",
    department: "技术部",
    createdAt: "2024-01-10",
    deadline: "2024-01-15",
    totalAssignees: 5,
    completedCount: 3,
    status: "in_progress",
    assignees: [
      { id: "a1", name: "张明", avatar: "张", status: "submitted", submittedAt: "2024-01-13 14:30", taskDescription: "负责前3页：公司简介与业务概述" },
      { id: "a2", name: "李华", avatar: "李", status: "pending", submittedAt: null, taskDescription: "负责第4-6页：财务数据与分析" },
      { id: "a3", name: "王芳", avatar: "王", status: "approved", submittedAt: "2024-01-12 10:00", taskDescription: "负责第7-9页：市场趋势分析" },
      { id: "a4", name: "赵强", avatar: "赵", status: "approved", submittedAt: "2024-01-11 16:45", taskDescription: "负责第10-12页：未来规划" },
      { id: "a5", name: "陈静", avatar: "陈", status: "rejected", submittedAt: "2024-01-13 09:00", taskDescription: "负责最后3页：总结与致谢" },
    ],
  },
  {
    id: "2",
    title: "产品功能演示",
    type: "PPT",
    department: "产品部",
    createdAt: "2024-01-08",
    deadline: "2024-01-18",
    totalAssignees: 3,
    completedCount: 1,
    status: "in_progress",
    assignees: [
      { id: "b1", name: "刘洋", avatar: "刘", status: "approved", submittedAt: "2024-01-12 11:30", taskDescription: "产品核心功能介绍" },
      { id: "b2", name: "周婷", avatar: "周", status: "pending", submittedAt: null, taskDescription: "用户操作流程演示" },
      { id: "b3", name: "吴磊", avatar: "吴", status: "pending", submittedAt: null, taskDescription: "竞品对比分析" },
    ],
  },
  {
    id: "3",
    title: "年度工作总结",
    type: "日报",
    department: "全公司",
    createdAt: "2024-01-05",
    deadline: "2024-01-20",
    totalAssignees: 8,
    completedCount: 6,
    status: "in_progress",
    assignees: [
      { id: "c1", name: "郑伟", avatar: "郑", status: "approved", submittedAt: "2024-01-10 09:00", taskDescription: "技术部年度总结" },
      { id: "c2", name: "孙丽", avatar: "孙", status: "approved", submittedAt: "2024-01-10 10:30", taskDescription: "人事部年度总结" },
      { id: "c3", name: "马超", avatar: "马", status: "submitted", submittedAt: "2024-01-14 15:00", taskDescription: "市场部年度总结" },
      { id: "c4", name: "朱敏", avatar: "朱", status: "pending", submittedAt: null, taskDescription: "财务部年度总结" },
    ],
  },
  {
    id: "4",
    title: "客户方案设计",
    type: "PPT",
    department: "销售部",
    createdAt: "2024-01-12",
    deadline: "2024-01-22",
    totalAssignees: 2,
    completedCount: 0,
    status: "in_progress",
    assignees: [
      { id: "d1", name: "黄伟", avatar: "黄", status: "pending", submittedAt: null, taskDescription: "客户需求分析与方案框架" },
      { id: "d2", name: "林涛", avatar: "林", status: "pending", submittedAt: null, taskDescription: "报价方案与服务条款" },
    ],
  },
];

const statusStyles = {
  pending: { bg: "bg-muted", dot: "bg-muted-foreground" },
  submitted: { bg: "bg-warning/20", dot: "bg-warning" },
  approved: { bg: "bg-success/20", dot: "bg-success" },
  rejected: { bg: "bg-destructive/20", dot: "bg-destructive" },
};

const typeFilters = [
  { value: "all", label: "全部类型" },
  { value: "PPT", label: "PPT" },
  { value: "日报", label: "日报" },
  { value: "周报", label: "周报" },
];

const departmentFilters = [
  { value: "all", label: "全部部门" },
  { value: "技术部", label: "技术部" },
  { value: "产品部", label: "产品部" },
  { value: "销售部", label: "销售部" },
  { value: "全公司", label: "全公司" },
];

export default function TaskCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState<string[]>(["1"]);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<{
    taskTitle: string;
    assignee: typeof tasks[0]["assignees"][0];
  } | null>(null);
  const navigate = useNavigate();

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleReview = (taskTitle: string, assignee: typeof tasks[0]["assignees"][0]) => {
    setSelectedAssignee({ taskTitle, assignee });
    setReviewDrawerOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || task.type === typeFilter;
    const matchesDepartment = departmentFilter === "all" || task.department === departmentFilter;
    return matchesSearch && matchesType && matchesDepartment;
  });

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
                <p className="text-2xl font-bold">16</p>
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
                <p className="text-2xl font-bold">62%</p>
                <p className="text-sm text-muted-foreground">整体完成率</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.map((task, index) => {
            const isExpanded = expandedTasks.includes(task.id);
            const progress = (task.completedCount / task.totalAssignees) * 100;

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
                                <AvatarFallback className={`text-xs ${statusStyles[assignee.status as keyof typeof statusStyles].bg}`}>
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
                              <DropdownMenuItem className="text-destructive">
                                结束任务
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
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          子任务列表
                        </h4>
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
                                    <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusStyles[assignee.status as keyof typeof statusStyles].dot}`} />
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
                                {(assignee.status === "submitted" || assignee.status === "approved") && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => handleReview(task.title, assignee)}
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
        </div>
      </div>

      {/* Review Drawer */}
      <ReviewDrawer
        open={reviewDrawerOpen}
        onOpenChange={setReviewDrawerOpen}
        taskTitle={selectedAssignee?.taskTitle}
        assignee={selectedAssignee?.assignee}
      />
    </AppLayout>
  );
}
