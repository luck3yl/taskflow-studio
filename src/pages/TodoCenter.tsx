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
import { useTaskContext, Task, Assignee } from "@/contexts/TaskContext";

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/20",
  submitted: "bg-info/10 text-info border-info/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  pending: "待处理",
  submitted: "已提交",
  approved: "已通过",
  rejected: "已驳回",
};

const statusFilters = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "submitted", label: "已提交" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
];

// Current user (simulated - in real app would come from auth)
const CURRENT_USER = "张明";

export default function TodoCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<{ task: Task; assignee: Assignee } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { tasks, submitWork } = useTaskContext();

  // Get tasks assigned to current user
  const myTasks = tasks.flatMap(task => {
    const assignee = task.assignees.find(a => a.name === CURRENT_USER);
    if (assignee) {
      return [{ task, assignee }];
    }
    return [];
  });

  const filteredTasks = myTasks.filter(({ task, assignee }) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.createdBy.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || assignee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessTask = (task: Task, assignee: Assignee) => {
    setSelectedItem({ task, assignee });
    setDrawerOpen(true);
  };

  const handleSubmit = (file: File, note: string) => {
    if (!selectedItem) return;
    
    submitWork(selectedItem.task.id, selectedItem.assignee.id, {
      fileName: file.name,
      fileSize: file.size / (1024 * 1024),
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      note,
    });
    
    setDrawerOpen(false);
  };

  // Calculate deadline urgency
  const getDeadlineInfo = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return {
      hours,
      isUrgent: hours > 0 && hours < 24,
      isOverdue: hours <= 0,
    };
  };

  return (
    <AppLayout title="待办中心">
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
          {filteredTasks.map(({ task, assignee }, index) => {
            const deadlineInfo = getDeadlineInfo(task.deadline);
            const latestSubmission = assignee.submissions[assignee.submissions.length - 1];
            
            return (
              <Card 
                key={`${task.id}-${assignee.id}`}
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
                          {deadlineInfo.isUrgent && (
                            <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
                              紧急
                            </Badge>
                          )}
                        </div>
                        <Badge className={statusStyles[assignee.status]}>
                          {statusLabels[assignee.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Leader Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {task.createdByAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        <User className="inline h-3 w-3 mr-1" />
                        {task.createdBy}
                      </span>
                    </div>

                    {/* Task Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <FileText className="inline h-3 w-3 mr-1" />
                      {assignee.taskDescription}
                    </p>

                    {/* Page Range */}
                    {assignee.pageRange && (
                      <Badge variant="outline" className="text-xs">
                        负责第 {assignee.pageRange} 页
                      </Badge>
                    )}

                    {/* Reject Reason */}
                    {assignee.status === "rejected" && latestSubmission?.feedback && (
                      <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                        <p className="text-xs text-destructive font-medium">驳回原因</p>
                        <p className="text-sm text-destructive/80 mt-1">{latestSubmission.feedback}</p>
                      </div>
                    )}

                    {/* Approval Info */}
                    {assignee.status === "approved" && latestSubmission?.feedback && (
                      <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                        <p className="text-xs text-success font-medium">审批通过</p>
                        <p className="text-sm text-success/80 mt-1">{latestSubmission.feedback}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>截止：{task.deadline}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {task.templateFileName && (
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="h-8 gradient-primary"
                          onClick={() => handleProcessTask(task, assignee)}
                        >
                          {assignee.status === "pending" || assignee.status === "rejected" ? "处理" : "查看"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
        task={selectedItem?.task}
        assignee={selectedItem?.assignee}
        onSubmit={handleSubmit}
      />
    </AppLayout>
  );
}
