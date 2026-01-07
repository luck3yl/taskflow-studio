import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Clock, 
  FileText, 
  Download,
  Calendar,
  User,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskProcessDrawer } from "@/components/drawers/TaskProcessDrawer";

const tasks = [
  {
    id: "1",
    title: "Q4季度汇报PPT制作",
    leader: "王总",
    leaderAvatar: "王",
    requirement: "制作3页PPT，包含公司简介、业务数据、未来规划",
    deadline: "2024-01-15 18:00",
    status: "pending",
    statusText: "待处理",
    urgent: true,
    hasTemplate: true,
  },
  {
    id: "2",
    title: "产品功能演示文档",
    leader: "李经理",
    leaderAvatar: "李",
    requirement: "整理产品核心功能，制作演示PPT",
    deadline: "2024-01-16 12:00",
    status: "pending",
    statusText: "待处理",
    urgent: false,
    hasTemplate: true,
  },
  {
    id: "3",
    title: "年度总结报告",
    leader: "张总",
    leaderAvatar: "张",
    requirement: "完成技术部年度工作总结",
    deadline: "2024-01-18 17:00",
    status: "rejected",
    statusText: "已驳回",
    urgent: false,
    hasTemplate: false,
    rejectReason: "数据有误，请核实后重新提交",
  },
  {
    id: "4",
    title: "客户案例分析PPT",
    leader: "赵总",
    leaderAvatar: "赵",
    requirement: "分析近期成功案例，总结经验",
    deadline: "2024-01-20 17:00",
    status: "submitted",
    statusText: "已提交",
    urgent: false,
    hasTemplate: true,
  },
  {
    id: "5",
    title: "项目进度报告",
    leader: "王总",
    leaderAvatar: "王",
    requirement: "汇报当前项目进度和风险点",
    deadline: "2024-01-14 18:00",
    status: "pending",
    statusText: "待处理",
    urgent: true,
    hasTemplate: false,
  },
];

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/20",
  submitted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusFilters = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "submitted", label: "已提交" },
  { value: "rejected", label: "已驳回" },
];

export default function TodoCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.leader.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessTask = (task: typeof tasks[0]) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  return (
    <AppLayout title="代办中心">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              共有 <span className="text-primary font-medium">{filteredTasks.length}</span> 个待办任务
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务或领导..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task, index) => (
            <Card 
              key={task.id}
              className="shadow-card hover:shadow-elevated transition-all duration-200 hover:border-primary/30 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {task.title}
                        </h3>
                        {task.urgent && (
                          <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
                            紧急
                          </Badge>
                        )}
                      </div>
                      <Badge className={statusStyles[task.status as keyof typeof statusStyles]}>
                        {task.statusText}
                      </Badge>
                    </div>
                  </div>

                  {/* Leader Info */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {task.leaderAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      <User className="inline h-3 w-3 mr-1" />
                      {task.leader}
                    </span>
                  </div>

                  {/* Requirement */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <FileText className="inline h-3 w-3 mr-1" />
                    {task.requirement}
                  </p>

                  {/* Reject Reason */}
                  {task.status === "rejected" && task.rejectReason && (
                    <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                      <p className="text-xs text-destructive font-medium">驳回原因</p>
                      <p className="text-sm text-destructive/80 mt-1">{task.rejectReason}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>截止：{task.deadline}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {task.hasTemplate && (
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="h-8 gradient-primary"
                        onClick={() => handleProcessTask(task)}
                        disabled={task.status === "submitted"}
                      >
                        {task.status === "submitted" ? "已提交" : "处理"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">暂无任务</h3>
            <p className="text-sm text-muted-foreground mt-1">当前筛选条件下没有找到任务</p>
          </div>
        )}
      </div>

      {/* Task Process Drawer */}
      <TaskProcessDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={selectedTask}
      />
    </AppLayout>
  );
}
